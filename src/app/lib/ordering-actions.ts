'use server'

import {
    CouponCode,
    ItemType,
    OptionItem,
    OrderStatus,
    OrderType,
    PaymentMethod,
    PaymentStatus,
    Prisma,
    User,
    UserAuditLogType
} from '@/generated/prisma/client'
import { OrderedItemTemplate } from '@/app/lib/shopping-cart'
import { getMyUser } from '@/app/login/login-actions'
import { normalizeCouponCode } from '@/app/lib/coupon-codes'
import Decimal from 'decimal.js'
import { getConfigValueAsBoolean, getConfigValueAsNumber, getConfigValues } from '@/app/lib/settings-actions'
import { prisma } from '@/app/lib/prisma'
import { canAccessOrder, grantGuestOrder } from '@/app/lib/order-access'
import { positiveId, money } from '@/app/lib/security'
import { countsTowardLimit, getAvailableInventory, isItemSoldOut } from '@/app/lib/item-availability'
import { isValidPickUpTime, PickUpTimeOption } from '@/app/lib/pick-up-times'

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
    pickUpTime: string | null
    deliveryRoom: string | null
    user: User | null
    userId: number | null
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
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
    openAt: string
    openTime: string
    closeTime: string
    preOrderStartTime: string
}

export interface CartValidationIssue {
    itemTypeId: number
    itemName: string
    requested: number
    available: number
}

