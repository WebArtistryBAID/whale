'use server'

import {
    CouponCode,
    ItemType,
    OptionItem,
    OrderStatus,
    OrderType,
    PaymentMethod,
    PaymentStatus,
    PrismaClient,
    User
} from '@prisma/client'
import { OrderedItemTemplate } from '@/app/lib/shopping-cart'
import { getMyUser } from '@/app/login/login-actions'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

export interface HydratedOrderedItem {
    id: number
    orderId: number
    itemType: ItemType
    itemTypeId: number
    appliedOptions: OptionItem[]
    amount: number
}

export interface HydratedOrder {
    id: number
    items: HydratedOrderedItem[]
    totalPrice: string
    status: OrderStatus
    createdAt: Date
    updatedAt: Date
    type: OrderType
    deliveryRoom: string | null
    user: User | null
    userId: number | null
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
}

export async function couponQuickValidate(code: string): Promise<CouponCode | null> {
    return prisma.couponCode.findUnique({
        where: {
            id: code,
            remainingUses: {
                gt: 0
            }
        }
    })
}

function calculatePrice(item: OrderedItemTemplate): Decimal {
    let price = Decimal(item.item.basePrice)
    for (const option of item.options) {
        if (option == null) {
            continue
        }
        price = price.add(Decimal(option.priceChange))
    }
    price = price.mul(Decimal(item.item.salePercent))
    return price.mul(item.amount)
}

export async function getOrder(id: number): Promise<HydratedOrder | null> {
    return prisma.order.findUnique({
        where: {
            id
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

export async function createOrder(items: OrderedItemTemplate[],
                                  coupon: string | null,
                                  onSiteOrderMode: boolean,
                                  deliveryRoom: string | null,
                                  paymentMethod: PaymentMethod): Promise<HydratedOrder | null> {
    const me = await getMyUser()

    // We didn't perform atomization - for a small use case like this, we should be fine.

    // SANITY CHECKS - These should be enforced by the frontend
    // On site order mode require administrative permissions
    if (onSiteOrderMode && (me == null || !me.permissions.includes('admin.manage'))) {
        return null
    }

    // Calculate total price
    const totalPriceNoCoupon = items.reduce((acc, item) => acc.add(calculatePrice(item)), new Decimal(0))
    let totalPrice = totalPriceNoCoupon
    if (coupon != null) {
        const couponCode = await couponQuickValidate(coupon)
        if (couponCode == null) {
            return null
        }
        totalPrice = totalPrice.minus(Decimal.min(totalPrice, Decimal(couponCode.value)))
        await prisma.couponCode.update({
            where: {
                id: couponCode.id
            },
            data: {
                remainingUses: {
                    decrement: 1
                }
            }
        })
    }

    // Cash payment is only available with on-site
    if (paymentMethod === PaymentMethod.cash && !onSiteOrderMode) {
        return null
    }

    // Balance payment is only available with user and when balance is sufficient
    if (paymentMethod === PaymentMethod.balance) {
        if (me == null) {
            return null
        }
        if (Decimal(me.balance).lt(totalPrice)) {
            return null
        }
        await prisma.user.update({
            where: {
                id: me.id
            },
            data: {
                balance: Decimal(me.balance).minus(totalPrice).toString()
            }
        })
    }

    // Delivery room must be over 3 characters
    if (deliveryRoom != null && deliveryRoom.length < 3) {
        return null
    }

    const order = await prisma.order.create({
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            },
            user: true
        },
        data: {
            items: {
                create: items.map(item => ({
                    itemType: {
                        connect: {
                            id: item.item.id
                        }
                    },
                    appliedOptions: {
                        connect: item.options.map(option => ({
                            id: option.id
                        }))
                    },
                    amount: item.amount
                }))
            },
            totalPrice: totalPrice.toString(),
            status: OrderStatus.waiting,
            type: deliveryRoom == null ? OrderType.pickUp : OrderType.delivery,
            deliveryRoom,
            user: onSiteOrderMode ? undefined : {
                connect: {
                    id: me?.id
                }
            },
            paymentStatus: (totalPrice.eq(0) || paymentMethod === PaymentMethod.cash || paymentMethod === PaymentMethod.balance) ? PaymentStatus.paid : PaymentStatus.notPaid,
            paymentMethod
        }
    })

    // Add points to user
    if (me != null) {
        await prisma.user.update({
            where: {
                id: me.id
            },
            data: {
                points: Decimal(me.points).add(totalPriceNoCoupon).toString()
            }
        })
    }

    return order
}
