import Decimal from 'decimal.js'

const STRIPE_PROCESSING_FEE_MULTIPLIER = Decimal(1.035)
const CNY_MINOR_UNIT_FACTOR = Decimal(100)

/**
 * Price of one cup: base price plus option price changes, times the sale multiplier, rounded to cents.
 * Rounding here keeps every amount we display, charge and store payable (WeChat Pay and Stripe only take cents).
 */
export function calculateUnitPrice(basePrice: Decimal.Value,
                                   salePercent: Decimal.Value,
                                   optionPriceChanges: Decimal.Value[]): Decimal {
    let unitPrice = Decimal(basePrice)
    for (const change of optionPriceChanges) {
        unitPrice = unitPrice.add(Decimal(change))
    }
    return Decimal.max(0, unitPrice.mul(Decimal(salePercent))).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

/**
 * Price of a single cart line. Shared by the shopping cart (display only) and the server (authoritative).
 * The server must always pass values loaded from the database, never values supplied by the client.
 */
export function calculateLinePrice(basePrice: Decimal.Value,
                                   salePercent: Decimal.Value,
                                   optionPriceChanges: Decimal.Value[],
                                   amount: number): Decimal {
    return calculateUnitPrice(basePrice, salePercent, optionPriceChanges).mul(amount)
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

/** A product's base price: a non-negative amount with at most two decimals. */
export function isValidBasePrice(value: string): boolean {
    return parseMoneyAmount(value) != null
}

/** A sale multiplier such as 0.8 (20% off): greater than 0 and at most 1, with at most four decimals. */
export function isValidSalePercent(value: string): boolean {
    if (typeof value !== 'string' || !/^\d(\.\d{1,4})?$/.test(value.trim())) {
        return false
    }
    const parsed = Decimal(value.trim())
    return parsed.gt(0) && parsed.lte(1)
}

/** An option's price change, which may be negative: at most two decimals. */
export function isValidPriceChange(value: string): boolean {
    return typeof value === 'string' && /^-?\d{1,5}(\.\d{1,2})?$/.test(value.trim())
}