export interface CartValidationResponse {
    countedAmount: number
    issues: CartValidationIssue[]
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

type OrderableItemRecord = Pick<ItemType, 'id' | 'name' | 'soldOut' | 'countsTowardLimit' | 'inventoryTrackingEnabled' | 'remainingItems'>
type TransactionClient = Prisma.TransactionClient

function getRequestedItemAmounts(items: OrderedItemTemplate[]): Map<number, number> {
    const requestedAmounts = new Map<number, number>()
    for (const item of items) {
        requestedAmounts.set(item.item.id, (requestedAmounts.get(item.item.id) ?? 0) + item.amount)
    }
    return requestedAmounts
}

function getCurrentCountedAmount(items: OrderedItemTemplate[], itemMap: Map<number, OrderableItemRecord>): number {
    return items.reduce((acc, current) => {
        const item = itemMap.get(current.item.id)
        if (item == null || !countsTowardLimit(item)) {
            return acc
        }
        return acc + current.amount
    }, 0)
}

function getRemainingLimitForAvailability(availability: OrderingAvailabilityResponse): number {
    if (availability.phase === 'preorder') {
        return availability.currentDay.remainingPreOrderCups
    }
    if (availability.phase === 'live') {
        return availability.currentDay.remainingLiveCups
    }
    return 0
}

function buildCartValidation(items: OrderedItemTemplate[], itemMap: Map<number, OrderableItemRecord>): CartValidationResponse {
    const requestedAmounts = getRequestedItemAmounts(items)
    const issues: CartValidationIssue[] = []

    for (const [ itemTypeId, requested ] of requestedAmounts.entries()) {
        const item = itemMap.get(itemTypeId)
        if (item == null) {
            issues.push({
                itemTypeId,
                itemName: 'Unknown Item',
                requested,
                available: 0
            })
            continue
        }

        const availableInventory = getAvailableInventory(item)
        if (availableInventory != null) {
            if (requested > availableInventory) {
                issues.push({
                    itemTypeId,
                    itemName: item.name,
                    requested,
                    available: availableInventory
                })
            }
            continue
        }

        if (isItemSoldOut(item)) {
            issues.push({
                itemTypeId,
                itemName: item.name,
                requested,
                available: 0
            })
        }
    }

    return {
        countedAmount: getCurrentCountedAmount(items, itemMap),
        issues
    }
}

async function getOrderableItems(itemIds: number[], tx?: TransactionClient): Promise<Map<number, OrderableItemRecord>> {
    const client = tx ?? prisma
    const itemRecords = await client.itemType.findMany({
        where: {
            id: {
                in: itemIds
            }
        },
        select: {
            id: true,
            name: true,
            soldOut: true,
            countsTowardLimit: true,
            inventoryTrackingEnabled: true,
            remainingItems: true
        }
    })
    return new Map(itemRecords.map(item => [ item.id, item ]))
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
                    amount: true,
                    countsTowardLimit: true
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

        const cups = order.items.reduce((acc, item) => acc + (item.countsTowardLimit ? item.amount : 0), 0)
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
    const openAt = dateAtMinutes(targetDay, config.openTimeMinutes).toISOString()

    if (phase === 'preorder') {
        return {
            phase,
            canOrderNow: currentDay.remainingPreOrderCups > 0,
            isStoreOpen: isStoreOpenNow,
            unavailableReason: currentDay.remainingPreOrderCups > 0 ? 'none' : 'preorder-limit-reached',
            currentDay,
            openAt,
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
            openAt,
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
        openAt,
        openTime: config.openTime,
        closeTime: config.closeTime,
        preOrderStartTime: config.preOrderStartTime
    }
}

export async function hasAvailableItemsOutsideLimit(): Promise<boolean> {
    return await prisma.itemType.count({
        where: {
            countsTowardLimit: false,
            OR: [
                {
                    inventoryTrackingEnabled: true,
                    remainingItems: {
                        gt: 0
                    }
                },
                {
                    inventoryTrackingEnabled: false,
                    soldOut: false
                }
            ]
        }
    }) > 0
}

export async function setOrderCheckoutOptions(id: number, paymentMethod: PaymentMethod, pickUpTime: PickUpTimeOption | null): Promise<boolean> {
    if (![PaymentMethod.wxPay, PaymentMethod.balance].some(method => method === paymentMethod) || !positiveId(id)) return false
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order || !await canAccessOrder(order, true) || order.paymentStatus !== PaymentStatus.notPaid) return false
    if (order.type === OrderType.pickUp && !isValidPickUpTime(pickUpTime)) return false
    const result = await prisma.order.updateMany({
        where: { id, paymentStatus: PaymentStatus.notPaid },
        // The payment method is recorded when payment succeeds. This preserves shared payment links and deferred payments.
        data: { pickUpTime: order.type === OrderType.pickUp ? pickUpTime : null }
    })
    if (result.count === 1 && order.paymentMethod === PaymentMethod.payForMe) await grantGuestOrder(id)
    return result.count === 1
}

export async function requireUnpaidOrder(order: number): Promise<HydratedOrder> {
    const o = await getOrder(order)
    if (o == null || o.paymentStatus !== PaymentStatus.notPaid) {
        throw 'Bad request'
    }
    return o
}

export async function couponQuickValidate(code: string): Promise<CouponCode | null> {
    const normalizedCode = normalizeCouponCode(code)
    if (normalizedCode.length < 1) {
        return null
    }
    return prisma.couponCode.findUnique({
        where: {
            id: normalizedCode,
            remainingUses: {
                gt: 0
            }
        }
    })
}

export async function validateCartItems(items: OrderedItemTemplate[]): Promise<CartValidationResponse> {
    const itemIds = Array.from(new Set(items.map(item => item.item.id)))
    if (itemIds.length < 1) {
        return {
            countedAmount: 0,
            issues: []
        }
    }

    const itemMap = await getOrderableItems(itemIds)
    return buildCartValidation(items, itemMap)
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
    if (!positiveId(id)) return null
    const order = await prisma.order.findUnique({
        where: { id },
        select: {
            id: true, totalPrice: true, totalPriceRaw: true, status: true, createdAt: true, updatedAt: true,
            type: true, pickUpTime: true, deliveryRoom: true, userId: true, paymentStatus: true,
            paymentMethod: true, wxPayId: true, user: true,
            items: { include: { itemType: true, appliedOptions: true } }
        }
    })
    if (!order || !await canAccessOrder(order, true)) return null
    if (!await canAccessOrder(order)) order.user = null
    return order
}

export async function canPayWithBalance(totalPrice: string): Promise<boolean> {
    const me = await getMyUser()
    if (me == null) {
        return false
    }
    const amount = money(totalPrice)
    return amount != null && Decimal(me.balance).gte(amount)
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
    const user = await getMyUser()
    if (!user || !positiveId(id)) return false
    const candidate = await prisma.order.findUnique({ where: { id } })
    if (!candidate || !await canAccessOrder(candidate, true)) return false
    try {
        return await prisma.$transaction(async tx => {
            const order = await tx.order.findUnique({ where: { id } })
            const payer = await tx.user.findUnique({ where: { id: user.id, blocked: false } })
            if (!order || !payer || order.paymentStatus !== PaymentStatus.notPaid) return false
            const amount = money(order.totalPrice)
            if (!amount || Decimal(payer.balance).lt(amount)) return false
            const claimed = await tx.order.updateMany({
                where: { id, paymentStatus: PaymentStatus.notPaid },
                data: { paymentStatus: PaymentStatus.paid, paymentMethod: PaymentMethod.balance }
            })
            if (claimed.count !== 1) return false
            const balance = Decimal(payer.balance).minus(amount).toFixed(2)
            await tx.user.update({ where: { id: payer.id }, data: { balance } })
            await tx.userAuditLog.create({ data: {
                type: UserAuditLogType.balanceUsed, userId: payer.id, orderId: id,
                values: [order.totalPrice, balance]
            } })
            if (order.userId != null) {
                const recipient = await tx.user.findUniqueOrThrow({ where: { id: order.userId } })
                const points = Decimal(recipient.points).add(order.totalPriceRaw).toString()
                await tx.user.update({ where: { id: recipient.id }, data: { points } })
                await tx.userAuditLog.create({ data: {
                    type: UserAuditLogType.pointsUpdated, userId: recipient.id, orderId: id,
                    values: [order.totalPriceRaw, points]
                } })
            }
            await tx.userAuditLog.create({ data: {
                type: UserAuditLogType.orderPaymentSuccess, userId: payer.id, orderId: id,
                values: ['balance', order.totalPrice]
            } })
            return true
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch { return false }
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
                                  paymentMethod: PaymentMethod,
                                  pickUpTime: PickUpTimeOption | null): Promise<HydratedOrder | null> {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100 || !Object.values(PaymentMethod).includes(paymentMethod) || paymentMethod === PaymentMethod.stripe) return null
    if (items.some(item => !item || !positiveId(item.item?.id) || !Number.isSafeInteger(item.amount) || item.amount <= 0 || !Array.isArray(item.options) || item.options.length > 50 || item.options.some(option => !positiveId(option?.id)))) return null
    if (typeof onSiteOrderMode !== 'boolean' || (coupon != null && (typeof coupon !== 'string' || coupon.length > 100))) return null
    if (deliveryRoom != null && (typeof deliveryRoom !== 'string' || deliveryRoom.trim().length < 3 || deliveryRoom.length > 200)) return null
    if (deliveryRoom == null ? !isValidPickUpTime(pickUpTime) : pickUpTime != null) return null
    const user = await getMyUser()
    if (onSiteOrderMode && !user?.permissions.includes('admin.manage')) return null
    if (paymentMethod === PaymentMethod.cash && !onSiteOrderMode) return null
    if (onSiteOrderMode && [PaymentMethod.balance, PaymentMethod.payLater, PaymentMethod.payForMe].some(method => method === paymentMethod)) return null
    if ([PaymentMethod.balance, PaymentMethod.payLater].some(method => method === paymentMethod) && !user) return null
    if (!user && !process.env.JWT_SECRET) return null
    const normalizedCoupon = coupon == null ? null : normalizeCouponCode(coupon)
    try {
        const order = await prisma.$transaction(async tx => {
            // Serialize order creation so availability limits cover concurrent checkouts.
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(78236401)`
            const availability = await getOrderingAvailability()
            if (availability.unavailableReason === 'store-closed') throw new Error('Store closed')
            if (deliveryRoom != null && !await getConfigValueAsBoolean('allow-delivery')) throw new Error('Delivery disabled')
            const amount = items.reduce((sum, item) => sum + item.amount, 0)
            if (!Number.isSafeInteger(amount) || amount > await getConfigValueAsNumber('maximum-cups-per-order')) throw new Error('Invalid quantity')
            const catalog = await tx.itemType.findMany({
                where: { id: { in: items.map(item => item.item.id) } },
                include: { options: { include: { items: true } } }
            })
            const canonicalItems = items.map(selection => {
                const item = catalog.find(record => record.id === selection.item.id)
                if (!item || selection.options.length !== item.options.length) throw new Error('Invalid item options')
                const seen = new Set<number>()
                const options = selection.options.map(selected => {
                    const group = item.options.find(type => type.items.some(option => option.id === selected.id))
                    const option = group?.items.find(option => option.id === selected.id)
                    if (!group || !option || option.soldOut || seen.has(group.id)) throw new Error('Invalid option')
                    seen.add(group.id)
                    return option
                })
                return { item, amount: selection.amount, options }
            })
            const itemMap = new Map(catalog.map(item => [item.id, item]))
            const validation = buildCartValidation(canonicalItems, itemMap)
            if (validation.issues.length || validation.countedAmount > getRemainingLimitForAvailability(availability)) throw new Error('Unavailable items')
            const linePrices = canonicalItems.map(item => calculatePrice(item).toDecimalPlaces(2, Decimal.ROUND_HALF_UP))
            if (linePrices.some(price => !price.isFinite() || price.lt(0))) throw new Error('Invalid price')
            const totalPriceRaw = linePrices.reduce((sum, price) => sum.add(price), new Decimal(0))
            let totalPrice = totalPriceRaw
            if (normalizedCoupon) {
                const code = await tx.couponCode.findUnique({ where: { id: normalizedCoupon } })
                const discount = code && money(code.value)
                if (!code || !discount || code.remainingUses < 1) throw new Error('Invalid coupon')
                const claimed = await tx.couponCode.updateMany({
                    where: { id: code.id, remainingUses: { gt: 0 } }, data: { remainingUses: { decrement: 1 } }
                })
                if (claimed.count !== 1) throw new Error('Coupon exhausted')
                totalPrice = Decimal.max(0, totalPrice.minus(discount))
            }
            const owner = user && !onSiteOrderMode ? await tx.user.findUnique({ where: { id: user.id, blocked: false } }) : null
            if (user && !onSiteOrderMode && !owner) throw new Error('Unauthorized')
            if (paymentMethod === PaymentMethod.payLater) {
                if (!owner || !await getConfigValueAsBoolean('allow-pay-later') || await tx.order.count({ where: { userId: owner.id, paymentStatus: PaymentStatus.notPaid } })) throw new Error('Deferred payment unavailable')
            }
            if (paymentMethod === PaymentMethod.balance && (!owner || Decimal(owner.balance).lt(totalPrice))) throw new Error('Insufficient balance')
            for (const [id, requested] of getRequestedItemAmounts(canonicalItems)) {
                const item = itemMap.get(id)!
                if (item.inventoryTrackingEnabled) {
                    const updated = await tx.itemType.updateMany({
                        where: { id, remainingItems: { gte: requested }, inventoryTrackingEnabled: true },
                        data: { remainingItems: { decrement: requested } }
                    })
                    if (updated.count !== 1) throw new Error('Inventory conflict')
                }
            }
            const paid = totalPrice.eq(0) || paymentMethod === PaymentMethod.cash || paymentMethod === PaymentMethod.balance
            const order = await tx.order.create({
                include: { items: { include: { itemType: true, appliedOptions: true } }, user: true },
                data: {
                    items: { create: canonicalItems.map((item, index) => ({
                        itemTypeId: item.item.id, appliedOptions: { connect: item.options.map(option => ({ id: option.id })) },
                        amount: item.amount, countsTowardLimit: countsTowardLimit(item.item), price: linePrices[index].toFixed(2)
                    })) },
                    totalPrice: totalPrice.toFixed(2), totalPriceRaw: totalPriceRaw.toFixed(2), status: OrderStatus.waiting,
                    type: deliveryRoom == null ? OrderType.pickUp : OrderType.delivery,
                    pickUpTime: deliveryRoom == null ? pickUpTime : null, deliveryRoom,
                    userId: owner?.id, paymentStatus: paid ? PaymentStatus.paid : PaymentStatus.notPaid, paymentMethod
                }
            })
            await tx.userAuditLog.create({ data: { type: UserAuditLogType.orderCreated, userId: user?.id, orderId: order.id } })
            if (normalizedCoupon) await tx.userAuditLog.create({ data: {
                type: UserAuditLogType.couponUsed, userId: user?.id, orderId: order.id, values: [normalizedCoupon]
            } })
            if (owner && paid) {
                const points = Decimal(owner.points).add(totalPriceRaw).toString()
                const balance = paymentMethod === PaymentMethod.balance ? Decimal(owner.balance).minus(totalPrice).toFixed(2) : owner.balance
                await tx.user.update({ where: { id: owner.id }, data: { points, balance } })
                await tx.userAuditLog.create({ data: {
                    type: UserAuditLogType.pointsUpdated, userId: owner.id, orderId: order.id, values: [totalPriceRaw.toFixed(2), points]
                } })
                if (paymentMethod === PaymentMethod.balance) await tx.userAuditLog.create({ data: {
                    type: UserAuditLogType.balanceUsed, userId: owner.id, orderId: order.id, values: [totalPrice.toFixed(2), balance]
                } })
            }
            if (paid) await tx.userAuditLog.create({ data: {
                type: UserAuditLogType.orderPaymentSuccess, userId: owner?.id, orderId: order.id, values: [paymentMethod, totalPrice.toFixed(2)]
            } })
            return order
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
        if (order.userId == null) await grantGuestOrder(order.id)
        return order
    } catch { return null }
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
    if (!positiveId(id)) return []
    const order = await prisma.order.findUnique({
        where: { id }, include: { items: { include: { itemType: true, appliedOptions: true } } }
    })
    if (!order || !await canAccessOrder(order) || order.paymentStatus !== PaymentStatus.notPaid) return []
    try {
        await prisma.$transaction(async tx => {
            const removed = await tx.order.deleteMany({ where: { id, paymentStatus: PaymentStatus.notPaid } })
            if (removed.count !== 1) throw new Error('Order already paid or cancelled')
            for (const item of order.items) {
                if (item.itemType.inventoryTrackingEnabled) await tx.itemType.update({
                    where: { id: item.itemTypeId }, data: { remainingItems: { increment: item.amount } }
                })
            }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
        return order.items.map(item => ({ item: item.itemType, amount: item.amount, options: item.appliedOptions }))
    } catch { return [] }
}
