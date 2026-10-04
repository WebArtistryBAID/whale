'use client'

import { useCartHydrated } from '@/app/lib/shopping-cart'

// Loads the saved cart on every page, after React has hydrated
export default function CartHydration() {
    useCartHydrated()
    return null
}
