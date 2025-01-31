'use server'

import Paginated from '@/app/lib/Paginated'
import {
    NotificationType,
    Order,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PrismaClient,
    UserAuditLogType
} from '@prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'
import { HydratedUserAuditLog } from '@/app/lib/user-actions'
import Decimal from 'decimal.js'
import { getOrder, HydratedOrder } from '@/app/lib/ordering-actions'
import { sendNotification } from '@/app/lib/notification-actions'
import { me } from '@/app/login/login'
import md5 from 'md5'

const prisma = new PrismaClient()
const userAgent = 'Whale Cafe (Weixin Pay Client)'

export async function getAuditLogs(page: number): Promise<Paginated<HydratedUserAuditLog>> {
    await requireUserPermission('admin.manage')
    const pages = Math.ceil(await prisma.userAuditLog.count() / 10)
    const logs = await prisma.userAuditLog.findMany({
        orderBy: {
            time: 'desc'
        },
        include: {
            user: true
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: logs,
        page,
        pages
    }
}

export async function getUserOrders(page: number, userId: number): Promise<Paginated<Order>> {
    await requireUserPermission('admin.manage')
    const pages = Math.ceil(await prisma.order.count({
        where: {
            userId
        }
    }) / 10)
    const orders = await prisma.order.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: orders,
        page,
        pages
    }
}

export async function setUserPoints(userId: number, points: string): Promise<void> {
    const me = await requireUserPermission('admin.manage')
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            points: true
        }
    })
    if (user == null) {
        return
    }
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            points: Decimal(points).toString()
        }
    })
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.pointsUpdated,
            user: {
                connect: {
                    id: userId
                }
            },
            values: [ Decimal(points).minus(user.points).toString(), Decimal(points).toString(), me.id.toString() ]
        }
    })
}

export async function getOrders(page: number): Promise<Paginated<Order>> {
    await requireUserPermission('admin.manage')
    const pages = Math.ceil(await prisma.order.count() / 10)
    const orders = await prisma.order.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: orders,
        page,
        pages
    }
}

export async function getTodayOrders(): Promise<HydratedOrder[]> {
    await requireUserPermission('admin.manage')
    return prisma.order.findMany({
        where: {
            createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        },
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            },
            user: true
        }
    })
}

export async function markOrderDone(id: number): Promise<void> {
    const me = await requireUserPermission('admin.manage')
    const order = await prisma.order.update({
        where: {
            id
        },
        data: {
            status: OrderStatus.done
        },
        include: {
            user: true
        }
    })
    if (order == null) {
        return
    }
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.orderSetStatus,
            user: {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id
                }
            },
            values: [ 'done' ]
        }
    })
    if (order.user != null) {
        await sendNotification(order.user, NotificationType.pickupReminder, [], order.id)
    }
}

export async function refundOrder(id: number): Promise<boolean> {
    await requireUserPermission('admin.manage')
    const order = await getOrder(id)
    if (order == null) {
        return false
    }
    if (new Date().getTime() - order.createdAt.getTime() > 90 * 24 * 60 * 60 * 1000) {
        return false
    }

    if (order.paymentMethod === PaymentMethod.cash) {
        await finishRefunding(order)
        return true
    }
    if (order.paymentMethod === PaymentMethod.balance || (order.paymentMethod === PaymentMethod.payLater && order.wxPayId == null)) {
        await refundBalance(order)
        await finishRefunding(order)
        return true
    }
    if (order.paymentMethod === PaymentMethod.wxPay || order.paymentMethod === PaymentMethod.payForMe) {
        if (!(await refundWeixinPay(order))) {
            return false
        }
        await finishRefunding(order)
        return true
    }
    return false
}

async function finishRefunding(order: HydratedOrder): Promise<void> {
    await prisma.order.update({
        where: {
            id: order.id
        },
        data: {
            paymentStatus: PaymentStatus.refunded
        }
    })
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.orderRefunded,
            user: {
                connect: {
                    id: (await me())!
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            },
            values: [ order.totalPrice ]
        }
    })
    if (order.user != null) {
        await sendNotification(order.user, NotificationType.orderRefunded, [ order.totalPrice ], order.id)
    }
}

// ONLY required parameters need to go into the signature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function signData(params: any): string {
    const key = process.env.WXPAY_MCH_KEY
    const paramsArr = Object.keys(params)
    paramsArr.sort()
    const stringArr = []
    paramsArr.map(key => {
        stringArr.push(`key=${params[key]}`)
    })
    stringArr.push(`key=${key}`)
    return md5(stringArr.join('&')).toString().toUpperCase()
}

function getOrderTransactionNo(order: HydratedOrder): string {
    return `${order.id}-ORDER${order.createdAt.getTime()}`
}

async function refundWeixinPay(order: HydratedOrder): Promise<boolean> {
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return true
    }
    const data = {
        out_trade_no: getOrderTransactionNo(order),
        mch_id: process.env.WX_PAY_MCH_ID,
        money: order.totalPrice
    }
    const r = await fetch('https://api.pay.yungouos.com/api/pay/wxpay/refundOrder', {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            ...data,
            sign: signData(data)
        })
    })
    const resp = await r.json()
    return resp.code === 0
}

async function refundBalance(order: HydratedOrder): Promise<void> {
    await prisma.user.update({
        where: {
            id: order.userId!
        },
        data: {
            balance: Decimal(order.user!.balance).plus(order.totalPrice).toString()
        }
    })
}

export async function getWaitingOrders(): Promise<{ [id: number]: HydratedOrder }> {
    await requireUserPermission('admin.manage')
    const orders = await prisma.order.findMany({
        where: {
            status: OrderStatus.waiting,
            OR: [
                {
                    paymentStatus: PaymentStatus.paid
                },
                {
                    paymentStatus: PaymentStatus.notPaid,
                    paymentMethod: PaymentMethod.payLater
                }
            ]
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            },
            user: true
        }
    })
    const result: { [id: number]: HydratedOrder } = {}
    for (const order of orders) {
        result[order.id] = order
    }
    return result
}
