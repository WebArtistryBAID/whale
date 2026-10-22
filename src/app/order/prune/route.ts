import { PaymentMethod, PaymentStatus, Prisma } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!process.env.CRON_KEY || request.nextUrl.searchParams.get('key') !== process.env.CRON_KEY) {
        return NextResponse.json({ success: false }, { status: 401 })
    }
    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: PaymentStatus.notPaid, NOT: { paymentMethod: PaymentMethod.payLater },
            createdAt: { lt: new Date(Date.now() - 3600000) }
        },
        include: { items: { include: { itemType: true } } }
    })
    for (const order of orders) {
        await prisma.$transaction(async tx => {
            const removed = await tx.order.deleteMany({ where: { id: order.id, paymentStatus: PaymentStatus.notPaid } })
            if (removed.count !== 1) return
            for (const item of order.items) {
                if (item.itemType.inventoryTrackingEnabled) await tx.itemType.update({
                    where: { id: item.itemTypeId }, data: { remainingItems: { increment: item.amount } }
                })
            }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    }
    return NextResponse.json({ success: true })
}
