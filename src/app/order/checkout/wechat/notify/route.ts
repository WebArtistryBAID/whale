import { NextRequest, NextResponse } from 'next/server'
import { parseWeixinPayNotification, refundWeixinPay } from '@/app/lib/wx-pay-api'
import { fulfillOrderPayment, logUnappliedPayment } from '@/app/lib/payment-fulfillment'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const notification = parseWeixinPayNotification(await request.formData())
    if (notification == null) {
        return new NextResponse('FAILURE')
    }
    const [ idPart, timePart ] = notification.outTradeNo.split('-ORDER')
    const id = parseInt(idPart)
    const order = Number.isSafeInteger(id) ? await prisma.order.findUnique({
        where: { id },
        select: { createdAt: true }
    }) : null

    let result
    if (order == null || order.createdAt.getTime().toString() !== timePart) {
        result = 'not-found' as const
    } else {
        result = await fulfillOrderPayment(id, {
            channel: 'wxpay',
            amount: notification.money,
            wxPayId: notification.payNo
        })
    }

    if (result === 'not-found' || result === 'duplicate-payment' || result === 'amount-mismatch') {
        // The customer paid for an order that no longer exists or was already paid: give the money back
        const refunded = await refundWeixinPay(notification.outTradeNo, notification.money)
        await logUnappliedPayment('wxpay', notification.outTradeNo, notification.money, result, refunded)
    }
    return new NextResponse('SUCCESS')
}
