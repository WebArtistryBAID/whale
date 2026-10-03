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
import type { OrderedItemTemplate } from '@/app/lib/shopping-cart'
import { getMyUser } from '@/app/login/login-actions'
import { normalizeCouponCode } from '@/app/lib/coupon-codes'
import Decimal from 'decimal.js'
import { getConfigValueAsBoolean, getConfigValueAsNumber, getConfigValues } from '@/app/lib/settings-actions'
import { prisma } from '@/app/lib/prisma'
import { countsTowardLimit, getAvailableInventory, isItemSoldOut } from '@/app/lib/item-availability'
import { DEFAULT_PICK_UP_TIME, PickUpTimeOption } from '@/app/lib/pick-up-times'
import {
    assignOrderBucket,
    CartValidationIssue,
    CartValidationResponse,
    DailyCupLimitSummary,
    dateAtMinutes,
    endOfDay,
    findNextBusinessDay,
    formatDateKey,
    getBusinessDayWindows,
    getOverrideValueForDate,
    getPreOrderTargetDay,
    isBusinessDay,
    isLiveWindow,
    OrderingAvailabilityResponse,
    OrderingConfiguration,
    OrderingPhase,
    parseOrderingConfiguration,
    startOfDay
} from '@/app/lib/ordering-schedule'
import { calculateLinePrice } from '@/app/lib/pricing'
import { adjustUserBalance, adjustUserPoints, lockUserRow } from '@/app/lib/user-balance'
import { canAccessOrder, rememberGuestOrder } from '@/app/lib/order-access'
import { findHydratedOrder, hydratedOrderInclude } from '@/app/lib/order-queries'
import { expireStripeSession, releaseAndDeleteUnpaidOrder } from '@/app/lib/order-lifecycle'
import { cartSchema, createOrderSchema, idSchema, paymentMethodSchema, pickUpTimeSchema } from '@/app/lib/validation'
import { checkRateLimit } from '@/app/lib/rate-limit'

export type {
    CartValidationIssue,
    CartValidationResponse,
    DailyCupLimitSummary,
    OrderingAvailabilityResponse
} from '@/app/lib/ordering-schedule'

export type OrderUser = Pick<User, 'id' | 'name' | 'pinyin'>

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
    user: OrderUser | null
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

async function getOrderingConfiguration(): Promise<OrderingConfiguration> {
    return parseOrderingConfiguration(await getConfigValues())
}

type OrderableItemRecord = Pick<ItemType, 'id' | 'name' | 'soldOut' | 'countsTowardLimit' | 'inventoryTrackingEnabled' | 'remainingItems'>
type TransactionClient = Prisma.TransactionClient
type CartItemLike = { item: { id: number }, amount: number }

function getRequestedItemAmounts(items: CartItemLike[]): Map<number, number> {
    const requestedAmounts = new Map<number, number>()
    for (const item of items) {
        requestedAmounts.set(item.item.id, (requestedAmounts.get(item.item.id) ?? 0) + item.amount)
    }
    return requestedAmounts
}

