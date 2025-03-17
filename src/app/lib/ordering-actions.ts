'use server'

import {
    CouponCode,
    ItemType,
    OptionItem,
    OrderStatus,
    OrderType,
    PaymentMethod,
    PaymentStatus,
    PrismaClient,
    User,
    UserAuditLogType
} from '@prisma/client'
import { OrderedItemTemplate } from '@/app/lib/shopping-cart'
import { getMyUser } from '@/app/login/login-actions'
import Decimal from 'decimal.js'
import { getConfigValue, getConfigValueAsBoolean, getConfigValueAsNumber } from '@/app/lib/settings-actions'

const prisma = new PrismaClient()

export interface HydratedOrderedItem {
    id: number
    orderId: number
    itemType: ItemType
    itemTypeId: number
    appliedOptions: OptionItem[]
    amount: number
    price: string
}

export interface HydratedOrder {
    id: number
    items: HydratedOrderedItem[]
    totalPrice: string
    totalPriceRaw: string
    status: OrderStatus
    createdAt: Date
    updatedAt: Date
    type: OrderType
    deliveryRoom: string | null
    user: User | null
    userId: number | null
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
    wxPayId: string | null
}

export interface EstimatedWaitTimeResponse {
    time: number
    cups: number
    orders: number
}

export async function couponQuickValidate(code: string): Promise<CouponCode | null> {
    return prisma.couponCode.findUnique({
        where: {
            id: code,
            remainingUses: {
                gt: 0
            }
        }
    })
}

function calculatePrice(item: OrderedItemTemplate): Decimal {
    let price = Decimal(item.item.basePrice)
    for (const option of item.options) {
        if (option == null) {
            continue
        }
        price = price.add(Decimal(option.priceChange))
    }
    price = price.mul(Decimal(item.item.salePercent))
    return price.mul(item.amount)
}

export async function getOrder(id: number): Promise<HydratedOrder | null> {
    return prisma.order.findUnique({
        where: {
            id
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

export async function canPayWithBalance(totalPrice: string): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    return Decimal(me.balance).gte(totalPrice)
}

export async function canPayWithPayLater(): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    return await prisma.order.count({
        where: {
            userId: me.id,
            paymentStatus: PaymentStatus.notPaid
        }
    }) === 0
}

export async function getUnpaidPayLaterOrder(): Promise<number> {
    const me = await getMyUser()
    if (me == null) {
        return -1
    }
    const order = await prisma.order.findFirst({
        where: {
            userId: me.id,
            paymentStatus: PaymentStatus.notPaid
        }
    })
    return order?.id ?? -1
}

export async function payLaterBalance(id: number): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    const order = await prisma.order.findUnique({
        where: {
            id,
            paymentStatus: PaymentStatus.notPaid
        }
    })
    if (order == null) {
        return false
    }
    if (Decimal(me.balance).lt(order.totalPrice)) {
        return false
    }
    await prisma.user.update({
        where: {
            id: me.id
        },
        data: {
            balance: Decimal(me.balance).minus(order.totalPrice).toString()
        }
    })

    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.balanceUsed,
            user: {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            },
            values: [ order.totalPrice, Decimal(me.balance).minus(order.totalPrice).toString() ]
        }
    })

    await prisma.order.update({
        where: {
            id
        },
        data: {
            paymentStatus: PaymentStatus.paid
        }
    })

    await prisma.user.update({
        where: {
            id: me.id
        },
        data: {
            points: Decimal(me.points).add(order.totalPriceRaw).toString()
        }
    })

    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.pointsUpdated,
            user: {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            },
            values: [ order.totalPriceRaw, Decimal(me.points).add(order.totalPriceRaw).toString() ]
        }
    })
    return true
}

