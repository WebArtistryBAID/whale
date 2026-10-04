import { describe, expect, it } from 'vitest'
import { createOrderSchema } from '@/app/lib/validation'
import { isValidConfigValue } from '@/app/lib/settings-schema'
import { consumeRateLimit, resetRateLimits } from '@/app/lib/rate-limit'

const validOrder = {
    items: [ { item: { id: 1, basePrice: '0.01' }, amount: 1, options: [ { id: 1 }, null ] } ],
    coupon: null,
    onSiteOrderMode: false,
    deliveryRoom: null,
    paymentMethod: 'wxPay',
    pickUpTime: 'midday'
}

describe('createOrderSchema', () => {
    it('accepts a valid order and strips client-supplied prices', () => {
        const parsed = createOrderSchema.parse(validOrder)
        expect(parsed.items[0].item).toEqual({ id: 1 })
        expect(parsed.items[0].options).toEqual([ { id: 1 } ])
    })

    it.each([ 0, -1, 1.5, 1000 ])('rejects amount %s', amount => {
        expect(createOrderSchema.safeParse({ ...validOrder, items: [ { ...validOrder.items[0], amount } ] }).success).toBe(false)
    })

    it('rejects unknown payment methods, pick-up times and empty carts', () => {
        expect(createOrderSchema.safeParse({ ...validOrder, paymentMethod: 'free' }).success).toBe(false)
        expect(createOrderSchema.safeParse({ ...validOrder, pickUpTime: 'midnight' }).success).toBe(false)
        expect(createOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false)
    })

    it('requires delivery rooms of at least 3 characters', () => {
        expect(createOrderSchema.safeParse({ ...validOrder, deliveryRoom: 'A1' }).success).toBe(false)
        expect(createOrderSchema.safeParse({ ...validOrder, deliveryRoom: 'A101' }).success).toBe(true)
    })
})

describe('isValidConfigValue', () => {
    it('validates by type', () => {
        expect(isValidConfigValue('open-time', '09:30')).toBe(true)
        expect(isValidConfigValue('open-time', '9:3')).toBe(false)
        expect(isValidConfigValue('store-open', 'yes')).toBe(false)
        expect(isValidConfigValue('maximum-balance', '500.00')).toBe(true)
        expect(isValidConfigValue('maximum-cups-per-day', '-1')).toBe(false)
        expect(isValidConfigValue('unknown-key', 'true')).toBe(false)
    })
})

describe('consumeRateLimit', () => {
    it('blocks after the limit within a window and resets afterwards', () => {
        resetRateLimits()
        expect(consumeRateLimit('k', 2, 1000, 0)).toBe(true)
        expect(consumeRateLimit('k', 2, 1000, 10)).toBe(true)
        expect(consumeRateLimit('k', 2, 1000, 20)).toBe(false)
        expect(consumeRateLimit('k', 2, 1000, 1001)).toBe(true)
    })
})
