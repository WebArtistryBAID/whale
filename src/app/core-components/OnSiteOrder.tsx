'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { Button } from 'flowbite-react'

export default function OnSiteOrder() {
    const { t } = useTranslationClient('user')
    const shoppingCart = useShoppingCart()

    if (shoppingCart.onSiteOrderMode) {
        return <Button onClick={() => shoppingCart.setOnSiteOrderMode(false)} pill className="hidden lg:block"
                       color="yellow">{t('orders.onSiteExit')}</Button>
    }
    return <Button onClick={() => shoppingCart.setOnSiteOrderMode(true)} pill className="hidden lg:block"
                   color="yellow">{t('orders.onSite')}</Button>
}