export async function isStoreOpen(): Promise<boolean> {
    if (await getConfigValueAsBoolean('enable-scheduled-availability')) {
        const now = new Date()
        const openTime = await getConfigValue('open-time')
        const closeTime = await getConfigValue('close-time')
        if (now.getHours() < parseInt(openTime.split(':')[0]) || now.getHours() > parseInt(closeTime.split(':')[0])) {
            return false
        }
        if (now.getHours() === parseInt(openTime.split(':')[0]) && now.getMinutes() < parseInt(openTime.split(':')[1])) {
            return false
        }
        if (now.getHours() === parseInt(closeTime.split(':')[0]) && now.getMinutes() > parseInt(closeTime.split(':')[1])) {
            return false
        }
        return !(await getConfigValueAsBoolean('weekdays-only') && (now.getDay() === 0 || now.getDay() === 6))
    }
    return await getConfigValueAsBoolean('store-open')
}

export async function isMaximumCupsReached(): Promise<boolean> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return ((await prisma.orderedItem.aggregate({
        _sum: {
            amount: true
        },
        where: {
            order: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        }
    }))._sum.amount ?? 0) >= await getConfigValueAsNumber('maximum-cups-per-day')
}

export async function createOrder(items: OrderedItemTemplate[],
                                  coupon: string | null,
                                  onSiteOrderMode: boolean,
                                  deliveryRoom: string | null,
                                  paymentMethod: PaymentMethod): Promise<HydratedOrder | null> {
    const me = await getMyUser()

    // We didn't perform atomization - for a small use case like this, we should be fine.

    // SANITY CHECKS - These should be enforced by the frontend as well
    // On site order mode require administrative permissions
    if (onSiteOrderMode && (me == null || !me.permissions.includes('admin.manage'))) {
        return null
    }

    // Ensure store is open and we aren't at capacity
    if (!(await isStoreOpen()) || await isMaximumCupsReached()) {
        return null
    }

    // Ensure we didn't go over maximum cups per order
    const totalAmount = items.reduce((acc, item) => acc + item.amount, 0)
    if (totalAmount < 0 || totalAmount > await getConfigValueAsNumber('maximum-cups-per-order')) {
        return null
    }

    if (!(await getConfigValueAsBoolean('allow-pay-later')) && paymentMethod === PaymentMethod.payLater) {
        return null
    }

    // Ensure items and options aren't sold out
    for (const item of items) {
        if (item.item.soldOut) {
            return null
        }
        for (const option of item.options) {
            if (option.soldOut) {
                return null
            }
        }
    }

    // Calculate total price
    let usedCoupon = false
    const totalPriceNoCoupon = items.reduce((acc, item) => acc.add(calculatePrice(item)), new Decimal(0))
    let totalPrice = totalPriceNoCoupon
    if (coupon != null) {
        const couponCode = await couponQuickValidate(coupon)
        if (couponCode == null) {
            return null
        }
        totalPrice = totalPrice.minus(Decimal.min(totalPrice, Decimal(couponCode.value)))
        await prisma.couponCode.update({
            where: {
                id: couponCode.id
            },
            data: {
                remainingUses: {
                    decrement: 1
                }
            }
        })
        usedCoupon = true
    }

    // Cash payment is only available with on-site
    if (paymentMethod === PaymentMethod.cash && !onSiteOrderMode) {
        return null
    }

    // Balance payment is only available with user and when balance is sufficient
    if (paymentMethod === PaymentMethod.balance) {
        if (me == null) {
            return null
        }
        if (Decimal(me.balance).lt(totalPrice)) {
            return null
        }
        await prisma.user.update({
            where: {
                id: me.id
            },
            data: {
                balance: Decimal(me.balance).minus(totalPrice).toString()
            }
        })
    }

    // Delivery room must be over 3 characters
    if (deliveryRoom != null && deliveryRoom.length < 3) {
        return null
    }

    // No using pay later if you're not logged in or have unpaid orders before
    if (paymentMethod === PaymentMethod.payLater) {
        if (me == null) {
            return null
        }
        if (await prisma.order.count({
            where: {
                userId: me.id,
                paymentStatus: PaymentStatus.notPaid
            }
        }) > 0) {
            return null
        }
    }

    // Pay later, balance, and pay for me aren't available with on-site
    if ((paymentMethod === PaymentMethod.payLater || paymentMethod === PaymentMethod.balance || paymentMethod === PaymentMethod.payForMe) && onSiteOrderMode) {
        return null
    }

    const order = await prisma.order.create({
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            },
            user: true
        },
        data: {
            items: {
                create: items.map(item => ({
                    itemType: {
                        connect: {
                            id: item.item.id
                        }
                    },
                    appliedOptions: {
                        connect: item.options.map(option => ({
                            id: option.id
                        }))
                    },
                    amount: item.amount,
                    price: calculatePrice(item).toString()
                }))
            },
            totalPrice: totalPrice.toString(),
            totalPriceRaw: totalPriceNoCoupon.toString(),
            status: OrderStatus.waiting,
            type: deliveryRoom == null ? OrderType.pickUp : OrderType.delivery,
            deliveryRoom,
            user: (onSiteOrderMode || me == null) ? undefined : {
                connect: {
                    id: me?.id
                }
            },
            paymentStatus: (totalPrice.eq(0) || paymentMethod === PaymentMethod.cash || paymentMethod === PaymentMethod.balance) ? PaymentStatus.paid : PaymentStatus.notPaid,
            paymentMethod
        }
    })

    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.orderCreated,
            user: me == null ? undefined : {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            }
        }
    })
    if (usedCoupon) {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.couponUsed,
                user: me == null ? undefined : {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ coupon! ]
            }
        })
    }

    // Add points to user
    if (me != null && order.paymentStatus === PaymentStatus.paid) {
        await prisma.user.update({
            where: {
                id: me.id
            },
            data: {
                points: Decimal(me.points).add(totalPriceNoCoupon).toString()
            }
        })

        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.pointsUpdated,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ totalPriceNoCoupon.toString(), Decimal(me.points).add(totalPriceNoCoupon).toString() ]
            }
        })
    }

    if (order.paymentMethod === PaymentMethod.cash) {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderPaymentSuccess,
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ 'cash', totalPrice.toString() ]
            }
        })
    }

    if (me != null && order.paymentMethod === PaymentMethod.balance) {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.balanceUsed,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ totalPrice.toString(), Decimal(me.balance).minus(totalPrice).toString() ]
            }
        })
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderPaymentSuccess,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ 'balance', totalPrice.toString() ]
            }
        })
    }

    return order
}

