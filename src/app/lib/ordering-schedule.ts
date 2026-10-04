// Pure scheduling logic for store availability and pre-orders. No database access, so it can be unit tested.

export type OrderingPhase = 'live' | 'preorder' | 'closed'
export type OrderingUnavailableReason = 'none' | 'store-closed' | 'live-limit-reached' | 'preorder-limit-reached'
export type OrderLimitBucket = 'live' | 'preorder'

export interface OrderingConfiguration {
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

export interface OrderBucketAssignment {
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

export function startOfDay(date: Date): Date {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

export function endOfDay(date: Date): Date {
    return addDays(startOfDay(date), 1)
}

export function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function formatLegacyDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function parseTimeToMinutes(value: string | undefined, fallback: number): number {
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

export function dateAtMinutes(date: Date, minutes: number): Date {
    const result = startOfDay(date)
    result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    return result
}

export function isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day !== 0 && day !== 6
}

export function isBusinessDay(date: Date, config: OrderingConfiguration): boolean {
    return !config.weekdaysOnly || isWeekday(date)
}

export function findNextBusinessDay(date: Date, config: OrderingConfiguration, includeSelf: boolean): Date {
    let cursor = startOfDay(date)
    if (!includeSelf) {
        cursor = addDays(cursor, 1)
    }

    while (!isBusinessDay(cursor, config)) {
        cursor = addDays(cursor, 1)
    }

    return cursor
}

export function findPreviousBusinessDay(date: Date, config: OrderingConfiguration): Date {
    let cursor = addDays(startOfDay(date), -1)
    while (!isBusinessDay(cursor, config)) {
        cursor = addDays(cursor, -1)
    }
    return cursor
}

export function getOverrideValueForDate(date: Date, config: OrderingConfiguration): boolean | null {
    if (config.availabilityOverrideDate !== formatDateKey(date) &&
        config.availabilityOverrideDate !== formatLegacyDateKey(date)) {
        return null
    }

    return config.availabilityOverrideValue
}

export function isWithinRange(target: Date, start: Date, end: Date): boolean {
    return target.getTime() >= start.getTime() && target.getTime() < end.getTime()
}

export function getBusinessDayWindows(day: Date, config: OrderingConfiguration): {
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

export function getPreOrderTargetDay(now: Date, config: OrderingConfiguration): Date | null {
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

export function isLiveWindow(now: Date, config: OrderingConfiguration): boolean {
    const today = startOfDay(now)
    if (!isBusinessDay(today, config)) {
        return false
    }

    const todayWindows = getBusinessDayWindows(today, config)
    return now.getTime() >= todayWindows.openAt.getTime() && now.getTime() <= todayWindows.closeAt.getTime()
}

export function assignOrderBucket(createdAt: Date, config: OrderingConfiguration): OrderBucketAssignment {
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

export function parseOrderingConfiguration(values: { [key: string]: string | undefined }): OrderingConfiguration {

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

