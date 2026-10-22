import 'server-only'
import { prisma } from '@/app/lib/prisma'
import { NotificationType, User } from '@/generated/prisma/client'
import { getAccessToken } from '@/app/login/oauth-tokens'

export async function sendNotification(user: User, type: NotificationType, values: string[], order: number | null): Promise<void> {
    if (user.inboxNotifications.includes(type)) {
        await prisma.notification.create({
            data: {
                userId: user.id,
                type,
                orderId: order,
                values: values
            }
        })
    }

    if (user.smsNotifications.includes(type)) {
        const template = Object({
            orderCreated: 'SMS_478560531',
            pickupReminder: 'SMS_478570535',
            orderRefunded: 'SMS_478405523',
            balanceToppedUp: 'SMS_478460599',
            pointsEarned: 'SMS_478485567',
            payLaterReminder: 'SMS_478630531'
        })[type]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {}
        if (order != null) {
            params.order = order
        }
        if (type === NotificationType.balanceToppedUp || type === NotificationType.pointsEarned) {
            params.value = values[0]
        }
        const accessToken = await getAccessToken(user.id)
        if (!accessToken) return
        await fetch(`${process.env.ONELOGIN_HOST}/api/v1/sms`, {
            signal: AbortSignal.timeout(10000),
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template,
                params
            })
        })
    }
}