export async function getEstimatedWaitTime(): Promise<EstimatedWaitTimeResponse> {
    const orders = await prisma.order.findMany({
        where: {
            status: OrderStatus.waiting,
            OR: [
                {
                    paymentStatus: PaymentStatus.paid
                },
                {
                    paymentMethod: PaymentMethod.payLater
                }
            ]
        },
        include: {
            items: true
        }
    })
    let cups = 0
    for (const order of orders) {
        for (const item of order.items) {
            cups += item.amount
        }
    }
    return {
        time: cups * 2, // Assuming 2 minutes per cup
        cups,
        orders: orders.length
    }
}

export async function getEstimatedWaitTimeFor(order: number): Promise<EstimatedWaitTimeResponse> {
    const o = await prisma.order.findUnique({
        where: {
            id: order
        }
    })
    if (o == null) {
        return {
            time: 0,
            cups: 0,
            orders: 0
        }
    }
    const orders = await prisma.order.findMany({
        where: {
            status: OrderStatus.waiting,
            createdAt: {
                lte: o.createdAt
            },
            OR: [
                {
                    paymentStatus: PaymentStatus.paid
                },
                {
                    paymentMethod: PaymentMethod.payLater
                }
            ]
        },
        include: {
            items: true
        }
    })
    let cups = 0
    for (const order of orders) {
        for (const item of order.items) {
            cups += item.amount
        }
    }
    return {
        time: cups * 2, // Assuming 2 minutes per cup
        cups,
        orders: orders.length
    }
}

export async function cancelUnpaidOrder(id: number): Promise<OrderedItemTemplate[]> {
    const order = await prisma.order.findUnique({
        where: {
            id,
            paymentStatus: PaymentStatus.notPaid
        },
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            }
        }
    })
    if (order == null) {
        return []
    }
    await prisma.order.delete({
        where: {
            id
        }
    })
    return order.items.map(item => ({
        item: item.itemType,
        amount: item.amount,
        options: item.appliedOptions
    }))
}