function getCurrentCountedAmount(items: CartItemLike[], itemMap: Map<number, OrderableItemRecord>): number {
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

function buildCartValidation(items: CartItemLike[], itemMap: Map<number, OrderableItemRecord>): CartValidationResponse {
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


/**
 * Changes the payment method or pick-up time of the current user's unpaid order before paying for it.
 */
export async function setOrderCheckoutOptions(id: number, paymentMethod: PaymentMethod, pickUpTime: PickUpTimeOption | null): Promise<boolean> {
    const parsedId = idSchema.safeParse(id)
    const parsedMethod = paymentMethodSchema.safeParse(paymentMethod)
    const parsedPickUpTime = pickUpTimeSchema.nullable().safeParse(pickUpTime)
    if (!parsedId.success || !parsedMethod.success || !parsedPickUpTime.success) {
        return false
    }
    // Only online payment methods can be selected here. Cash and Pay Later have their own rules in createOrder.
    const selectable: PaymentMethod[] = [ PaymentMethod.wxPay, PaymentMethod.stripe, PaymentMethod.balance, PaymentMethod.payForMe ]
    if (!selectable.includes(parsedMethod.data)) {
        return false
    }
    const order = await prisma.order.findUnique({
        where: {
            id: parsedId.data,
            paymentStatus: PaymentStatus.notPaid
        }
    })
    if (order == null || !await canAccessOrder(order, await getMyUser())) {
        return false
    }
    // Pay Later orders are already in the queue; keep them as Pay Later until a payment actually succeeds,
    // otherwise they would disappear from the queue and be pruned.
    if (order.paymentMethod === PaymentMethod.payLater) {
        return true
    }
    await prisma.order.updateMany({
        where: {
            id: order.id,
            paymentStatus: PaymentStatus.notPaid
        },
        data: {
            paymentMethod: parsedMethod.data,
            pickUpTime: order.type === OrderType.pickUp ? (parsedPickUpTime.data ?? DEFAULT_PICK_UP_TIME) : null
        }
    })
    return true
}

export async function couponQuickValidate(code: string): Promise<Pick<CouponCode, 'id' | 'value'> | null> {
    if (typeof code !== 'string') {
        return null
    }
    const normalizedCode = normalizeCouponCode(code)
    if (normalizedCode.length < 1 || normalizedCode.length > 64) {
        return null
    }
    const me = await getMyUser()
    if (!await checkRateLimit('coupon', me == null ? 300 : 60, 10 * 60 * 1000, me?.id)) {
        return null
    }
    return prisma.couponCode.findUnique({
        where: {
            id: normalizedCode,
            remainingUses: {
                gt: 0
            }
        },
        select: {
            id: true,
            value: true
        }
    })
}

export async function validateCartItems(items: OrderedItemTemplate[]): Promise<CartValidationResponse> {
    const parsed = cartSchema.safeParse(items)
    if (!parsed.success) {
        return {
            countedAmount: 0,
            issues: []
        }
    }
    const itemIds = Array.from(new Set(parsed.data.map(item => item.item.id)))
    if (itemIds.length < 1) {
        return {
            countedAmount: 0,
            issues: []
        }
    }

    const itemMap = await getOrderableItems(itemIds)
    return buildCartValidation(parsed.data, itemMap)
}

/**
 * Returns an order if the current visitor is allowed to see it (its owner, the browser that placed it as a guest,
 * or an administrator).
 */
export async function getOrder(id: number): Promise<HydratedOrder | null> {
    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
        return null
    }
    const order = await findHydratedOrder(parsedId.data)
    if (order == null || !await canAccessOrder(order, await getMyUser())) {
        return null
    }
    return order
}

export async function canPayWithBalance(totalPrice: string): Promise<boolean> {
    const me = await getMyUser()
    if (me == null || me.blocked) {
        return false
    }
    try {
        return Decimal(me.balance).gte(totalPrice)
    } catch {
        return false
    }
}

export async function canPayWithPayLater(): Promise<boolean> {
    const me = await getMyUser()
    if (me == null || me.blocked) {
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
    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
        return false
    }
    const me = await getMyUser()
    if (me == null || me.blocked) {
        return false
    }
    const order = await prisma.order.findUnique({
        where: {
            id: parsedId.data
        }
    })
    if (order == null || !await canAccessOrder(order, me)) {
        return false
    }
    if (order.paymentStatus === PaymentStatus.paid) {
        return true
    }
    if (order.paymentStatus !== PaymentStatus.notPaid) {
        return false
    }

    try {
        await prisma.$transaction(async tx => {
            // Claim the order first, so it can only ever be paid once
            const claimed = await tx.order.updateMany({
                where: {
                    id: order.id,
                    paymentStatus: PaymentStatus.notPaid
                },
                data: {
                    paymentStatus: PaymentStatus.paid,
                    paymentMethod: PaymentMethod.balance
                }
            })
            if (claimed.count !== 1) {
                throw new Error('already-paid')
            }
            const newBalance = await adjustUserBalance(tx, me.id, Decimal(order.totalPrice).negated())
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.balanceUsed,
                    userId: me.id,
                    orderId: order.id,
                    values: [ order.totalPrice, newBalance.toString() ]
                }
            })
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.orderPaymentSuccess,
                    userId: me.id,
                    orderId: order.id,
                    values: [ 'balance', order.totalPrice ]
                }
            })
            const newPoints = await adjustUserPoints(tx, me.id, order.totalPriceRaw)
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.pointsUpdated,
                    userId: me.id,
                    orderId: order.id,
                    values: [ order.totalPriceRaw, newPoints.toString() ]
                }
            })
        })
    } catch {
        return false
    }
    await expireStripeSession(order.stripeSession)
    return true
}

