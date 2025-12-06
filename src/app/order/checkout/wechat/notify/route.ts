import { PaymentStatus, UserAuditLogType } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/app/lib/ordering-actions'
import Decimal from 'decimal.js'
import signData from '@/app/lib/wx-pay-sign'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.formData()
    if (signData({
        code: body.get('code'),
        orderNo: body.get('orderNo'),
        outTradeNo: body.get('outTradeNo'),
        payNo: body.get('payNo'),
        money: body.get('money'),
        mchId: body.get('mchId')
    }) !== body.get('sign')) {
        return new NextResponse('FAILURE')
    }
    const id = parseInt((body.get('outTradeNo')! as string).split('-ORDER')[0])
    const order = await getOrder(id)
    if (order == null || order.createdAt.getTime().toString() !== (body.get('outTradeNo')! as string).split('-ORDER')[1]) {
        return new NextResponse('FAILURE')
    }
    if (order.paymentStatus === PaymentStatus.paid) {
        return new NextResponse('SUCCESS')
    }
    await prisma.order.update({
        where: {
            id: order.id
        },
        data: {
            paymentStatus: PaymentStatus.paid,
            wxPayId: body.get('payNo')! as string
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
            values: [ 'wxpay', order.totalPrice ]
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
            return new NextResponse('SUCCESS')
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

    return new NextResponse('SUCCESS')
}
