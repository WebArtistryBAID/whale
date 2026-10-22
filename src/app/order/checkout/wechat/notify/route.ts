import { PaymentMethod, PaymentStatus, Prisma, UserAuditLogType } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'
import { limitedFormData } from '@/app/lib/security'
import { prisma } from '@/app/lib/prisma'
import { readPaymentNotification } from '@/app/lib/payment-notification'

export async function POST(request: NextRequest): Promise<NextResponse> {
    let body: FormData
    try { body = await limitedFormData(request, 16384) } catch { return new NextResponse('FAILURE', { status: 400 }) }
    const payment = readPaymentNotification(body, 'ORDER')
    if (!payment) return new NextResponse('FAILURE', { status: 400 })
    try {
        const success = await prisma.$transaction(async tx => {
            const order = await tx.order.findUnique({ where: { id: payment.id } })
            if (!order || order.createdAt.getTime() !== payment.timestamp || !payment.amount.eq(order.totalPrice)) return false
            if (order.paymentStatus === PaymentStatus.paid) return order.wxPayId === payment.payNo
            if (order.paymentStatus !== PaymentStatus.notPaid) return false
            const claimed = await tx.order.updateMany({
                where: { id: order.id, paymentStatus: PaymentStatus.notPaid },
                data: { paymentStatus: PaymentStatus.paid, paymentMethod: PaymentMethod.wxPay, wxPayId: payment.payNo }
            })
            if (claimed.count !== 1) return false
            await tx.userAuditLog.create({ data: {
                type: UserAuditLogType.orderPaymentSuccess, userId: order.userId, orderId: order.id,
                values: ['wxpay', order.totalPrice]
            } })
            if (order.userId != null) {
                const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } })
                const points = Decimal(user.points).add(order.totalPriceRaw).toString()
                await tx.user.update({ where: { id: user.id }, data: { points } })
                await tx.userAuditLog.create({ data: {
                    type: UserAuditLogType.pointsUpdated, userId: user.id, orderId: order.id,
                    values: [order.totalPriceRaw, points]
                } })
            }
            return true
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
        return new NextResponse(success ? 'SUCCESS' : 'FAILURE', { status: success ? 200 : 400 })
    } catch {
        return new NextResponse('FAILURE', { status: 500 })
    }
}
