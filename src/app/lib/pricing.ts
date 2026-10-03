import Decimal from 'decimal.js'

const STRIPE_PROCESSING_FEE_MULTIPLIER = Decimal(1.035)
const CNY_MINOR_UNIT_FACTOR = Decimal(100)

/**
 * Price of a single cart line. Shared by the shopping cart (display only) and the server (authoritative).
 * The server must always pass values loaded from the database, never values supplied by the client.
 */
export function calculateLinePrice(basePrice: Decimal.Value,
                                   salePercent: Decimal.Value,
                                   optionPriceChanges: Decimal.Value[],
                                   amount: number): Decimal {
    let unitPrice = Decimal(basePrice)
    for (const change of optionPriceChanges) {
        unitPrice = unitPrice.add(Decimal(change))
    }
    unitPrice = Decimal.max(0, unitPrice.mul(Decimal(salePercent)))
    return unitPrice.mul(amount)
}

export function getStripeChargedTotal(amount: Decimal.Value): Decimal {
    return Decimal(amount).mul(STRIPE_PROCESSING_FEE_MULTIPLIER).mul(CNY_MINOR_UNIT_FACTOR).floor().div(CNY_MINOR_UNIT_FACTOR)
}

export function getStripeFeeAmount(amount: Decimal.Value): Decimal {
    return getStripeChargedTotal(amount).minus(amount)
}

export function getStripeChargedAmountMinorUnit(amount: Decimal.Value): number {
    return getStripeChargedTotal(amount).mul(CNY_MINOR_UNIT_FACTOR).toNumber()
}

/**
 * Parses a money amount supplied by a user. Returns null unless it is a finite, non-negative number
 * with at most two decimal places.
 */
export function parseMoneyAmount(value: string): Decimal | null {
    if (typeof value !== 'string' || !/^\d{1,7}(\.\d{1,2})?$/.test(value.trim())) {
        return null
    }
    return Decimal(value.trim())
}