export async function isStoreOpen(): Promise<boolean> {
    return (await getOrderingAvailability()).isStoreOpen
}

export async function isMaximumCupsReached(): Promise<boolean> {
    const availability = await getOrderingAvailability()
    return !availability.canOrderNow && availability.unavailableReason !== 'store-closed'
}

interface PricedLine {
    itemTypeId: number
    amount: number
    optionIds: number[]
    price: Decimal
}

/**
 * Loads the items and options of a cart from the database and prices every line.
 * Prices supplied by the client are ignored. Returns null if the cart refers to unknown, unavailable,
 * or mismatched items and options.
 */
async function priceCart(items: { item: { id: number }, amount: number, options: { id: number }[] }[]): Promise<PricedLine[] | null> {
    const itemIds = Array.from(new Set(items.map(item => item.item.id)))
    const itemTypes = await prisma.itemType.findMany({
        where: {
            id: {
                in: itemIds
            }
        },
        include: {
            options: {
                include: {
                    items: true
                }
            }
        }
    })
    const itemTypeMap = new Map(itemTypes.map(itemType => [ itemType.id, itemType ]))

    const lines: PricedLine[] = []
    for (const item of items) {
        const itemType = itemTypeMap.get(item.item.id)
        if (itemType == null) {
            return null
        }
        const chosenByType = new Map<number, OptionItem>()
        for (const { id } of item.options) {
            const optionType = itemType.options.find(type => type.items.some(option => option.id === id))
            const option = optionType?.items.find(option => option.id === id)
            if (optionType == null || option == null || option.soldOut || chosenByType.has(optionType.id)) {
                // Option does not belong to this item, is sold out, or two options of the same type were chosen
                return null
            }
            chosenByType.set(optionType.id, option)
        }
        // Fill in the default option for any option type the client did not choose
        for (const optionType of itemType.options) {
            if (chosenByType.has(optionType.id)) {
                continue
            }
            const fallback = optionType.items.find(option => option.default && !option.soldOut)
            if (fallback != null) {
                chosenByType.set(optionType.id, fallback)
            }
        }
        const chosen = Array.from(chosenByType.values())
        lines.push({
            itemTypeId: itemType.id,
            amount: item.amount,
            optionIds: chosen.map(option => option.id),
            price: calculateLinePrice(itemType.basePrice, itemType.salePercent, chosen.map(option => option.priceChange), item.amount)
        })
    }
    return lines
}

