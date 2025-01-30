import { PaymentMethod, PaymentStatus, PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Remove all orders that are older than 1 hour and aren't paid
export async function GET(): Promise<NextResponse> {
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
