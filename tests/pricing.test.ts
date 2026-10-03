import { describe, expect, it } from 'vitest'
import { calculateLinePrice, getStripeChargedAmountMinorUnit, parseMoneyAmount } from '@/app/lib/pricing'

describe('calculateLinePrice', () => {
    it('adds option price changes, applies the sale and multiplies by amount', () => {
        expect(calculateLinePrice('15', '1', [ '0', '3' ], 2).toString()).toBe('36')
        expect(calculateLinePrice('18', '0.8', [], 1).toString()).toBe('14.4')
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
