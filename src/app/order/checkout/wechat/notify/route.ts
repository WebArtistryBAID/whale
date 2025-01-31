import { PaymentStatus, PrismaClient, UserAuditLogType } from '@prisma/client'
import md5 from 'md5'
import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/app/lib/ordering-actions'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

// ONLY required parameters need to go into the signature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function signData(params: any): string {
    const key = process.env.WXPAY_MCH_KEY
    const paramsArr = Object.keys(params)
    paramsArr.sort()
    const stringArr = []
    paramsArr.map(key => {
        stringArr.push(`key=${params[key]}`)
    })
    stringArr.push(`key=${key}`)
    return md5(stringArr.join('&')).toString().toUpperCase()
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json()
    if (signData({
        code: body.code,
        orderNo: body.orderNo,
        outTradeNo: body.outTradeNo,
        payNo: body.payNo,
        money: body.money,
        mchId: body.mchId
    }) !== body.sign) {
        return new NextResponse('FAILURE')
    }

    const id = parseInt(body.outTradeNo.split('-ORDER')[0])
    const order = await getOrder(id)
    if (order == null || order.createdAt.getTime().toString() !== body.outTradeNo.split('-ORDER')[1]) {
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
            wxPayId: body.payNo
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
