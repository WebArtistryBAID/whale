'use client'

import { ItemType, OptionItem } from '@/generated/prisma/browser'
import Decimal from 'decimal.js'
import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getOrder, HydratedOrder } from '@/app/lib/ordering-actions'
import { calculateLinePrice } from '@/app/lib/pricing'

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
    return calculateLinePrice(item.item.basePrice, item.item.salePercent,
        item.options.filter(option => option != null).map(option => option.priceChange), item.amount)
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
            storage: createJSONStorage(() => sessionStorage),
            // Loaded by useCartHydrated, see below
            skipHydration: true
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
            storage: createJSONStorage(() => localStorage),
            skipHydration: true
        }
    )
)

function subscribeHydration(callback: () => void): () => void {
    const unsubscribe = [
        useShoppingCart.persist.onFinishHydration(callback),
        useStoredOrder.persist.onFinishHydration(callback)
    ]
    return () => unsubscribe.forEach(u => u())
}

function isHydrated(): boolean {
    return useShoppingCart.persist.hasHydrated() && useStoredOrder.persist.hasHydrated()
}

/**
 * The cart and the last order live in browser storage, which the server can't see. Loading them before React hydrates
 * would make the first render differ from the server's HTML, so the stores skip automatic hydration and are loaded
 * here, after mount. Returns whether they have been loaded; effects that act on the cart should wait for it.
 */
export function useCartHydrated(): boolean {
    const hydrated = useSyncExternalStore(subscribeHydration, isHydrated, () => false)
    useEffect(() => {
        if (!useShoppingCart.persist.hasHydrated()) {
            void useShoppingCart.persist.rehydrate()
        }
        if (!useStoredOrder.persist.hasHydrated()) {
            void useStoredOrder.persist.rehydrate()
        }
    }, [])
    return hydrated
}
