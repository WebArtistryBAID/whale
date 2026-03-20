'use server'

import {
    CouponCode,
    ItemType,
    OptionItem,
    OrderStatus,
    OrderType,
    PaymentMethod,
    PaymentStatus,
    User,
    UserAuditLogType
} from '@/generated/prisma/client'
import { OrderedItemTemplate } from '@/app/lib/shopping-cart'
import { getMyUser } from '@/app/login/login-actions'
import Decimal from 'decimal.js'
import { getConfigValueAsBoolean, getConfigValueAsNumber, getConfigValues } from '@/app/lib/settings-actions'
import { prisma } from '@/app/lib/prisma'

export interface HydratedOrderedItem {
    id: number
    orderId: number
    itemType: ItemType
    itemTypeId: number
    appliedOptions: OptionItem[]
    amount: number
    price: string
}

export interface HydratedOrder {
    id: number
    items: HydratedOrderedItem[]
    totalPrice: string
    totalPriceRaw: string
    status: OrderStatus
    createdAt: Date
    updatedAt: Date
    type: OrderType
    deliveryRoom: string | null
    user: User | null
    userId: number | null
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
    stripeSession: string | null
    stripePaymentIntent: string | null
    stripeCustomerId: string | null
    wxPayId: string | null
}

export interface EstimatedWaitTimeResponse {
    time: number
    cups: number
    orders: number
}

type OrderingPhase = 'live' | 'preorder' | 'closed'
type OrderingUnavailableReason = 'none' | 'store-closed' | 'live-limit-reached' | 'preorder-limit-reached'
type OrderLimitBucket = 'live' | 'preorder'

interface OrderingConfiguration {
    enableScheduledAvailability: boolean
    weekdaysOnly: boolean
    openTime: string
    openTimeMinutes: number
    closeTime: string
    closeTimeMinutes: number
    preOrderStartTime: string
    preOrderStartTimeMinutes: number
    storeOpen: boolean
    availabilityOverrideDate: string
    availabilityOverrideValue: boolean
    liveLimit: number
    preOrderLimit: number
}

interface OrderBucketAssignment {
    bucket: OrderLimitBucket
    targetDate: Date
}

export interface DailyCupLimitSummary {
    dateKey: string
    liveLimit: number
    preOrderLimit: number
    officialLimit: number
    preOrderedCups: number
    liveOrderedCups: number
    remainingPreOrderCups: number
    remainingLiveCups: number
}

export interface OrderingAvailabilityResponse {
    phase: OrderingPhase
    canOrderNow: boolean
    isStoreOpen: boolean
    unavailableReason: OrderingUnavailableReason
    currentDay: DailyCupLimitSummary
    openTime: string
    closeTime: string
    preOrderStartTime: string
}

function startOfDay(date: Date): Date {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

function endOfDay(date: Date): Date {
    return addDays(startOfDay(date), 1)
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

function formatLegacyDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function parseTimeToMinutes(value: string | undefined, fallback: number): number {
    if (value == null) {
        return fallback
    }

    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
    if (match == null) {
        return fallback
    }

    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return fallback
    }

    return hours * 60 + minutes
}

function dateAtMinutes(date: Date, minutes: number): Date {
    const result = startOfDay(date)
    result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    return result
}

function isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day !== 0 && day !== 6
}

function isBusinessDay(date: Date, config: OrderingConfiguration): boolean {
    return !config.weekdaysOnly || isWeekday(date)
}

function findNextBusinessDay(date: Date, config: OrderingConfiguration, includeSelf: boolean): Date {
    let cursor = startOfDay(date)
    if (!includeSelf) {
        cursor = addDays(cursor, 1)
    }

    while (!isBusinessDay(cursor, config)) {
        cursor = addDays(cursor, 1)
    }

    return cursor
}

function findPreviousBusinessDay(date: Date, config: OrderingConfiguration): Date {
    let cursor = addDays(startOfDay(date), -1)
    while (!isBusinessDay(cursor, config)) {
        cursor = addDays(cursor, -1)
    }
    return cursor
}

function getOverrideValueForDate(date: Date, config: OrderingConfiguration): boolean | null {
    if (config.availabilityOverrideDate !== formatDateKey(date) &&
        config.availabilityOverrideDate !== formatLegacyDateKey(date)) {
        return null
    }

    return config.availabilityOverrideValue
}

function isWithinRange(target: Date, start: Date, end: Date): boolean {
    return target.getTime() >= start.getTime() && target.getTime() < end.getTime()
}

