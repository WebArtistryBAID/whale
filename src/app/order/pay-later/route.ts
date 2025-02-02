import { NotificationType, PaymentMethod, PaymentStatus, PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { sendNotification } from '@/app/lib/notification-actions'

const prisma = new PrismaClient()

// Remove all orders that are older than 1 hour and aren't paid
export async function GET(request: NextRequest): Promise<NextResponse> {
    if (request.nextUrl.searchParams.get('key') !== process.env.CRON_KEY) {
        return NextResponse.json({ success: false })
    }
    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: PaymentStatus.notPaid,
            paymentMethod: PaymentMethod.payLater
        }
    })
    const date = new Date()
    for (const order of orders) {
        if (order.userId == null) {
            continue
        }
        if (order.createdAt.getDate() === date.getDate() || (date.getDay() === 6 && (date.getTime() - order.createdAt.getTime()) / 1000 / 60 / 60 / 24 < 7)) {
            const user = await prisma.user.findUnique({
                where: {
                    id: order.userId
                }
            })
            if (user == null) {
                continue
            }
            await sendNotification(
                user,
                NotificationType.payLaterReminder,
                [],
                order.id
            )
        }
    }
    return NextResponse.json({ success: true })
}
