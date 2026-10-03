import 'server-only'
import Decimal from 'decimal.js'
import { NotificationType, PaymentMethod, PaymentStatus, UserAuditLogType } from '@/generated/prisma/client'
import { prisma } from '@/app/lib/prisma'
import { adjustUserBalance, adjustUserPoints } from '@/app/lib/user-balance'
import { sendNotification } from '@/app/lib/notification-send'

export type FulfillmentResult = 'paid' | 'already-paid' | 'duplicate-payment' | 'not-found' | 'amount-mismatch'

export interface OrderPaymentDetails {
    channel: 'wxpay' | 'stripe'
    amount: Decimal.Value
    wxPayId?: string
    stripePaymentIntent?: string | null
    stripeCustomerId?: string | null
}

/**
 * Marks an order as paid exactly once. Safe to call repeatedly for the same payment (webhooks are retried).
 */
export async function fulfillOrderPayment(orderId: number, details: OrderPaymentDetails): Promise<FulfillmentResult> {
    const result = await prisma.$transaction(async tx => {
        const locked = await tx.$queryRaw<{ id: number }[]>`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`
        if (locked.length < 1) {
            return { result: 'not-found' as const, userId: null }
        }
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } })
        if (order.paymentStatus !== PaymentStatus.notPaid) {
            const samePayment = (details.wxPayId != null && order.wxPayId === details.wxPayId) ||
                (details.stripePaymentIntent != null && order.stripePaymentIntent === details.stripePaymentIntent)
            return { result: samePayment ? 'already-paid' as const : 'duplicate-payment' as const, userId: order.userId }
        }
        if (!Decimal(details.amount).eq(order.totalPrice)) {
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.orderPaymentFailed,
                    userId: order.userId,
                    orderId: order.id,
                    values: [ details.channel, Decimal(details.amount).toString(), 'amount-mismatch' ]
                }
            })
            return { result: 'amount-mismatch' as const, userId: order.userId }
        }

        await tx.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: PaymentStatus.paid,
                ...(details.channel === 'wxpay' ? { wxPayId: details.wxPayId } : {
                    stripePaymentIntent: details.stripePaymentIntent ?? null,
                    stripeCustomerId: details.stripeCustomerId ?? null,
                    paymentMethod: PaymentMethod.stripe
                })
            }
        })
        await tx.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderPaymentSuccess,
                userId: order.userId,
                orderId: order.id,
                values: [ details.channel, order.totalPrice ]
            }
        })

        // Add points upon payment
        if (order.userId != null) {
            const points = await adjustUserPoints(tx, order.userId, order.totalPriceRaw)
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.pointsUpdated,
                    userId: order.userId,
                    orderId: order.id,
                    values: [ order.totalPriceRaw, points.toString() ]
                }
            })
        }
        return { result: 'paid' as const, userId: order.userId }
    })
    return result.result
}

/**
 * Credits a pending balance top-up exactly once.
 */
export async function fulfillBalanceTopUp(transactionId: number, paymentReference: string, amount: Decimal.Value): Promise<FulfillmentResult> {
    const outcome = await prisma.$transaction(async tx => {
        const locked = await tx.$queryRaw<{ id: number }[]>`SELECT "id" FROM "UserAuditLog" WHERE "id" = ${transactionId} AND "type" = 'balanceTransaction' FOR UPDATE`
        if (locked.length < 1) {
            return { result: 'not-found' as const, userId: null, value: '0' }
        }
        const transaction = await tx.userAuditLog.findUniqueOrThrow({ where: { id: transactionId } })
        if (transaction.userId == null) {
            return { result: 'not-found' as const, userId: null, value: '0' }
        }
        if (transaction.values[1] !== 'await') {
            return {
                result: transaction.values[1] === paymentReference ? 'already-paid' as const : 'duplicate-payment' as const,
                userId: transaction.userId,
                value: transaction.values[0]
            }
        }
        if (!Decimal(amount).eq(transaction.values[0])) {
            return { result: 'amount-mismatch' as const, userId: transaction.userId, value: transaction.values[0] }
        }
        await tx.userAuditLog.update({
            where: { id: transaction.id },
            data: { values: [ transaction.values[0], paymentReference ] }
        })
        await adjustUserBalance(tx, transaction.userId, transaction.values[0])
        return { result: 'paid' as const, userId: transaction.userId, value: transaction.values[0] }
    })
    if (outcome.result === 'paid' && outcome.userId != null) {
        await sendNotification(outcome.userId, NotificationType.balanceToppedUp, [ outcome.value ], null)
    }
    return outcome.result
}

/**
 * Records a payment that could not be applied (and was refunded) so administrators can see it in the logs.
 */
export async function logUnappliedPayment(channel: string, reference: string, amount: string, reason: string, refunded: boolean): Promise<void> {
    console.error('Unapplied payment', channel, reference, amount, reason, refunded ? 'refunded' : 'NOT REFUNDED')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.orderPaymentFailed,
            values: [ channel, amount, reason, reference, refunded ? 'refunded' : 'refund-failed' ]
        }
    })
}
