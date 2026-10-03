import 'server-only'
import { PaymentStatus, Prisma, UserAuditLogType } from '@/generated/prisma/client'
import { stripe } from '@/app/lib/stripe'

type TransactionClient = Prisma.TransactionClient

/**
 * Returns the inventory and coupon use reserved by an unpaid order, then deletes it.
 * Returns false (and changes nothing) if the order no longer exists or has been paid in the meantime.
 */
export async function releaseAndDeleteUnpaidOrder(tx: TransactionClient, orderId: number): Promise<boolean> {
    // Lock the order row so a concurrent payment notification cannot mark it paid while we delete it
    const locked = await tx.$queryRaw<{ paymentStatus: PaymentStatus }[]>`SELECT "paymentStatus" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`
    if (locked.length < 1 || locked[0].paymentStatus !== PaymentStatus.notPaid) {
        return false
    }

    const items = await tx.orderedItem.findMany({
        where: { orderId },
        select: {
            itemTypeId: true,
            amount: true,
            itemType: {
                select: {
                    inventoryTrackingEnabled: true
                }
            }
        }
    })
    const amounts = new Map<number, number>()
    for (const item of items) {
        if (!item.itemType.inventoryTrackingEnabled) {
            continue
        }
        amounts.set(item.itemTypeId, (amounts.get(item.itemTypeId) ?? 0) + item.amount)
    }
    for (const [ itemTypeId, amount ] of amounts.entries()) {
        await tx.itemType.update({
            where: { id: itemTypeId },
            data: { remainingItems: { increment: amount } }
        })
    }

    // Audit logs are deleted together with the order, so read the coupon before deleting
    const couponLog = await tx.userAuditLog.findFirst({
        where: {
            orderId,
            type: UserAuditLogType.couponUsed
        }
    })
    if (couponLog != null && couponLog.values[0] != null) {
        await tx.couponCode.updateMany({
            where: { id: couponLog.values[0] },
            data: { remainingUses: { increment: 1 } }
        })
    }

    await tx.order.delete({
        where: { id: orderId }
    })
    return true
}

/**
 * Expires an open Stripe Checkout session so it can no longer be paid.
 * Returns false if the session has already been completed (i.e. the customer paid).
 */
export async function expireStripeSession(sessionId: string | null): Promise<boolean> {
    if (sessionId == null) {
        return true
    }
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.status === 'complete') {
            return false
        }
        if (session.status === 'open') {
            await stripe.checkout.sessions.expire(sessionId)
        }
        return true
    } catch (e) {
        console.error('Failed to expire Stripe session', sessionId, e)
        return false
    }
}
