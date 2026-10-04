import { PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { isAuthorizedCron } from '@/app/lib/api-auth'
import { expireStripeSession, releaseAndDeleteUnpaidOrder } from '@/app/lib/order-lifecycle'

// Remove all orders that are older than 1 hour and aren't paid, returning their inventory and coupons
export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ success: false }, { status: 401 })
    }
    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: PaymentStatus.notPaid,
            NOT: {
                paymentMethod: PaymentMethod.payLater
            },
            createdAt: {
                lt: new Date(Date.now() - 60 * 60 * 1000)
            }
        },
        select: {
            id: true,
            stripeSession: true
        }
    })
    let pruned = 0
    for (const order of orders) {
        // Skip orders whose Stripe session was just paid; the webhook will mark them as paid
        if (!await expireStripeSession(order.stripeSession)) {
            continue
        }
        if (await prisma.$transaction(tx => releaseAndDeleteUnpaidOrder(tx, order.id))) {
            pruned++
        }
    }
    return NextResponse.json({ success: true, pruned })
}
