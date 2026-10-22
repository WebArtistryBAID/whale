'use server'

import Paginated from '@/app/lib/Paginated'
import {
    NotificationType,
    Order,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    UserAuditLogType
} from '@/generated/prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'
import { HydratedUserAuditLog } from '@/app/lib/user-actions'
import Decimal from 'decimal.js'
import { HydratedOrder } from '@/app/lib/ordering-actions'
import { sendNotification } from '@/app/lib/notification-service'
import signData from '@/app/lib/wx-pay-sign'
import { prisma } from '@/app/lib/prisma'
import { listHydratedWaitingOrders } from '@/app/lib/waiting-orders'
import { money } from '@/app/lib/security'

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
    if (!money(points)) throw new Error('Invalid points')
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
    const actor = await requireUserPermission('admin.manage')
    try {
        const order = await prisma.$transaction(async tx => {
            const order = await tx.order.findUnique({ where: { id }, include: { user: true, items: { include: { itemType: true, appliedOptions: true } } } })
            if (!order || order.paymentStatus !== PaymentStatus.paid || Date.now() - order.createdAt.getTime() > 90 * 86400000) return null
            // Historical provider payments remain available for manual reconciliation.
            if (order.stripeSession || order.stripePaymentIntent) return null
            const balancePayment = order.paymentMethod === PaymentMethod.balance || (order.paymentMethod === PaymentMethod.payLater && !order.wxPayId)
            const onlinePayment = order.paymentMethod === PaymentMethod.wxPay || (order.paymentMethod === PaymentMethod.payLater && !!order.wxPayId)
            if (!balancePayment && !onlinePayment && order.paymentMethod !== PaymentMethod.cash) return null
            const claimed = await tx.order.updateMany({ where: { id, paymentStatus: PaymentStatus.paid }, data: { paymentStatus: PaymentStatus.refunded } })
            if (claimed.count !== 1) return null
            if (balancePayment) {
                const debit = await tx.userAuditLog.findFirst({ where: { orderId: id, type: UserAuditLogType.balanceUsed }, orderBy: { time: 'asc' } })
                const payerId = debit?.userId ?? order.userId
                if (payerId == null) throw new Error('Missing payer')
                const payer = await tx.user.findUniqueOrThrow({ where: { id: payerId } })
                const credited = await tx.user.updateMany({
                    where: { id: payerId, balance: payer.balance },
                    data: { balance: Decimal(payer.balance).add(order.totalPrice).toFixed(2) }
                })
                if (credited.count !== 1) throw new Error('Balance changed during refund')
            }
            if (onlinePayment && !await refundWeixinPay(order)) throw new Error('Refund failed')
            await tx.userAuditLog.create({ data: { type: UserAuditLogType.orderRefunded, userId: actor.id, orderId: id, values: [order.totalPrice] } })
            return order
        }, { timeout: 15000 })
        if (!order) return false
        if (order.user) {
            try { await sendNotification(order.user, NotificationType.orderRefunded, [order.totalPrice], id) } catch (error) { console.error('Refund notification failed', error) }
        }
        return true
    } catch { return false }
}

function getOrderTransactionNo(order: HydratedOrder): string {
    return `${order.id}-ORDER${order.createdAt.getTime()}`
}

async function refundWeixinPay(order: HydratedOrder): Promise<boolean> {
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return false
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
        signal: AbortSignal.timeout(10000),
        body: new URLSearchParams({
            ...data,
            out_trade_refund_no: `refund-order-${order.id}`,
            sign: signData(data)
        })
    })
    const resp = await r.json()
    return resp.code === 0
}

export async function getWaitingOrders(): Promise<{ [id: number]: HydratedOrder }> {
    await requireUserPermission('admin.manage')
    const orders = await listHydratedWaitingOrders()
    const result: { [id: number]: HydratedOrder } = {}
    for (const order of orders) {
        result[order.id] = order
    }
    return result
}
