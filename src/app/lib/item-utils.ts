import {ItemType, OptionItem} from '@prisma/client'
import Decimal from 'decimal.js'

export function calculatePrice(item: ItemType, quantity: number, options: OptionItem[]): Decimal {
    let price = Decimal(item.basePrice)
    for (const option of options) {
        if (option == null) {
            continue
        }
        price = price.add(Decimal(option.priceChange))
    }
    price = price.mul(Decimal(item.salePercent))
    return price.mul(quantity)
}
