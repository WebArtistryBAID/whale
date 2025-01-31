'use server'

import { Notification, NotificationType, PrismaClient, User } from '@prisma/client'
import { getAccessToken, requireUser } from '@/app/login/login-actions'
import { me } from '@/app/login/login'
import Paginated from '@/app/lib/Paginated'

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

export async function dismissNotification(id: number): Promise<void> {
    const user = await requireUser()
    await prisma.notification.delete({
        where: {
            id,
            userId: user.id
        }
    })
}

export async function getMyNotifications(page: number): Promise<Paginated<Notification>> {
    const user = await requireUser()
    const pages = Math.ceil(await prisma.notification.count({ where: { userId: user.id } }) / 10)
    const notifications = await prisma.notification.findMany({
        where: {
            userId: user.id
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: notifications,
        page,
        pages
    }
}

export async function toggleInboxNotification(type: NotificationType): Promise<void> {
    const user = await requireUser()
    if (user.inboxNotifications.includes(type)) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                inboxNotifications: {
                    set: user.inboxNotifications.filter(t => t !== type)
                }
            }
        })
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                inboxNotifications: {
                    set: [ ...user.inboxNotifications, type ]
                }
            }
        })
    }
}

export async function toggleSMSNotification(type: NotificationType): Promise<void> {
    const user = await requireUser()
    if (user.smsNotifications.includes(type)) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                smsNotifications: {
                    set: user.smsNotifications.filter(t => t !== type)
                }
            }
        })
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                smsNotifications: {
                    set: [ ...user.smsNotifications, type ]
                }
            }
        })
    }
}

export async function getMyNotificationsCount(): Promise<number> {
    const user = await requireUser()
    return prisma.notification.count({ where: { userId: user.id } })
}
