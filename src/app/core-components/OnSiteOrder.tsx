'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { Button } from 'flowbite-react'
import { CookiesProvider } from 'react-cookie'

export default function OnSiteOrder() {
    return <CookiesProvider><WrappedOnSiteOrder/></CookiesProvider>
}

function WrappedOnSiteOrder() {
    const { t } = useTranslationClient('user')
    const shoppingCart = useShoppingCart()

    if (shoppingCart.onSiteOrderMode) {
        return <Button onClick={() => shoppingCart.setOnSiteOrderMode(false)} pill className="hidden lg:block"
                       color="warning">{t('orders.onSiteExit')}</Button>
    }
    return <Button onClick={() => shoppingCart.setOnSiteOrderMode(true)} pill className="hidden lg:block"
                   color="warning">{t('orders.onSite')}</Button>
}
