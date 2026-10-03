import 'server-only'
import Stripe from 'stripe'
import Decimal from 'decimal.js'
import { prisma } from '@/app/lib/prisma'
import { stripe } from '@/app/lib/stripe'
import { fulfillBalanceTopUp, fulfillOrderPayment, logUnappliedPayment } from '@/app/lib/payment-fulfillment'
import { getStripeChargedAmountMinorUnit } from '@/app/lib/pricing'

async function refundSession(session: Stripe.Checkout.Session, reason: string): Promise<void> {
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    let refunded = false
    if (paymentIntent != null) {
        try {
            await stripe.refunds.create({ payment_intent: paymentIntent })
            refunded = true
        } catch (e) {
            console.error('Stripe refund failed', paymentIntent, e)
        }
    }
    await logUnappliedPayment('stripe', session.id, Decimal(session.amount_total ?? 0).div(100).toString(), reason, refunded)
}

export async function fulfillStripePayment(session: Stripe.Checkout.Session): Promise<void> {
    // Async payment methods complete the session before the money arrives
    if (session.payment_status !== 'paid') {
        return
    }
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

    if (session.metadata?.type === 'balance') {
        const transactionId = parseInt(session.metadata?.transactionId ?? '')
        if (!Number.isSafeInteger(transactionId)) {
            return
        }
        const result = await fulfillBalanceTopUp(transactionId, paymentIntent ?? session.id, Decimal(session.amount_total ?? 0).div(100))
        if (result === 'not-found' || result === 'duplicate-payment' || result === 'amount-mismatch') {
            await refundSession(session, result)
        }
        return
    }

    const order = await prisma.order.findFirst({
        where: { stripeSession: session.id },
        select: { id: true, totalPrice: true }
    })
    if (order == null) {
        await refundSession(session, 'not-found')
        return
    }
    if (session.amount_total !== getStripeChargedAmountMinorUnit(order.totalPrice)) {
        await refundSession(session, 'amount-mismatch')
        return
    }
    const result = await fulfillOrderPayment(order.id, {
        channel: 'stripe',
        // The customer pays the processing fee on top of the order total
        amount: order.totalPrice,
        stripePaymentIntent: paymentIntent,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
    })
    if (result === 'not-found' || result === 'duplicate-payment' || result === 'amount-mismatch') {
        await refundSession(session, result)
    }
}
