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
                   className={`hidden lg:flex items-center gap-2 h-10 px-4 rounded-full font-toon border-toon border-ink
                   shadow-toon-sm transition-transform hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px]
                   active:shadow-none ${active ? 'bg-tomato text-white' : 'bg-paper'}`}>
        <span className={`h-2.5 w-2.5 rounded-full border-2 border-current ${active ? 'bg-white' : ''}`}/>
        {active ? t('orders.onSiteExit') : t('orders.onSite')}
    </button>
}
