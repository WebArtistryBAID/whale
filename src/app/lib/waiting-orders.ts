import { HydratedOrder } from '@/app/lib/ordering-actions'
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import { prisma } from '@/app/lib/prisma'

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
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            },
            user: true
        }
    })
}
