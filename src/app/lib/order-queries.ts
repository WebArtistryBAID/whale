import 'server-only'
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@/generated/prisma/client'
import { prisma } from '@/app/lib/prisma'
import type { HydratedOrder } from '@/app/lib/ordering-actions'

/**
 * Only these user fields are ever attached to an order that leaves the server.
 */
export const orderUserSelect = {
    id: true,
    name: true,
    pinyin: true
} satisfies Prisma.UserSelect

export const hydratedOrderInclude = {
    items: {
        include: {
            itemType: true,
            appliedOptions: true
        }
    },
    user: {
        select: orderUserSelect
    }
} satisfies Prisma.OrderInclude

export async function findHydratedOrder(id: number, tx?: Prisma.TransactionClient): Promise<HydratedOrder | null> {
    if (!Number.isSafeInteger(id)) {
        return null
    }
    return (tx ?? prisma).order.findUnique({
        where: { id },
        include: hydratedOrderInclude
    })
}

export async function listHydratedWaitingOrders(): Promise<HydratedOrder[]> {
    return prisma.order.findMany({
        where: {
            status: OrderStatus.waiting,
            OR: [
                {
                    paymentStatus: PaymentStatus.paid
                },
                {
                    paymentStatus: PaymentStatus.notPaid,
                    paymentMethod: PaymentMethod.payLater
                }
            ]
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: hydratedOrderInclude
    })
}

/**
 * Finds an order that is awaiting payment. Anyone who knows the order number may pay for it,
 * so callers must only return payment information, never the order itself.
 */
export async function requireUnpaidOrder(id: number): Promise<HydratedOrder> {
    const order = await findHydratedOrder(id)
    if (order == null || order.paymentStatus !== PaymentStatus.notPaid) {
        throw new Error('Bad request')
    }
    return order
}
