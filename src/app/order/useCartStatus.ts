'use client'

import { useEffect, useState } from 'react'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import {
    CartValidationResponse,
    getOrderingAvailability,
    OrderingAvailabilityResponse,
    validateCartItems
} from '@/app/lib/ordering-actions'
import { getConfigValueAsNumber } from '@/app/lib/settings-actions'
import { useTranslationClient } from '@/app/i18n/client'

/**
 * Whether the cart can be checked out right now, and why not. Shared by the desktop and mobile carts.
 */
export function useCartStatus() {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const [ availability, setAvailability ] = useState<OrderingAvailabilityResponse | null>(null)
    const [ cartValidation, setCartValidation ] = useState<CartValidationResponse | null>(null)
    const [ maxCups, setMaxCups ] = useState(0)

    useEffect(() => {
        const sync = async () => {
            setAvailability(await getOrderingAvailability())
            setCartValidation(await validateCartItems(shoppingCart.items))
            setMaxCups(await getConfigValueAsNumber('maximum-cups-per-order'))
        }

        void sync()
        const id = setInterval(() => {
            void sync()
        }, 10000)
        return () => clearInterval(id)
    }, [ shoppingCart.items ])

    const isClosed = availability?.unavailableReason === 'store-closed'
    const remainingLimit = availability == null
        ? 0
        : availability.phase === 'preorder'
            ? availability.currentDay.remainingPreOrderCups
            : availability.phase === 'live'
                ? availability.currentDay.remainingLiveCups
                : 0
    const isPreOrderFull = availability?.phase === 'preorder' && (cartValidation?.countedAmount ?? 0) > remainingLimit
    const isLiveFull = availability?.phase === 'live' && (cartValidation?.countedAmount ?? 0) > remainingLimit
    const hasInventoryIssues = (cartValidation?.issues.length ?? 0) > 0
    const isOverMaxCups = shoppingCart.getAmount() > maxCups

    const warnings: string[] = []
    if (availability != null && shoppingCart.items.length > 0) {
        if (isClosed) {
            warnings.push(t('storeClosedModal.simple'))
        }
        if (isLiveFull) {
            warnings.push(t('maximumCupsModal.simple'))
        }
        if (isPreOrderFull) {
            warnings.push(t('preOrderLimitModal.simple'))
        }
        if (hasInventoryIssues) {
            warnings.push(t('inventory.cartChanged'))
            for (const issue of cartValidation?.issues ?? []) {
                warnings.push(issue.available <= 0
                    ? t('inventory.soldOut', { item: issue.itemName })
                    : t('inventory.onlyLeft', { count: issue.available, item: issue.itemName }))
            }
        }
        if (isOverMaxCups) {
            warnings.push(t('maximumCupsPerOrder', { count: maxCups }))
        }
    }

    return {
        warnings,
        checkoutDisabled: availability == null || isClosed || isLiveFull || isPreOrderFull || hasInventoryIssues ||
            isOverMaxCups || shoppingCart.items.length < 1
    }
}
