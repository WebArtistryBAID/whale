import { NextRequest, NextResponse } from 'next/server'
import { Prisma, UserAuditLogType } from '@/generated/prisma/client'
import Decimal from 'decimal.js'
import { limitedFormData } from '@/app/lib/security'
import { prisma } from '@/app/lib/prisma'
import { readPaymentNotification } from '@/app/lib/payment-notification'

export async function POST(request: NextRequest): Promise<NextResponse> {
    let body: FormData
    try { body = await limitedFormData(request, 16384) } catch { return new NextResponse('FAILURE', { status: 400 }) }
    const payment = readPaymentNotification(body, 'BALANCE')
    if (!payment) return new NextResponse('FAILURE', { status: 400 })
    try {
        const success = await prisma.$transaction(async tx => {
            const transaction = await tx.userAuditLog.findUnique({ where: { id: payment.id } })
            if (!transaction || transaction.type !== UserAuditLogType.balanceTransaction || transaction.userId == null || transaction.time.getTime() !== payment.timestamp || !payment.amount.eq(transaction.values[0])) return false
            if (transaction.values[1] !== 'await') return transaction.values[1] === payment.payNo
            const claimed = await tx.userAuditLog.updateMany({
                where: { id: transaction.id, type: UserAuditLogType.balanceTransaction, values: { equals: transaction.values } },
                data: { values: [transaction.values[0], payment.payNo] }
            })
            if (claimed.count !== 1) return false
            const user = await tx.user.findUniqueOrThrow({ where: { id: transaction.userId } })
            const balance = Decimal(user.balance).add(payment.amount).toFixed(2)
            await tx.user.update({ where: { id: user.id }, data: { balance } })
            return true
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
        return new NextResponse(success ? 'SUCCESS' : 'FAILURE', { status: success ? 200 : 400 })
    } catch {
        return new NextResponse('FAILURE', { status: 500 })
    }
}
