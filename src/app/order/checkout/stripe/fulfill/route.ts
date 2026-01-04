import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'
import { fulfillStripePayment } from '@/app/lib/stripe-actions'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const payload = await request.arrayBuffer()
    const sig = request.headers.get('Stripe-Signature')
    if (sig == null) {
        return new NextResponse('Missing Stripe signature', { status: 400 })
    }
    let event
    try {
        event = stripe.webhooks.constructEvent(Buffer.from(payload), sig, process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET!)
    } catch (err) {
        return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        await fulfillStripePayment(event.data.object.id)
    }
    return new NextResponse('Success', { status: 200 })
}