function getBusinessDayWindows(day: Date, config: OrderingConfiguration): {
    openAt: Date,
    closeAt: Date,
    preOrderStartsAt: Date | null
} {
    const openAt = dateAtMinutes(day, config.openTimeMinutes)
    const closeAt = dateAtMinutes(day, config.closeTimeMinutes)

    if (config.preOrderStartTimeMinutes === config.openTimeMinutes) {
        return {
            openAt,
            closeAt,
            preOrderStartsAt: null
        }
    }

    const preOrderDate = config.preOrderStartTimeMinutes < config.openTimeMinutes
        ? day
        : findPreviousBusinessDay(day, config)

    return {
        openAt,
        closeAt,
        preOrderStartsAt: dateAtMinutes(preOrderDate, config.preOrderStartTimeMinutes)
    }
}

function getPreOrderTargetDay(now: Date, config: OrderingConfiguration): Date | null {
    const today = startOfDay(now)

    if (isBusinessDay(today, config)) {
        const todayWindows = getBusinessDayWindows(today, config)
        if (todayWindows.preOrderStartsAt != null && isWithinRange(now, todayWindows.preOrderStartsAt, todayWindows.openAt)) {
            return today
        }
    }

    const nextBusinessDay = findNextBusinessDay(today, config, !isBusinessDay(today, config))
    if (formatDateKey(nextBusinessDay) === formatDateKey(today)) {
        return null
    }

    const nextWindows = getBusinessDayWindows(nextBusinessDay, config)
    if (nextWindows.preOrderStartsAt != null && isWithinRange(now, nextWindows.preOrderStartsAt, nextWindows.openAt)) {
        return nextBusinessDay
    }

    return null
}

function isLiveWindow(now: Date, config: OrderingConfiguration): boolean {
    const today = startOfDay(now)
    if (!isBusinessDay(today, config)) {
        return false
    }

    const todayWindows = getBusinessDayWindows(today, config)
    return now.getTime() >= todayWindows.openAt.getTime() && now.getTime() <= todayWindows.closeAt.getTime()
}

function assignOrderBucket(createdAt: Date, config: OrderingConfiguration): OrderBucketAssignment {
    const orderDay = startOfDay(createdAt)

    if (!config.enableScheduledAvailability) {
        return {
            bucket: 'live',
            targetDate: orderDay
        }
    }

    if (isBusinessDay(orderDay, config)) {
        const todayWindows = getBusinessDayWindows(orderDay, config)
        if (todayWindows.preOrderStartsAt != null && isWithinRange(createdAt, todayWindows.preOrderStartsAt, todayWindows.openAt)) {
            return {
                bucket: 'preorder',
                targetDate: orderDay
            }
        }
    }

    const nextBusinessDay = findNextBusinessDay(orderDay, config, !isBusinessDay(orderDay, config))
    const nextWindows = getBusinessDayWindows(nextBusinessDay, config)
    if (nextWindows.preOrderStartsAt != null && isWithinRange(createdAt, nextWindows.preOrderStartsAt, nextWindows.openAt)) {
        return {
            bucket: 'preorder',
            targetDate: nextBusinessDay
        }
    }

    return {
        bucket: 'live',
        targetDate: orderDay
    }
}

async function getOrderingConfiguration(): Promise<OrderingConfiguration> {
    const values = await getConfigValues()

    const openTime = values['open-time'] ?? '10:00'
    const closeTime = values['close-time'] ?? '15:00'
    const preOrderStartTime = values['pre-order-start-time'] ?? openTime

    return {
        enableScheduledAvailability: (values['enable-scheduled-availability'] ?? 'true') === 'true',
        weekdaysOnly: (values['weekdays-only'] ?? 'true') === 'true',
        openTime,
        openTimeMinutes: parseTimeToMinutes(openTime, 10 * 60),
        closeTime,
        closeTimeMinutes: parseTimeToMinutes(closeTime, 15 * 60),
        preOrderStartTime,
        preOrderStartTimeMinutes: parseTimeToMinutes(preOrderStartTime, parseTimeToMinutes(openTime, 10 * 60)),
        storeOpen: (values['store-open'] ?? 'true') === 'true',
        availabilityOverrideDate: values['availability-override-date'] ?? '0000-00-00',
        availabilityOverrideValue: (values['availability-override-value'] ?? 'false') === 'true',
        liveLimit: parseFloat(values['maximum-cups-per-day'] ?? '14'),
        preOrderLimit: parseFloat(values['maximum-pre-order-cups-per-day'] ?? '0')
    }
}

