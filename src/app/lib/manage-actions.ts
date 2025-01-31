'use server'

import Paginated from '@/app/lib/Paginated'
import { Order, PrismaClient, UserAuditLogType } from '@prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'
import { HydratedUserAuditLog } from '@/app/lib/user-actions'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

export async function getAuditLogs(page: number): Promise<Paginated<HydratedUserAuditLog>> {
    await requireUserPermission('admin.manage')
    const pages = Math.ceil(await prisma.userAuditLog.count() / 10)
    const logs = await prisma.userAuditLog.findMany({
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

export async function getUserOrders(page: number, userId: number): Promise<Paginated<Order>> {
    await requireUserPermission('admin.manage')
    const pages = Math.ceil(await prisma.order.count({
        where: {
            userId
        }
    }) / 10)
    const orders = await prisma.order.findMany({
        where: {
            userId
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

export async function setUserPoints(userId: number, points: string): Promise<void> {
    const me = await requireUserPermission('admin.manage')
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            points: true
        }
    })
    if (user == null) {
        return
    }
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            points: Decimal(points).toString()
        }
    })
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.pointsUpdated,
            user: {
                connect: {
                    id: userId
                }
            },
            values: [ Decimal(points).minus(user.points).toString(), Decimal(points).toString(), me.id.toString() ]
        }
    })
}
