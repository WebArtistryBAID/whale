import { NextRequest, NextResponse } from 'next/server'
import { parseWeixinPayNotification, refundWeixinPay } from '@/app/lib/wx-pay-api'
import { fulfillBalanceTopUp, logUnappliedPayment } from '@/app/lib/payment-fulfillment'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const notification = parseWeixinPayNotification(await request.formData())
    if (notification == null) {
        return new NextResponse('FAILURE')
    }

    const [ idPart, timePart ] = notification.outTradeNo.split('-BALANCE')
    const id = parseInt(idPart)
    const transaction = Number.isSafeInteger(id) ? await prisma.userAuditLog.findUnique({
        where: { id },
        select: { time: true }
    }) : null

    let result
    if (transaction == null || transaction.time.getTime().toString() !== timePart) {
        result = 'not-found' as const
    } else {
        result = await fulfillBalanceTopUp(id, notification.payNo, notification.money)
    }

    if (result === 'not-found' || result === 'duplicate-payment' || result === 'amount-mismatch') {
        const refunded = await refundWeixinPay(notification.outTradeNo, notification.money)
        await logUnappliedPayment('wxpay-balance', notification.outTradeNo, notification.money, result, refunded)
    }
    return new NextResponse('SUCCESS')
}
