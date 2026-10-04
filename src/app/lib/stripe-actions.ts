'use server'

import { requireUnpaidOrder } from '@/app/lib/order-queries'
import { getStripe } from '@/app/lib/stripe'
import Decimal from 'decimal.js'
import { prisma } from '@/app/lib/prisma'
import { getMyTransaction } from '@/app/lib/balance-actions'
import { getStripeChargedAmountMinorUnit } from '@/app/lib/pricing'
import { idSchema } from '@/app/lib/validation'

// Sessions expire after 30 minutes (the minimum Stripe allows), before unpaid orders are pruned.
function getSessionExpiry(): number {
    return Math.floor(Date.now() / 1000) + 31 * 60
}

export async function getStripeRedirectURI(id: number, type: 'order' | 'balance' = 'order'): Promise<string> {
    const parsedId = idSchema.parse(id)
    if (type === 'balance') {
        const trans = await getMyTransaction(parsedId)
        if (trans == null) {
            throw new Error('Invalid transaction')
        }
        if (trans.values[1] !== 'await') {
            throw new Error('Transaction already completed')
        }
        const session = await getStripe().checkout.sessions.create({
            line_items: [ {
                price_data: {
                    currency: 'cny',
                    product: process.env.STRIPE_PRODUCT!,
                    tax_behavior: 'inclusive',
                    unit_amount: Decimal(trans.values[0]).mul(100).floor().toNumber()
                },
                quantity: 1
            } ],
            mode: 'payment',
            success_url: `${process.env.HOST}/order/checkout/stripe/${parsedId}/poll?type=balance`,
            automatic_tax: { enabled: false },
            expires_at: getSessionExpiry(),
            metadata: {
                type: 'balance',
                transactionId: trans.id.toString()
            }
        })
        return session.url!
    }

    const order = await requireUnpaidOrder(parsedId)
    if (order.stripeSession) {
        const session = await getStripe().checkout.sessions.retrieve(order.stripeSession)
        if (session.status === 'open' && session.url != null) {
            return session.url
        }
    }
    const session = await getStripe().checkout.sessions.create({
        line_items: [ {
            price_data: {
                currency: 'cny',
                product: process.env.STRIPE_PRODUCT!,
                tax_behavior: 'inclusive',
                unit_amount: getStripeChargedAmountMinorUnit(order.totalPrice)
            },
            quantity: 1
        } ],
        mode: 'payment',
        success_url: `${process.env.HOST}/order/checkout/stripe/${order.id}/poll`,
        automatic_tax: { enabled: false },
        expires_at: getSessionExpiry(),
        metadata: {
            type: 'order',
            orderId: order.id.toString()
        }
    })
    await prisma.order.update({
        where: { id: order.id },
        data: { stripeSession: session.id }
    })
    return session.url!
}
