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
                   className={`hidden lg:flex items-center gap-2 rounded-full px-4 h-9 text-sm font-medium transition-colors
                   ${active ? 'bg-amber-400 text-espresso hover:bg-amber-300' : 'bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/20'}`}>
        <span className={`h-2 w-2 rounded-full ${active ? 'bg-espresso animate-pulse' : 'bg-white/50'}`}/>
        {active ? t('orders.onSiteExit') : t('orders.onSite')}
    </button>
}
