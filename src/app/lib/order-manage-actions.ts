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
import type { HydratedOrder } from '@/app/lib/ordering-actions'
import { sendNotification } from '@/app/lib/notification-send'
import { prisma } from '@/app/lib/prisma'
import { stripe } from '@/app/lib/stripe'
import { findHydratedOrder } from '@/app/lib/order-queries'
import { adjustUserBalance, adjustUserPoints } from '@/app/lib/user-balance'
import { parseMoneyAmount } from '@/app/lib/pricing'
import { getOrderTransactionNo, refundWeixinPay } from '@/app/lib/wx-pay-api'
import { listHydratedWaitingOrders } from '@/app/lib/order-queries'

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
    const value = parseMoneyAmount(points)
    if (!Number.isSafeInteger(userId) || value == null) {
        throw new Error('Bad request')
    }
    await prisma.$transaction(async tx => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { points: true }
        })
        if (user == null) {
            return
        }
        const updated = await adjustUserPoints(tx, userId, value.minus(user.points))
        await tx.userAuditLog.create({
            data: {
                type: UserAuditLogType.pointsUpdated,
                userId,
                values: [ value.minus(user.points).toString(), updated.toString(), me.id.toString() ]
            }
        })
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
    const updated = await prisma.order.updateMany({
        where: {
            id,
            status: OrderStatus.waiting
        },
        data: {
            status: OrderStatus.done
        }
    })
    if (updated.count < 1) {
        // Already done (e.g. double click) or missing
        return
    }
    const order = await prisma.order.findUniqueOrThrow({
        where: { id },
        select: { id: true, userId: true }
    })
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.orderSetStatus,
            userId: me.id,
            orderId: id,
            values: [ 'done' ]
        }
    })
    if (order.userId != null) {
        await sendNotification(order.userId, NotificationType.pickupReminder, [], order.id)
    }
}

type RefundChannel = 'none' | 'balance' | 'wxPay' | 'stripe'

function getRefundChannel(order: HydratedOrder): RefundChannel | null {
    if (order.paymentMethod === PaymentMethod.cash || Decimal(order.totalPrice).eq(0)) {
        return 'none'
    }
    if (order.paymentMethod === PaymentMethod.balance) {
        return 'balance'
    }
    if (order.wxPayId != null) {
        return 'wxPay'
    }
    if (order.stripePaymentIntent != null) {
        return 'stripe'
    }
    if (order.paymentMethod === PaymentMethod.wxPay) {
        return 'wxPay'
    }
    return null
}

export async function refundOrder(id: number): Promise<boolean> {
    const admin = await requireUserPermission('admin.manage')
    const order = await findHydratedOrder(id)
    if (order == null) {
        return false
    }
    if (new Date().getTime() - order.createdAt.getTime() > 90 * 24 * 60 * 60 * 1000) {
        return false
    }
    const channel = getRefundChannel(order)
    if (channel == null || (channel === 'balance' && order.userId == null)) {
        return false
    }

    // Claim the refund first so that concurrent requests (e.g. a double click) can only refund once
    const claimed = await prisma.order.updateMany({
        where: {
            id: order.id,
            paymentStatus: PaymentStatus.paid
        },
        data: {
            paymentStatus: PaymentStatus.refunded
        }
    })
    if (claimed.count !== 1) {
        return false
    }

    let success = true
    if (channel === 'wxPay') {
        success = await refundWeixinPay(getOrderTransactionNo(order), order.totalPrice)
    } else if (channel === 'stripe') {
        success = await refundStripe(order.stripePaymentIntent!)
    }
    if (!success) {
        // Give the order back its paid status so the refund can be retried
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: PaymentStatus.paid }
        })
        return false
    }

    await prisma.$transaction(async tx => {
        if (channel === 'balance') {
            const balance = await adjustUserBalance(tx, order.userId!, order.totalPrice)
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.balanceUsed,
                    userId: order.userId,
                    orderId: order.id,
                    values: [ Decimal(order.totalPrice).negated().toString(), balance.toString() ]
                }
            })
        }
        // Take back the points earned with this order
        if (order.userId != null) {
            const points = await adjustUserPoints(tx, order.userId, Decimal(order.totalPriceRaw).negated())
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.pointsUpdated,
                    userId: order.userId,
                    orderId: order.id,
                    values: [ Decimal(order.totalPriceRaw).negated().toString(), points.toString() ]
                }
            })
        }
        // If the order was not prepared yet, the inventory it reserved becomes available again
        if (order.status === OrderStatus.waiting) {
            for (const item of order.items) {
                if (item.itemType.inventoryTrackingEnabled) {
                    await tx.itemType.update({
                        where: { id: item.itemTypeId },
                        data: { remainingItems: { increment: item.amount } }
                    })
                }
            }
        }
        await tx.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderRefunded,
                userId: admin.id,
                orderId: order.id,
                values: [ order.totalPrice ]
            }
        })
    })
    if (order.userId != null) {
        await sendNotification(order.userId, NotificationType.orderRefunded, [ order.totalPrice ], order.id)
    }
    return true
}

async function refundStripe(paymentIntent: string): Promise<boolean> {
    try {
        await stripe.refunds.create({
            payment_intent: paymentIntent
        })
    } catch (e) {
        console.error('Stripe refund failed', paymentIntent, e)
        return false
    }
    return true
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
