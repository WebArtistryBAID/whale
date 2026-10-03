'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { CookiesProvider } from 'react-cookie'

export default function OnSiteOrder() {
    return <CookiesProvider><WrappedOnSiteOrder/></CookiesProvider>
}

function WrappedOnSiteOrder() {
    const { t } = useTranslationClient('user')
    const shoppingCart = useShoppingCart()
    const active = shoppingCart.onSiteOrderMode

    return <button onClick={() => shoppingCart.setOnSiteOrderMode(!active)} aria-pressed={active}
                   className={`hidden lg:flex items-center h-9 px-3 rounded-md text-sm font-medium transition-colors
                   ${active ? 'bg-caramel text-white hover:bg-caramel-600' : 'hover:bg-cream-100 dark:hover:bg-white/5'}`}>
        {active ? t('orders.onSiteExit') : t('orders.onSite')}
    </button>
}
