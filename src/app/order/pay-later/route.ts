import { NotificationType, PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { sendNotification } from '@/app/lib/notification-send'
import { formatDateKey } from '@/app/lib/ordering-schedule'
import { prisma } from '@/app/lib/prisma'
import { isAuthorizedCron } from '@/app/lib/api-auth'

// Send notifications to Pay Later order customers
export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ success: false }, { status: 401 })
    }
    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: PaymentStatus.notPaid,
            paymentMethod: PaymentMethod.payLater
        }
    })
    const now = new Date()
    const today = formatDateKey(now)
    const isSaturday = now.getDay() === 6
    for (const order of orders) {
        if (order.userId == null) {
            continue
        }
        // Remind on the day the order was placed, and on Saturdays for anything from the past week
        const placedToday = formatDateKey(order.createdAt) === today
        const placedThisWeek = now.getTime() - order.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
        if (placedToday || (isSaturday && placedThisWeek)) {
            await sendNotification(order.userId, NotificationType.payLaterReminder, [], order.id)
        }
    }
    return NextResponse.json({ success: true })
}
