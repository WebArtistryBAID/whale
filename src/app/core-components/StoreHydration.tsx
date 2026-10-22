'use client'

import { useEffect } from 'react'
import { useShoppingCart, useStoredOrder } from '@/app/lib/shopping-cart'

export default function StoreHydration() {
    useEffect(() => {
        Promise.resolve(useShoppingCart.persist.rehydrate())
            .catch(() => undefined)
            .finally(() => useShoppingCart.setState({ hasHydrated: true }))
        Promise.resolve(useStoredOrder.persist.rehydrate()).catch(() => undefined)
    }, [])
    return null
}
