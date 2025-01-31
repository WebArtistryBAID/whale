'use server'

import { Notification, NotificationType, PrismaClient, User } from '@prisma/client'
import { getAccessToken } from '@/app/login/login-actions'
import { me } from '@/app/login/login'

const prisma = new PrismaClient()

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
            // TODO Templates
        })[type]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
            name: values[0]
        }
        // TODO Params
        await fetch(`${process.env.ONELOGIN_HOST}/api/v1/sms`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${await getAccessToken()}`
            },
            body: JSON.stringify({
                template,
                params
            })
        })
    }
}

export async function getUntoastedNotifications(): Promise<Notification[]> {
    const hi = await me()
    if (hi == null) {
        return []
    }
    const results = await prisma.notification.findMany({
        where: {
            userId: hi,
            toasted: false
        }
    })
    await prisma.notification.updateMany({
        where: {
            userId: hi
        },
        data: {
            toasted: true
        }
    })
    return results
}
