'use client'

import { ItemType, OptionItem } from '@prisma/client'
import Decimal from 'decimal.js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface OrderedItemTemplate {
    item: ItemType
    amount: number
    options: OptionItem[]
}

export interface ShoppingCartState {
    items: OrderedItemTemplate[]
    onSiteOrderMode: boolean
    setOnSiteOrderMode: (mode: boolean) => void
    addItem: (item: OrderedItemTemplate) => void
    removeItem: (index: number) => void
    clear: () => void
    getTotalPrice: () => Decimal
}

export function calculatePrice(item: OrderedItemTemplate): Decimal {
    let price = Decimal(item.item.basePrice)
    for (const option of item.options) {
        if (option == null) {
            continue
        }
        price = price.add(Decimal(option.priceChange))
    }
    price = price.mul(Decimal(item.item.salePercent))
    return price.mul(item.amount)
}

export const useShoppingCart = create<ShoppingCartState>()(
    persist(
        (set, get) => ({
            items: [] as OrderedItemTemplate[],
            onSiteOrderMode: false,
            setOnSiteOrderMode: (mode: boolean) => set({ onSiteOrderMode: mode }),
            addItem: (item: OrderedItemTemplate) => set(state => ({ items: [ ...state.items, item ] })),
            removeItem: (index: number) => set(state => ({ items: state.items.filter((_, i) => i !== index) })),
            clear: () => set({ items: [] }),
            getTotalPrice: () => get().items.reduce((acc, item) => acc.add(calculatePrice(item)), new Decimal(0))
        }),
        {
            name: 'shopping-cart-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => sessionStorage) // use sessionStorage
        }
    )
)
