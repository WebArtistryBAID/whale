import Decimal from 'decimal.js'

const STRIPE_PROCESSING_FEE_MULTIPLIER = Decimal(1.035)
const CNY_MINOR_UNIT_FACTOR = Decimal(100)

export function getStripeChargedTotal(amount: Decimal.Value): Decimal {
    return Decimal(amount).mul(STRIPE_PROCESSING_FEE_MULTIPLIER).mul(CNY_MINOR_UNIT_FACTOR).floor().div(CNY_MINOR_UNIT_FACTOR)
}

export function getStripeFeeAmount(amount: Decimal.Value): Decimal {
    return getStripeChargedTotal(amount).minus(amount)
}

export function getStripeChargedAmountMinorUnit(amount: Decimal.Value): number {
    return getStripeChargedTotal(amount).mul(CNY_MINOR_UNIT_FACTOR).toNumber()
}
