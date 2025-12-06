'use server'

import Paginated from '@/app/lib/Paginated'
import { Order, User, UserAuditLogType } from '@/generated/prisma/client'
import { requireUser } from '@/app/login/login-actions'
import { prisma } from '@/app/lib/prisma'

export interface HydratedUserAuditLog {
    id: number
    time: Date
    type: UserAuditLogType
    user: User | null
    userId: number | null
    orderId: number | null
    values: string[]
}

export async function getMyOrders(page: number): Promise<Paginated<Order>> {
    const me = await requireUser()
    const pages = Math.ceil(await prisma.order.count({
        where: {
            userId: me.id
        }
    }) / 10)
    const orders = await prisma.order.findMany({
        where: {
            userId: me.id
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: orders,
        page,
        pages
    }
}

export async function getMyAuditLogs(page: number): Promise<Paginated<HydratedUserAuditLog>> {
    const me = await requireUser()
    const pages = Math.ceil(await prisma.userAuditLog.count({
        where: {
            userId: me.id
        }
    }) / 10)
    const logs = await prisma.userAuditLog.findMany({
        where: {
            userId: me.id
        },
        orderBy: {
            time: 'desc'
        },
        include: {
            user: true
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: logs,
        page,
        pages
    }
}
