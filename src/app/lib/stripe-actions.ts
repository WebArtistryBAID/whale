'use server'

import { requireUnpaidOrder } from '@/app/lib/ordering-actions'
import { stripe } from '@/app/lib/stripe'
import Decimal from 'decimal.js'
import { prisma } from '@/app/lib/prisma'
import { PaymentMethod, PaymentStatus, UserAuditLogType } from '@/generated/prisma/enums'
import { getMyTransaction } from '@/app/lib/balance-actions'
import Stripe from 'stripe'

export async function getStripeRedirectURI(id: number, type: 'order' | 'balance' = 'order'): Promise<string> {
    if (type === 'balance') {
        const trans = await getMyTransaction(id)
        if (trans == null) {
            throw new Error('Invalid transaction')
        }
        if (trans.values[1] !== 'await') {
            throw new Error('Transaction already completed')
        }
        const session = await stripe.checkout.sessions.create({
            line_items: [ {
                price_data: {
                    currency: 'cny',
                    product: process.env.STRIPE_PRODUCT!,
                    tax_behavior: 'inclusive',
                    unit_amount: Math.floor(Decimal(trans.values[0]).mul(100).toNumber())
                },
                quantity: 1
            } ],
            mode: 'payment',
            success_url: `${process.env.HOST}/order/checkout/stripe/${id}/poll?type=balance`,
            automatic_tax: { enabled: false },
            metadata: {
                type: 'balance',
                transactionId: trans.id.toString()
            }
        })
        return session.url!
    }

    const order = await requireUnpaidOrder(id)
    if (order.stripeSession) {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSession)
        if (session.url != null) {
            return session.url
        }
    }
    const session = await stripe.checkout.sessions.create({
        line_items: [ {
            price_data: {
                currency: 'cny',
                product: process.env.STRIPE_PRODUCT!,
                tax_behavior: 'inclusive',
                unit_amount: Math.floor(Decimal(order.totalPrice).mul(100).toNumber())
            },
            quantity: 1
        } ],
        mode: 'payment',
        success_url: `${process.env.HOST}/order/checkout/stripe/${id}/poll`,
        automatic_tax: { enabled: false },
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

export async function fulfillStripePayment(session: Stripe.Checkout.Session): Promise<void> {
    const type = session.metadata?.type ?? 'order'
    if (type === 'balance') {
        await fulfillStripeBalance(session)
        return
    }

    const order = await prisma.order.findFirst({
        where: { stripeSession: session.id }
    })
    if (order == null || order.paymentStatus === PaymentStatus.paid) {
        return
    }
    if (session.payment_status !== 'unpaid') {
        await prisma.order.update({
            where: {
                id: order.id
            },
            data: {
                paymentStatus: PaymentStatus.paid,
                stripePaymentIntent: session.payment_intent as string,
                stripeCustomerId: session.customer as string | null,
                paymentMethod: PaymentMethod.stripe
            }
        })

        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderPaymentSuccess,
                user: order.userId == null ? undefined : {
                    connect: {
                        id: order.userId
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ 'stripe', order.totalPrice ]
            }
        })

        // Add points upon payment
        if (order.userId != null) {
            const user = await prisma.user.findUnique({
                where: {
                    id: order.userId
                }
            })

            if (user == null) {
                return
            }

            await prisma.user.update({
                where: {
                    id: order.userId
                },
                data: {
                    points: Decimal(user.points).add(order.totalPriceRaw).toString()
                }
            })

            await prisma.userAuditLog.create({
                data: {
                    type: UserAuditLogType.pointsUpdated,
                    user: {
                        connect: {
                            id: user.id
                        }
                    },
                    order: {
                        connect: {
                            id: order.id
                        }
                    },
                    values: [ order.totalPriceRaw, Decimal(user.points).add(order.totalPriceRaw).toString() ]
                }
            })
        }
    }
}

async function fulfillStripeBalance(session: Stripe.Checkout.Session): Promise<void> {
    const transactionId = session.metadata?.transactionId
    if (transactionId == null) {
        return
    }
    const transaction = await prisma.userAuditLog.findUnique({
        where: { id: parseInt(transactionId) },
        include: { user: true }
    })
    if (transaction == null || transaction.values[1] !== 'await' || transaction.user == null) {
        return
    }
    await prisma.userAuditLog.update({
        where: { id: transaction.id },
        data: { values: [ transaction.values[0], session.payment_intent as string ] }
    })

    await prisma.user.update({
        where: { id: transaction.user.id },
        data: {
            balance: Decimal(transaction.user.balance).add(transaction.values[0]).toString()
        }
    })
}