async function getDailyCupLimitSummary(date: Date, config: OrderingConfiguration): Promise<DailyCupLimitSummary> {
    const day = startOfDay(date)
    const windows = getBusinessDayWindows(day, config)
    const rangeStart = windows.preOrderStartsAt ?? day
    const rangeEnd = endOfDay(day)
    const targetDateKey = formatDateKey(day)

    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: rangeStart,
                lt: rangeEnd
            }
        },
        select: {
            createdAt: true,
            items: {
                select: {
                    amount: true
                }
            }
        }
    })

    let preOrderedCups = 0
    let liveOrderedCups = 0

    for (const order of orders) {
        const assignment = assignOrderBucket(order.createdAt, config)
        if (formatDateKey(assignment.targetDate) !== targetDateKey) {
            continue
        }

        const cups = order.items.reduce((acc, item) => acc + item.amount, 0)
        if (assignment.bucket === 'preorder') {
            preOrderedCups += cups
            continue
        }
        liveOrderedCups += cups
    }

    const remainingPreOrderCups = Math.max(config.preOrderLimit - preOrderedCups, 0)
    const officialLimit = config.liveLimit + remainingPreOrderCups
    const remainingLiveCups = Math.max(officialLimit - liveOrderedCups, 0)

    return {
        dateKey: targetDateKey,
        liveLimit: config.liveLimit,
        preOrderLimit: config.preOrderLimit,
        officialLimit,
        preOrderedCups,
        liveOrderedCups,
        remainingPreOrderCups,
        remainingLiveCups
    }
}

export async function getOrderingAvailability(): Promise<OrderingAvailabilityResponse> {
    const now = new Date()
    const today = startOfDay(now)
    const config = await getOrderingConfiguration()
    const overrideValue = getOverrideValueForDate(today, config)
    const preOrderTargetDay = config.enableScheduledAvailability && overrideValue == null
        ? getPreOrderTargetDay(now, config)
        : null

    let phase: OrderingPhase = 'closed'
    let targetDay = config.enableScheduledAvailability ? findNextBusinessDay(today, config, true) : today
    let isStoreOpenNow = false

    if (overrideValue === true) {
        phase = 'live'
        targetDay = today
        isStoreOpenNow = true
    } else if (overrideValue === false) {
        phase = 'closed'
        targetDay = today
        isStoreOpenNow = false
    } else if (!config.enableScheduledAvailability) {
        phase = config.storeOpen ? 'live' : 'closed'
        targetDay = today
        isStoreOpenNow = config.storeOpen
    } else if (preOrderTargetDay != null) {
        phase = 'preorder'
        targetDay = preOrderTargetDay
        isStoreOpenNow = isLiveWindow(now, config)
    } else if (isLiveWindow(now, config)) {
        phase = 'live'
        targetDay = today
        isStoreOpenNow = true
    } else {
        phase = 'closed'
        targetDay = isBusinessDay(today, config) ? today : findNextBusinessDay(today, config, true)
        isStoreOpenNow = false
    }

    const currentDay = await getDailyCupLimitSummary(targetDay, config)

    if (phase === 'preorder') {
        return {
            phase,
            canOrderNow: currentDay.remainingPreOrderCups > 0,
            isStoreOpen: isStoreOpenNow,
            unavailableReason: currentDay.remainingPreOrderCups > 0 ? 'none' : 'preorder-limit-reached',
            currentDay,
            openTime: config.openTime,
            closeTime: config.closeTime,
            preOrderStartTime: config.preOrderStartTime
        }
    }

    if (phase === 'live') {
        return {
            phase,
            canOrderNow: currentDay.remainingLiveCups > 0,
            isStoreOpen: isStoreOpenNow,
            unavailableReason: currentDay.remainingLiveCups > 0 ? 'none' : 'live-limit-reached',
            currentDay,
            openTime: config.openTime,
            closeTime: config.closeTime,
            preOrderStartTime: config.preOrderStartTime
        }
    }

    return {
        phase,
        canOrderNow: false,
        isStoreOpen: false,
        unavailableReason: 'store-closed',
        currentDay,
        openTime: config.openTime,
        closeTime: config.closeTime,
        preOrderStartTime: config.preOrderStartTime
    }
}

export async function setOrderPaymentMethod(id: number, paymentMethod: PaymentMethod): Promise<boolean> {
    const order = await prisma.order.findUnique({
        where: {
            id,
            paymentStatus: PaymentStatus.notPaid
        }
    })
    if (order == null) {
        return false
    }
    await prisma.order.update({
        where: { id },
        data: { paymentMethod }
    })
    return true
}

