import { describe, expect, it } from 'vitest'
import {
    assignOrderBucket,
    formatDateKey,
    getOverrideValueForDate,
    getPreOrderTargetDay,
    isLiveWindow,
    parseOrderingConfiguration
} from '@/app/lib/ordering-schedule'

const config = parseOrderingConfiguration({
    'enable-scheduled-availability': 'true',
    'weekdays-only': 'true',
    'open-time': '10:00',
    'close-time': '15:00',
    'pre-order-start-time': '07:00',
    'maximum-cups-per-day': '14',
    'maximum-pre-order-cups-per-day': '6'
})

// 2026-10-05 is a Monday, 2026-10-03 a Saturday
const at = (date: string, time: string) => new Date(`${date}T${time}:00+08:00`)

describe('parseOrderingConfiguration', () => {
    it('parses times and limits', () => {
        expect(config.openTimeMinutes).toBe(600)
        expect(config.closeTimeMinutes).toBe(900)
        expect(config.preOrderStartTimeMinutes).toBe(420)
        expect(config.liveLimit).toBe(14)
        expect(config.preOrderLimit).toBe(6)
    })

    it('falls back to defaults for invalid times', () => {
        const c = parseOrderingConfiguration({ 'open-time': '25:99' })
        expect(c.openTimeMinutes).toBe(600)
    })
})

describe('availability windows', () => {
    it('is live between opening and closing on weekdays', () => {
        expect(isLiveWindow(at('2026-10-05', '11:00'), config)).toBe(true)
        expect(isLiveWindow(at('2026-10-05', '09:59'), config)).toBe(false)
        expect(isLiveWindow(at('2026-10-05', '15:01'), config)).toBe(false)
        expect(isLiveWindow(at('2026-10-03', '11:00'), config)).toBe(false)
    })

    it('treats the pre-order window as a pre-order for the same day', () => {
        expect(formatDateKey(getPreOrderTargetDay(at('2026-10-05', '08:00'), config)!)).toBe('2026-10-05')
        expect(getPreOrderTargetDay(at('2026-10-05', '06:59'), config)).toBeNull()
        expect(getPreOrderTargetDay(at('2026-10-05', '10:00'), config)).toBeNull()
    })

    it('spans the weekend when pre-ordering starts the day before', () => {
        const evening = parseOrderingConfiguration({ ...{ 'pre-order-start-time': '16:00' } })
        // Friday 17:00 pre-orders for Monday
        expect(formatDateKey(getPreOrderTargetDay(at('2026-10-02', '17:00'), evening)!)).toBe('2026-10-05')
        expect(formatDateKey(getPreOrderTargetDay(at('2026-10-04', '12:00'), evening)!)).toBe('2026-10-05')
    })

    it('assigns orders to buckets', () => {
        expect(assignOrderBucket(at('2026-10-05', '08:00'), config).bucket).toBe('preorder')
        expect(assignOrderBucket(at('2026-10-05', '11:00'), config).bucket).toBe('live')
    })

    it('reads availability overrides in both date formats', () => {
        expect(getOverrideValueForDate(at('2026-10-05', '12:00'), { ...config, availabilityOverrideDate: '2026-10-05', availabilityOverrideValue: true })).toBe(true)
        expect(getOverrideValueForDate(at('2026-10-05', '12:00'), { ...config, availabilityOverrideDate: '2026-10-5', availabilityOverrideValue: false })).toBe(false)
        expect(getOverrideValueForDate(at('2026-10-05', '12:00'), config)).toBeNull()
    })
})
