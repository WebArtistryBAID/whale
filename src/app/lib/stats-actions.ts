'use server'

import { PaymentStatus, PrismaClient } from '@prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

export interface StatsAggregates {
    newItems: NewItemStats[]
    totalRevenue: string
    totalOrders: number
    totalCups: number
    lastTotalRevenue: string | null
    lastTotalOrders: number | null
    lastTotalCups: number | null

    ordersPerUnit: number[]
    cupsPerUnit: number[]
    revenuePerUnit: string[]

    categoryCupsDistribution: { [category: number]: number }
    categoryRevenueDistribution: { [category: number]: string }
    itemCupsDistribution: { [item: number]: number }
    itemRevenueDistribution: { [item: number]: string }
    genderCupsDistribution: { [gender: string]: number }
    genderRevenueDistribution: { [gender: string]: string }
    userCupsDistribution: { [userId: number]: number }
    userRevenueDistribution: { [userId: number]: string }
    paymentMethodDistribution: { [method: string]: number }
    paymentStatusDistribution: { [status: string]: number }

    averageOrderValue: string
    averageOrderCups: number
    averageOrderValuePerUnit: string[]
    averageOrderCupsPerUnit: number[]
    maxOrderValuePerUnit: string[]
    maxOrderCupsPerUnit: number[]
    minOrderValuePerUnit: string[]
    minOrderCupsPerUnit: number[]

    mentionedCategories: { [category: number]: string }
    mentionedUsers: { [userId: number]: string }
    mentionedItems: { [item: number]: string }
}

export interface NewItemStats {
    id: number
    cups: number
    revenue: string
    cupsGenderDistribution: { [gender: string]: number }
    revenueGenderDistribution: { [gender: string]: string }
}

function days(year: number): number[] {
    if ((year & 3) == 0 && ((year % 25) != 0 || (year & 15) == 0)) {
        return [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]
    }
    return [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]
}

function mod(n: number, m: number): number {
    return ((n % m) + m) % m
}