export async function requireUnpaidOrder(order: number): Promise<HydratedOrder> {
    const o = await getOrder(order)
    if (o == null || o.paymentStatus !== PaymentStatus.notPaid) {
        throw 'Bad request'
    }
    return o
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

export async function canPayWithBalance(totalPrice: string): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    return Decimal(me.balance).gte(totalPrice)
}

export async function canPayWithPayLater(): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    return await prisma.order.count({
        where: {
            userId: me.id,
            paymentStatus: PaymentStatus.notPaid
        }
    }) === 0 && await getConfigValueAsBoolean('allow-pay-later')
}

export async function getUnpaidPayLaterOrder(): Promise<number> {
    const me = await getMyUser()
    if (me == null) {
        return -1
    }
    const order = await prisma.order.findFirst({
        where: {
            userId: me.id,
            paymentStatus: PaymentStatus.notPaid
        }
    })
    return order?.id ?? -1
}

export async function payLaterBalance(id: number): Promise<boolean> {
    return payOrderWithBalance(id)
}

export async function payOrderWithBalance(id: number): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    const order = await prisma.order.findUnique({
        where: {
            id,
            paymentStatus: PaymentStatus.notPaid
        }
    })
    if (order == null) {
        return false
    }
    if (order.paymentStatus !== PaymentStatus.notPaid) {
        return true
    }
    if (Decimal(me.balance).lt(order.totalPrice)) {
        return false
    }
    await prisma.user.update({
        where: {
            id: me.id
        },
        data: {
            balance: Decimal(me.balance).minus(order.totalPrice).toString()
        }
    })

    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.balanceUsed,
            user: {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            },
            values: [ order.totalPrice, Decimal(me.balance).minus(order.totalPrice).toString() ]
        }
    })

    await prisma.order.update({
        where: {
            id
        },
        data: {
            paymentStatus: PaymentStatus.paid,
            paymentMethod: PaymentMethod.balance
        }
    })

    await prisma.user.update({
        where: {
            id: me.id
        },
        data: {
            points: Decimal(me.points).add(order.totalPriceRaw).toString()
        }
    })

    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.pointsUpdated,
            user: {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            },
            values: [ order.totalPriceRaw, Decimal(me.points).add(order.totalPriceRaw).toString() ]
        }
    })
    return true
}

export async function isStoreOpen(): Promise<boolean> {
    return (await getOrderingAvailability()).isStoreOpen
}

export async function isMaximumCupsReached(): Promise<boolean> {
    const availability = await getOrderingAvailability()
    return !availability.canOrderNow && availability.unavailableReason !== 'store-closed'
}

