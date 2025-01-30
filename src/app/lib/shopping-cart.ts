'use client'

import { ItemType, OptionItem } from '@prisma/client'
import Decimal from 'decimal.js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getOrder, HydratedOrder } from '@/app/lib/ordering-actions'

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
    getAmount: () => number
    clear: () => void
    getTotalPrice: () => Decimal
}

export interface StoredOrderState {
    order: number | null
    setOrder: (order: number | null) => void
    getIfValid: () => Promise<HydratedOrder | null>
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
            getAmount: () => get().items.reduce((acc, item) => acc + item.amount, 0),
            clear: () => set({ items: [] }),
            getTotalPrice: () => get().items.reduce((acc, item) => acc.add(calculatePrice(item)), new Decimal(0))
        }),
        {
            name: 'shopping-cart-storage',
            storage: createJSONStorage(() => sessionStorage)
        }
    )
)

export const useStoredOrder = create<StoredOrderState>()(
    persist(
        (set, get) => ({
            order: null,
            setOrder: (order: number | null) => set({ order }),
            getIfValid: async () => {
                const toFind = get().order
                if (toFind == null) {
                    return null
                }
                const o = await getOrder(toFind)
                if (o == null) {
                    get().setOrder(null)
                    return null
                }
                if (new Date().getTime() - new Date(o.createdAt).getTime() > 10 * 60 * 60 * 1000) {
                    get().setOrder(null)
                    return null
                }
                return o
            }
        }),
        {
            name: 'order-local-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
)