// One big, ugly function to generate all the stats
async function getRawStats(range: 'week' | 'month' | 'day', start: Date): Promise<StatsAggregates> {
    const mentionedItems: { [item: number]: string } = {}
    const mentionedUsers: { [userId: number]: string } = {}
    const mentionedCategories: { [category: number]: string } = {}

    // Start and end of this (unit)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    if (range === 'week') {
        end.setDate(end.getDate() + 6)
    } else if (range === 'month') {
        end.setDate(days(start.getFullYear())[start.getMonth()])
    }
    end.setHours(23, 59, 59, 999)

    // Start of the previous (unit)
    const lastStart = new Date(start)
    if (range === 'day') {
        lastStart.setDate(lastStart.getDate() - 1)
    } else if (range === 'week') {
        lastStart.setDate(lastStart.getDate() - 7)
    } else if (range === 'month') {
        lastStart.setMonth(mod(lastStart.getMonth() - 1, 12))
    }

    // 1. Fill new item stats
    const newItems = []
    for (const item of await prisma.itemType.findMany({
        where: {
            createdAt: {
                gte: start,
                lt: end
            }
        },
        select: {
            id: true,
            name: true
        }
    })) {
        let cups = 0
        let revenue = Decimal(0)
        const cupsGender = {
            male: 0,
            female: 0,
            others: 0,
            anonymous: 0
        }
        const revenueGender = {
            male: Decimal(0),
            female: Decimal(0),
            others: Decimal(0),
            anonymous: Decimal(0)
        }
        for (const orderedItem of await prisma.orderedItem.findMany({
            where: {
                itemTypeId: item.id,
                order: {
                    paymentStatus: PaymentStatus.paid
                }
            },
            select: {
                amount: true,
                price: true,
                order: {
                    select: {
                        user: true
                    }
                }
            }
        })) {
            cups += orderedItem.amount
            revenue = revenue.add(orderedItem.price)
            cupsGender[orderedItem.order.user?.gender ?? 'anonymous'] += orderedItem.amount
            revenueGender[orderedItem.order.user?.gender ?? 'anonymous'] = revenueGender[orderedItem.order.user?.gender ?? 'anonymous'].add(orderedItem.price)
        }
        newItems.push({
            id: item.id,
            cups,
            revenue: revenue.toString(),
            cupsGenderDistribution: cupsGender,
            revenueGenderDistribution: revenueGender
        })
        mentionedItems[item.id] = item.name
    }

    // 2. Fill total revenue, orders, and cups
    let totalRevenue = Decimal(0)
    let totalOrders = 0
    let totalCups = 0

    const revenuePerUnit = []
    const ordersPerUnit = []
    const cupsPerUnit = []
    const avgOrderValuePerUnit = []
    const avgOrderCupsPerUnit = []
    const maxOrderValuePerUnit = []
    const maxOrderCupsPerUnit = []
    const minOrderValuePerUnit = []
    const minOrderCupsPerUnit = []

    for (let i = 0; i < {
        day: 1,
        week: 7,
        month: days(start.getFullYear())[start.getMonth()]
    }[range]; i++) {
        revenuePerUnit.push(Decimal(0))
        ordersPerUnit.push(0)
        cupsPerUnit.push(0)
        avgOrderValuePerUnit.push(Decimal(0))
        avgOrderCupsPerUnit.push(0)
        maxOrderValuePerUnit.push(Decimal(0))
        maxOrderCupsPerUnit.push(0)
        minOrderValuePerUnit.push(Decimal(1e9))
        minOrderCupsPerUnit.push(1e9)
    }

    const paymentMethodDistribution: { [method: string]: number } = {}
    const paymentStatusDistribution: { [status: string]: number } = {}
    const genderCupsDistribution = {
        male: 0,
        female: 0,
        others: 0,
        anonymous: 0
    }
    const genderRevenueDistribution = {
        male: Decimal(0),
        female: Decimal(0),
        others: Decimal(0),
        anonymous: Decimal(0)
    }

    let avgOrderValue = Decimal(0)
    let avgOrderCups = 0
    for (const order of await prisma.order.findMany({
        where: {
            createdAt: {
                gte: start,
                lt: end
            },
            paymentStatus: PaymentStatus.paid
        },
        select: {
            createdAt: true,
            totalPrice: true,
            items: {
                select: {
                    amount: true
                }
            },
            paymentMethod: true,
            paymentStatus: true,
            user: {
                select: {
                    gender: true
                }
            }
        }
    })) {
        paymentMethodDistribution[order.paymentMethod] = (paymentMethodDistribution[order.paymentMethod] ?? 0) + 1
        paymentStatusDistribution[order.paymentStatus] = (paymentStatusDistribution[order.paymentStatus] ?? 0) + 1

        const thisOrderIndex = Math.floor((order.createdAt.getTime() - start.getTime()) / 1000 / 60 / 60 / 24)

        totalRevenue = totalRevenue.add(order.totalPrice)
        genderRevenueDistribution[order.user?.gender ?? 'anonymous'] = genderRevenueDistribution[order.user?.gender ?? 'anonymous'].add(order.totalPrice)
        revenuePerUnit[thisOrderIndex] = revenuePerUnit[thisOrderIndex].add(order.totalPrice)
        avgOrderValue = avgOrderValue.add(order.totalPrice)
        avgOrderValuePerUnit[thisOrderIndex] = avgOrderValuePerUnit[thisOrderIndex].add(order.totalPrice)
        if (Decimal(order.totalPrice).gt(maxOrderValuePerUnit[thisOrderIndex])) {
            maxOrderValuePerUnit[thisOrderIndex] = order.totalPrice
        }
        if (Decimal(order.totalPrice).lt(minOrderValuePerUnit[thisOrderIndex])) {
            minOrderValuePerUnit[thisOrderIndex] = Decimal(order.totalPrice)
        }

        totalOrders++
        ordersPerUnit[thisOrderIndex]++

        let thisOrderCups = 0
        for (const orderedItem of order.items) {
            totalCups += orderedItem.amount
            cupsPerUnit[thisOrderIndex] += orderedItem.amount
            genderCupsDistribution[order.user?.gender ?? 'anonymous'] += orderedItem.amount
            avgOrderCups += orderedItem.amount
            avgOrderCupsPerUnit[thisOrderIndex] += orderedItem.amount
            thisOrderCups += orderedItem.amount
        }

        if (thisOrderCups > maxOrderCupsPerUnit[thisOrderIndex]) {
            maxOrderCupsPerUnit[thisOrderIndex] = thisOrderCups
        }
        if (thisOrderCups < minOrderCupsPerUnit[thisOrderIndex]) {
            minOrderCupsPerUnit[thisOrderIndex] = thisOrderCups
        }
    }

    avgOrderValue = avgOrderValue.div(Math.max(totalOrders, 1))
    avgOrderCups = avgOrderCups / Math.max(totalOrders, 1)

    for (let i = 0; i < revenuePerUnit.length; i++) {
        avgOrderValuePerUnit[i] = avgOrderValuePerUnit[i].div(Math.max(ordersPerUnit[i], 1))
        avgOrderCupsPerUnit[i] = avgOrderCupsPerUnit[i] / Math.max(ordersPerUnit[i], 1)
        if (minOrderValuePerUnit[i].eq(1e9)) {
            minOrderValuePerUnit[i] = Decimal(0)
        }
        if (minOrderCupsPerUnit[i] === 1e9) {
            minOrderCupsPerUnit[i] = 0
        }
    }

    // 3. Fill total revenue, orders, and cups from last unit
    let lastTotalRevenue: Decimal | null = Decimal(0)
    let lastTotalOrders: number | null = 0
    let lastTotalCups: number | null = 0
    for (const order of await prisma.order.findMany({
        where: {
            createdAt: {
                gte: lastStart,
                lt: start
            },
            paymentStatus: PaymentStatus.paid
        },
        select: {
            totalPrice: true,
            items: {
                select: {
                    amount: true
                }
            }
        }
    })) {
        lastTotalRevenue = lastTotalRevenue.add(order.totalPrice)
        lastTotalOrders++
        for (const orderedItem of order.items) {
            lastTotalCups += orderedItem.amount
        }
    }
    if (lastTotalRevenue.eq(0)) {
        lastTotalRevenue = null
    }
    if (lastTotalOrders === 0) {
        lastTotalOrders = null
    }
    if (lastTotalCups === 0) {
        lastTotalCups = null
    }

    // 4. Identify categories
    const categoryCupsDistribution: { [category: number]: number } = {}
    const categoryRevenueDistribution: { [category: number]: Decimal } = {}
    const itemCupsDistribution: { [item: number]: number } = {}
    const itemRevenueDistribution: { [item: number]: Decimal } = {}
    const userCupsDistribution: { [userId: number]: number } = {}
    const userRevenueDistribution: { [userId: number]: Decimal } = {}

    for (const orderedItem of await prisma.orderedItem.findMany({
        where: {
            createdAt: {
                gte: start,
                lt: end
            },
            order: {
                paymentStatus: PaymentStatus.paid
            }
        },
        select: {
            price: true,
            amount: true,
            itemType: {
                select: {
                    id: true,
                    category: true,
                    name: true
                }
            },
            order: {
                select: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    })) {
        categoryCupsDistribution[orderedItem.itemType.category.id] = (categoryCupsDistribution[orderedItem.itemType.category.id] ?? 0) + orderedItem.amount
        categoryRevenueDistribution[orderedItem.itemType.category.id] = (categoryRevenueDistribution[orderedItem.itemType.category.id] ?? Decimal(0)).add(orderedItem.price)
        itemCupsDistribution[orderedItem.itemType.id] = (itemCupsDistribution[orderedItem.itemType.id] ?? 0) + orderedItem.amount
        itemRevenueDistribution[orderedItem.itemType.id] = (itemRevenueDistribution[orderedItem.itemType.id] ?? Decimal(0)).add(orderedItem.price)
        userCupsDistribution[orderedItem.order.user?.id ?? -1] = (userCupsDistribution[orderedItem.order.user?.id ?? -1] ?? 0) + orderedItem.amount
        userRevenueDistribution[orderedItem.order.user?.id ?? -1] = (userRevenueDistribution[orderedItem.order.user?.id ?? -1] ?? Decimal(0)).add(orderedItem.price)
        mentionedItems[orderedItem.itemType.id] = orderedItem.itemType.name
        mentionedCategories[orderedItem.itemType.category.id] = orderedItem.itemType.category.name
        mentionedUsers[orderedItem.order.user?.id ?? -1] = orderedItem.order.user?.name ?? 'Anonymous'
    }

    return {
        newItems: newItems.map(item => ({
            id: item.id,
            cups: item.cups,
            revenue: item.revenue,
            cupsGenderDistribution: item.cupsGenderDistribution,
            revenueGenderDistribution: Object.fromEntries(Object.entries(item.revenueGenderDistribution).map(([ k, v ]) => [ k, v.toString() ]))
        })),
        totalRevenue: totalRevenue.toString(),
        totalOrders,
        totalCups,
        lastTotalRevenue: lastTotalRevenue?.toString() ?? null,
        lastTotalOrders: lastTotalOrders ?? null,
        lastTotalCups: lastTotalCups ?? null,
        ordersPerUnit,
        cupsPerUnit,
        revenuePerUnit: revenuePerUnit.map(x => x.toString()),
        categoryCupsDistribution,
        categoryRevenueDistribution: Object.fromEntries(Object.entries(categoryRevenueDistribution).map(([ k, v ]) => [ k, v.toString() ])),
        itemCupsDistribution,
        itemRevenueDistribution: Object.fromEntries(Object.entries(itemRevenueDistribution).map(([ k, v ]) => [ k, v.toString() ])),
        genderCupsDistribution,
        genderRevenueDistribution: Object.fromEntries(Object.entries(genderRevenueDistribution).map(([ k, v ]) => [ k, v.toString() ])),
        userCupsDistribution,
        userRevenueDistribution: Object.fromEntries(Object.entries(userRevenueDistribution).map(([ k, v ]) => [ k, v.toString() ])),
        paymentMethodDistribution,
        paymentStatusDistribution,
        averageOrderValue: avgOrderValue.toString(),
        averageOrderCups: avgOrderCups,
        averageOrderValuePerUnit: avgOrderValuePerUnit.map(x => x.toString()),
        averageOrderCupsPerUnit: avgOrderCupsPerUnit,
        maxOrderValuePerUnit: maxOrderValuePerUnit.map(x => x.toString()),
        maxOrderCupsPerUnit,
        minOrderValuePerUnit: minOrderValuePerUnit.map(x => x.toString()),
        minOrderCupsPerUnit,
        mentionedCategories,
        mentionedUsers,
        mentionedItems
    }
}

// Simple memory cache
const cached: { [key: string]: { data: StatsAggregates, time: number } } = {}

export async function getStats(range: 'week' | 'month' | 'day', start: Date): Promise<StatsAggregates> {
    await requireUserPermission('admin.manage')
    if (range === 'week') {
        start.setDate(start.getDate() - (start.getDay() + 6) % 7)
    }
    if (range === 'month') {
        start.setDate(1)
    }
    start.setHours(0, 0, 0, 0)
    const key = range + start.getTime()
    if (key in cached && (new Date().getTime()) - cached[key].time < 30 * 60 * 1000) {
        return cached[key].data
    }
    cached[key] = {
        data: await getRawStats(range, start),
        time: new Date().getTime()
    }
    return cached[key].data
}
