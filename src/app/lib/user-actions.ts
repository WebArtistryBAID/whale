'use server'

import Paginated from '@/app/lib/Paginated'
import { Order, PrismaClient } from '@prisma/client'
import { requireUser } from '@/app/login/login-actions'

const prisma = new PrismaClient()

export default async function getMyOrders(page: number): Promise<Paginated<Order>> {
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
