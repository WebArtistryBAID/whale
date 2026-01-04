'use server'

import { requireUnpaidOrder } from '@/app/lib/ordering-actions'
import { stripe } from '@/app/lib/stripe'
import Decimal from 'decimal.js'
import { prisma } from '@/app/lib/prisma'
import { PaymentStatus, UserAuditLogType } from '@/generated/prisma/enums'

export async function getStripeRedirectURI(id: number): Promise<string> {
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
        automatic_tax: { enabled: false }
    })
    await prisma.order.update({
        where: { id: order.id },
        data: { stripeSession: session.id }
    })
    return session.url!
}

export async function fulfillStripePayment(id: string): Promise<void> {
    const order = await prisma.order.findFirst({
        where: { stripeSession: id }
    })
    if (order == null || order.paymentStatus === PaymentStatus.paid) {
        return
    }
    const session = await stripe.checkout.sessions.retrieve(id, {
        expand: [ 'line_items' ]
    })
    if (session.payment_status !== 'unpaid') {
        await prisma.order.update({
            where: {
                id: order.id
            },
            data: {
                paymentStatus: PaymentStatus.paid
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