export async function createOrder(items: OrderedItemTemplate[],
                                  coupon: string | null,
                                  onSiteOrderMode: boolean,
                                  deliveryRoom: string | null,
                                  paymentMethod: PaymentMethod): Promise<HydratedOrder | null> {
    const me = await getMyUser()

    // We didn't perform atomization - for a small use case like this, we should be fine.

    // SANITY CHECKS - These should be enforced by the frontend as well
    // On site order mode require administrative permissions
    if (onSiteOrderMode && (me == null || !me.permissions.includes('admin.manage'))) {
        return null
    }

    const availability = await getOrderingAvailability()

    // Ensure the storefront is currently accepting this type of order
    if (!availability.canOrderNow) {
        return null
    }

    // Ensure we didn't go over maximum cups per order
    const totalAmount = items.reduce((acc, item) => acc + item.amount, 0)
    if (totalAmount < 0 || totalAmount > await getConfigValueAsNumber('maximum-cups-per-order')) {
        return null
    }

    if (!(await getConfigValueAsBoolean('allow-delivery')) && deliveryRoom != null && deliveryRoom != '') {
        return null
    }

    if (!(await getConfigValueAsBoolean('allow-pay-later')) && paymentMethod === PaymentMethod.payLater) {
        return null
    }

    // Ensure items and options aren't sold out
    for (const item of items) {
        if (item.item.soldOut) {
            return null
        }
        for (const option of item.options) {
            if (option.soldOut) {
                return null
            }
        }
    }

    // Calculate total price
    let usedCoupon = false
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
        usedCoupon = true
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

    // No using pay later if you're not logged in or have unpaid orders before
    if (paymentMethod === PaymentMethod.payLater) {
        if (me == null) {
            return null
        }
        if (await prisma.order.count({
            where: {
                userId: me.id,
                paymentStatus: PaymentStatus.notPaid
            }
        }) > 0) {
            return null
        }
    }

    // Pay later, balance, and pay for me aren't available with on-site
    if ((paymentMethod === PaymentMethod.payLater || paymentMethod === PaymentMethod.balance || paymentMethod === PaymentMethod.payForMe) && onSiteOrderMode) {
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
                    amount: item.amount,
                    price: calculatePrice(item).toString()
                }))
            },
            totalPrice: totalPrice.toString(),
            totalPriceRaw: totalPriceNoCoupon.toString(),
            status: OrderStatus.waiting,
            type: deliveryRoom == null ? OrderType.pickUp : OrderType.delivery,
            deliveryRoom,
            user: (onSiteOrderMode || me == null) ? undefined : {
                connect: {
                    id: me?.id
                }
            },
            paymentStatus: (totalPrice.eq(0) || paymentMethod === PaymentMethod.cash || paymentMethod === PaymentMethod.balance) ? PaymentStatus.paid : PaymentStatus.notPaid,
            paymentMethod
        }
    })

    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.orderCreated,
            user: me == null ? undefined : {
                connect: {
                    id: me.id
                }
            },
            order: {
                connect: {
                    id: order.id
                }
            }
        }
    })
    if (usedCoupon) {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.couponUsed,
                user: me == null ? undefined : {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ coupon! ]
            }
        })
    }

    // Add points to user
    if (me != null && !onSiteOrderMode && order.paymentStatus === PaymentStatus.paid) {
        await prisma.user.update({
            where: {
                id: me.id
            },
            data: {
                points: Decimal(me.points).add(totalPriceNoCoupon).toString()
            }
        })

        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.pointsUpdated,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ totalPriceNoCoupon.toString(), Decimal(me.points).add(totalPriceNoCoupon).toString() ]
            }
        })
    }

    if (order.paymentMethod === PaymentMethod.cash) {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderPaymentSuccess,
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ 'cash', totalPrice.toString() ]
            }
        })
    }

    if (me != null && order.paymentMethod === PaymentMethod.balance) {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.balanceUsed,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ totalPrice.toString(), Decimal(me.balance).minus(totalPrice).toString() ]
            }
        })
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.orderPaymentSuccess,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                order: {
                    connect: {
                        id: order.id
                    }
                },
                values: [ 'balance', totalPrice.toString() ]
            }
        })
    }

    return order
}

export async function getEstimatedWaitTime(): Promise<EstimatedWaitTimeResponse> {
    const orders = await prisma.order.findMany({
        where: {
            status: OrderStatus.waiting,
            OR: [
                {
                    paymentStatus: PaymentStatus.paid
                },
                {
                    paymentMethod: PaymentMethod.payLater
                }
            ]
        },
        include: {
            items: true
        }
    })
    let cups = 0
    for (const order of orders) {
        for (const item of order.items) {
            cups += item.amount
        }
    }
    return {
        time: cups * 2, // Assuming 2 minutes per cup
        cups,
        orders: orders.length
    }
}

export async function getEstimatedWaitTimeFor(order: number): Promise<EstimatedWaitTimeResponse> {
    const o = await prisma.order.findUnique({
        where: {
            id: order
        }
    })
    if (o == null) {
        return {
            time: 0,
            cups: 0,
            orders: 0
        }
    }
    const orders = await prisma.order.findMany({
        where: {
            status: OrderStatus.waiting,
            createdAt: {
                lte: o.createdAt
            },
            OR: [
                {
                    paymentStatus: PaymentStatus.paid
                },
                {
                    paymentMethod: PaymentMethod.payLater
                }
            ]
        },
        include: {
            items: true
        }
    })
    let cups = 0
    for (const order of orders) {
        for (const item of order.items) {
            cups += item.amount
        }
    }
    return {
        time: cups * 2, // Assuming 2 minutes per cup
        cups,
        orders: orders.length
    }
}

export async function cancelUnpaidOrder(id: number): Promise<OrderedItemTemplate[]> {
    const order = await prisma.order.findUnique({
        where: {
            id,
            paymentStatus: PaymentStatus.notPaid
        },
        include: {
            items: {
                include: {
                    itemType: true,
                    appliedOptions: true
                }
            }
        }
    })
    if (order == null) {
        return []
    }
    await prisma.order.delete({
        where: {
            id
        }
    })
    return order.items.map(item => ({
        item: item.itemType,
        amount: item.amount,
        options: item.appliedOptions
    }))
}