export async function createOrder(items: OrderedItemTemplate[],
                                  coupon: string | null,
                                  onSiteOrderMode: boolean,
                                  deliveryRoom: string | null,
                                  paymentMethod: PaymentMethod,
                                  pickUpTime: PickUpTimeOption | null): Promise<HydratedOrder | null> {
    const parsed = createOrderSchema.safeParse({
        items,
        coupon,
        onSiteOrderMode,
        deliveryRoom,
        paymentMethod,
        pickUpTime
    })
    if (!parsed.success) {
        return null
    }
    const input = parsed.data
    const me = await getMyUser()
    const normalizedCoupon = input.coupon == null ? null : normalizeCouponCode(input.coupon)
    const hasCoupon = normalizedCoupon != null && normalizedCoupon.length > 0

    if (me != null && me.blocked) {
        return null
    }

    if (!await checkRateLimit('create-order', me == null ? 200 : 20, 10 * 60 * 1000, me?.id)) {
        return null
    }

    // On site order mode require administrative permissions
    if (input.onSiteOrderMode && (me == null || !me.permissions.includes('admin.manage'))) {
        return null
    }

    // Ensure we didn't go over maximum cups per order
    const totalAmount = input.items.reduce((acc, item) => acc + item.amount, 0)
    if (totalAmount < 1 || totalAmount > await getConfigValueAsNumber('maximum-cups-per-order')) {
        return null
    }

    if (input.deliveryRoom != null && !(await getConfigValueAsBoolean('allow-delivery'))) {
        return null
    }

    if (input.paymentMethod === PaymentMethod.payLater && !(await getConfigValueAsBoolean('allow-pay-later'))) {
        return null
    }


    // Exactly one of pick-up time and delivery room
    if ((input.deliveryRoom == null) === (input.pickUpTime == null)) {
        return null
    }

    // Cash payment is only available with on-site
    if (input.paymentMethod === PaymentMethod.cash && !input.onSiteOrderMode) {
        return null
    }

    // Pay later, balance, and pay for me aren't available with on-site
    if ((input.paymentMethod === PaymentMethod.payLater || input.paymentMethod === PaymentMethod.balance || input.paymentMethod === PaymentMethod.payForMe) && input.onSiteOrderMode) {
        return null
    }

    // Pay later and balance require logging in
    if ((input.paymentMethod === PaymentMethod.payLater || input.paymentMethod === PaymentMethod.balance) && me == null) {
        return null
    }

    // No using pay later if you have unpaid orders before (checked again inside the transaction)
    if (input.paymentMethod === PaymentMethod.payLater && me != null && await prisma.order.count({
        where: {
            userId: me.id,
            paymentStatus: PaymentStatus.notPaid
        }
    }) > 0) {
        return null
    }

    const availability = await getOrderingAvailability()
    if (availability.unavailableReason === 'store-closed') {
        return null
    }

    const itemIds = Array.from(new Set(input.items.map(item => item.item.id)))
    const itemMap = await getOrderableItems(itemIds)
    const cartValidation = buildCartValidation(input.items, itemMap)
    if (cartValidation.issues.length > 0) {
        return null
    }
    if (cartValidation.countedAmount > getRemainingLimitForAvailability(availability)) {
        return null
    }

    // Calculate prices from the database
    const lines = await priceCart(input.items)
    if (lines == null) {
        return null
    }
    const totalPriceNoCoupon = lines.reduce((acc, line) => acc.add(line.price), new Decimal(0))
    if (totalPriceNoCoupon.isNegative()) {
        return null
    }

    let usedCoupon = false
    let order: HydratedOrder | null = null
    try {
        order = await prisma.$transaction(async tx => {
            if (input.paymentMethod === PaymentMethod.payLater && me != null) {
                // Serialize Pay Later orders per user so two concurrent requests cannot both pass the check
                await lockUserRow(tx, me.id)
                if (await tx.order.count({
                    where: {
                        userId: me.id,
                        paymentStatus: PaymentStatus.notPaid
                    }
                }) > 0) {
                    throw new Error('unpaid-orders')
                }
            }

            const currentItemMap = await getOrderableItems(itemIds, tx)
            const currentValidation = buildCartValidation(input.items, currentItemMap)
            if (currentValidation.issues.length > 0) {
                throw new Error('inventory-conflict')
            }

            const requestedAmounts = getRequestedItemAmounts(input.items)
            for (const [ itemTypeId, requested ] of requestedAmounts.entries()) {
                const currentItem = currentItemMap.get(itemTypeId)
                if (currentItem == null) {
                    throw new Error('missing-item')
                }
                if (!currentItem.inventoryTrackingEnabled) {
                    continue
                }
                const updated = await tx.itemType.updateMany({
                    where: {
                        id: itemTypeId,
                        inventoryTrackingEnabled: true,
                        remainingItems: {
                            gte: requested
                        }
                    },
                    data: {
                        remainingItems: {
                            decrement: requested
                        }
                    }
                })
                if (updated.count !== 1) {
                    throw new Error('inventory-conflict')
                }
            }

            let totalPrice = totalPriceNoCoupon
            if (hasCoupon) {
                // Decrement only if uses remain, so concurrent orders cannot overuse a coupon
                const claimed = await tx.couponCode.updateMany({
                    where: {
                        id: normalizedCoupon,
                        remainingUses: {
                            gt: 0
                        }
                    },
                    data: {
                        remainingUses: {
                            decrement: 1
                        }
                    }
                })
                if (claimed.count !== 1) {
                    throw new Error('coupon-invalid')
                }
                const couponCode = await tx.couponCode.findUniqueOrThrow({
                    where: { id: normalizedCoupon }
                })
                totalPrice = totalPrice.minus(Decimal.min(totalPrice, Decimal.max(0, Decimal(couponCode.value))))
                usedCoupon = true
            }

            const isPaid = totalPrice.eq(0) || input.paymentMethod === PaymentMethod.cash || input.paymentMethod === PaymentMethod.balance
            const created = await tx.order.create({
                include: hydratedOrderInclude,
                data: {
                    items: {
                        create: lines.map(line => ({
                            itemType: {
                                connect: {
                                    id: line.itemTypeId
                                }
                            },
                            appliedOptions: {
                                connect: line.optionIds.map(id => ({ id }))
                            },
                            amount: line.amount,
                            countsTowardLimit: countsTowardLimit(currentItemMap.get(line.itemTypeId)!),
                            price: line.price.toString()
                        }))
                    },
                    totalPrice: totalPrice.toString(),
                    totalPriceRaw: totalPriceNoCoupon.toString(),
                    status: OrderStatus.waiting,
                    type: input.deliveryRoom == null ? OrderType.pickUp : OrderType.delivery,
                    pickUpTime: input.deliveryRoom == null ? input.pickUpTime : null,
                    deliveryRoom: input.deliveryRoom,
                    user: (input.onSiteOrderMode || me == null) ? undefined : {
                        connect: {
                            id: me.id
                        }
                    },
                    paymentStatus: isPaid ? PaymentStatus.paid : PaymentStatus.notPaid,
                    paymentMethod: input.paymentMethod
                }
            })

            const userId = (input.onSiteOrderMode || me == null) ? null : me.id
            await tx.userAuditLog.create({
                data: {
                    type: UserAuditLogType.orderCreated,
                    userId: me?.id ?? null,
                    orderId: created.id
                }
            })
            if (usedCoupon) {
                await tx.userAuditLog.create({
                    data: {
                        type: UserAuditLogType.couponUsed,
                        userId: me?.id ?? null,
                        orderId: created.id,
                        values: [ normalizedCoupon! ]
                    }
                })
            }

            if (input.paymentMethod === PaymentMethod.balance && userId != null && totalPrice.greaterThan(0)) {
                const newBalance = await adjustUserBalance(tx, userId, totalPrice.negated())
                await tx.userAuditLog.create({
                    data: {
                        type: UserAuditLogType.balanceUsed,
                        userId,
                        orderId: created.id,
                        values: [ totalPrice.toString(), newBalance.toString() ]
                    }
                })
            }

            if (input.paymentMethod === PaymentMethod.cash || input.paymentMethod === PaymentMethod.balance) {
                await tx.userAuditLog.create({
                    data: {
                        type: UserAuditLogType.orderPaymentSuccess,
                        userId,
                        orderId: created.id,
                        values: [ input.paymentMethod, totalPrice.toString() ]
                    }
                })
            }

            // Add points to user
            if (userId != null && isPaid) {
                const newPoints = await adjustUserPoints(tx, userId, totalPriceNoCoupon)
                await tx.userAuditLog.create({
                    data: {
                        type: UserAuditLogType.pointsUpdated,
                        userId,
                        orderId: created.id,
                        values: [ totalPriceNoCoupon.toString(), newPoints.toString() ]
                    }
                })
            }

            return created
        })
    } catch {
        return null
    }

    if (order.userId == null) {
        await rememberGuestOrder(order.id)
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


/**
 * Cancels an unpaid order placed by the current visitor, returning its items so they can be put back in the cart.
 */
export async function cancelUnpaidOrder(id: number): Promise<OrderedItemTemplate[]> {
    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
        return []
    }
    const order = await findHydratedOrder(parsedId.data)
    if (order == null || order.paymentStatus !== PaymentStatus.notPaid || !await canAccessOrder(order, await getMyUser())) {
        return []
    }
    // Pay Later orders are already being prepared, so they cannot be cancelled by the customer
    if (order.paymentMethod === PaymentMethod.payLater) {
        return []
    }
    // Make sure the order can no longer be paid through Stripe before deleting it
    if (!await expireStripeSession(order.stripeSession)) {
        return []
    }

    const deleted = await prisma.$transaction(tx => releaseAndDeleteUnpaidOrder(tx, order.id))
    if (!deleted) {
        return []
    }

    return order.items.map(item => ({
        item: item.itemType,
        amount: item.amount,
        options: item.appliedOptions
    }))
}
