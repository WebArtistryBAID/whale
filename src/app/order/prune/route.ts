import { PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Remove all orders that are older than 1 hour and aren't paid
export async function GET(request: NextRequest): Promise<NextResponse> {
    if (request.nextUrl.searchParams.get('key') !== process.env.CRON_KEY) {
        return NextResponse.json({ success: false })
    }
    await prisma.order.deleteMany({
        where: {
            paymentStatus: PaymentStatus.notPaid,
            NOT: {
                paymentMethod: PaymentMethod.payLater
            },
            createdAt: {
                lt: new Date(Date.now() - 60 * 60 * 1000)
            }
        }
    })
    return NextResponse.json({ success: true })
}
