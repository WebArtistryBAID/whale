import { describe, expect, it } from 'vitest'
import {
    calculateLinePrice,
    getStripeChargedAmountMinorUnit,
    isValidBasePrice,
    isValidPriceChange,
    isValidSalePercent,
    parseMoneyAmount
} from '@/app/lib/pricing'

describe('calculateLinePrice', () => {
    it('adds option price changes, applies the sale and multiplies by amount', () => {
        expect(calculateLinePrice('15', '1', [ '0', '3' ], 2).toString()).toBe('36')
        expect(calculateLinePrice('18', '0.8', [], 1).toString()).toBe('14.4')
    })

    it('rounds each cup to cents before multiplying', () => {
        expect(calculateLinePrice('19.9', '0.85', [], 1).toString()).toBe('16.92')
        expect(calculateLinePrice('19.9', '0.85', [ '4' ], 2).toString()).toBe('40.64')
        expect(calculateLinePrice('10', '0.333', [], 3).toString()).toBe('9.99')
    })

    it('never produces a negative unit price', () => {
        expect(calculateLinePrice('5', '1', [ '-10' ], 3).toString()).toBe('0')
    })
})

describe('parseMoneyAmount', () => {
    it('accepts plain amounts with up to two decimals', () => {
        expect(parseMoneyAmount('20')?.toString()).toBe('20')
        expect(parseMoneyAmount(' 20.5 ')?.toString()).toBe('20.5')
        expect(parseMoneyAmount('0.01')?.toString()).toBe('0.01')
    })

    it.each([ 'NaN', 'Infinity', '-5', '1e3', '10.123', '', 'abc', '0x10', '1,000' ])('rejects %s', value => {
        expect(parseMoneyAmount(value)).toBeNull()
    })
})

describe('getStripeChargedAmountMinorUnit', () => {
    it('adds the 3.5% fee and rounds down to cents', () => {
        expect(getStripeChargedAmountMinorUnit('15')).toBe(1552)
        expect(getStripeChargedAmountMinorUnit('100')).toBe(10350)
    })
})

describe('price validators', () => {
    it.each([ '0', '12', '19.9', '0.01' ])('accepts base price %s', value => {
        expect(isValidBasePrice(value)).toBe(true)
    })

    it.each([ '-5', '12.345', '18abc', '', 'NaN' ])('rejects base price %s', value => {
        expect(isValidBasePrice(value)).toBe(false)
    })

    it.each([ '1', '0.8', '0.85', '0.3333', '1.0' ])('accepts sale multiplier %s', value => {
        expect(isValidSalePercent(value)).toBe(true)
    })

    it.each([ '0', '-1', '1.5', '2', '0.12345', 'abc', '' ])('rejects sale multiplier %s', value => {
        expect(isValidSalePercent(value)).toBe(false)
    })

    it.each([ '0', '4', '-2', '1.5', '-0.5' ])('accepts price change %s', value => {
        expect(isValidPriceChange(value)).toBe(true)
    })

    it.each([ '4abc', '1.234', '', '--1', '1e2' ])('rejects price change %s', value => {
        expect(isValidPriceChange(value)).toBe(false)
    })
})
