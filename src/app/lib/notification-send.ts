import 'server-only'
import { NotificationType } from '@/generated/prisma/client'
import { prisma } from '@/app/lib/prisma'
import { getOneLoginAccessToken } from '@/app/login/onelogin'

const SMS_TEMPLATES: { [type in NotificationType]: string } = {
    orderCreated: 'SMS_478560531',
    pickupReminder: 'SMS_478570535',
    orderRefunded: 'SMS_478405523',
    balanceToppedUp: 'SMS_478460599',
    pointsEarned: 'SMS_478485567',
    payLaterReminder: 'SMS_478630531'
}

/**
 * Sends an inbox and/or SMS notification to a user, depending on their preferences.
 * Failures are logged and never thrown, so a notification problem cannot break order processing.
 */
export async function sendNotification(userId: number, type: NotificationType, values: string[], order: number | null): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                inboxNotifications: true,
                smsNotifications: true
            }
        })
        if (user == null) {
            return
        }

        if (user.inboxNotifications.includes(type)) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type,
                    orderId: order,
                    values
                }
            })
        }

        if (user.smsNotifications.includes(type)) {
            const params: { [key: string]: string | number } = {}
            if (order != null) {
                params.order = order
            }
            if (type === NotificationType.balanceToppedUp || type === NotificationType.pointsEarned) {
                params.value = values[0]
            }
            // The SMS is sent to the phone of the user who owns the token, so it must be the recipient's token
            const token = await getOneLoginAccessToken(user.id)
            if (token == null) {
                return
            }
            const response = await fetch(`${process.env.ONELOGIN_HOST}/api/v1/sms`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(15000),
                body: JSON.stringify({
                    template: SMS_TEMPLATES[type],
                    params
                })
            })
            if (!response.ok) {
                console.error('Failed to send SMS notification', user.id, type, response.status)
            }
        }
    } catch (e) {
        console.error('Failed to send notification', userId, type, e)
    }
}
