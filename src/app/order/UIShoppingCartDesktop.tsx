'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useCartStatus } from '@/app/order/useCartStatus'
import CartWarnings from '@/app/order/CartWarnings'
import Beluga from '@/app/core-components/Beluga'

export default function UIShoppingCartDesktop({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const { warnings, checkoutDisabled } = useCartStatus()

    return <div aria-label={t('a11y.shoppingCart')} className="toon h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-dashed border-ink/25">
            <h2 className="text-2xl mr-auto">{t('cartTitle')}</h2>
            <If condition={shoppingCart.items.length > 0}>
                <span className="font-toon text-base px-3 rounded-full border-2 border-ink bg-whale text-[#163746] leading-7">
                    {t('cartCount', { count: shoppingCart.getAmount() })}
                </span>
            </If>
        </div>

        <If condition={shoppingCart.items.length > 0}>
            <div className="flex flex-col gap-4 px-6 py-5 flex-1 overflow-y-auto">
                {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix} item={item}
                                                                                key={JSON.stringify(item) + index.toString()}
                                                                                index={index}/>)}
            </div>
        </If>

        <If condition={shoppingCart.items.length < 1}>
            <div className="flex flex-col justify-center items-center flex-1 px-6 text-center">
                <Beluga mood="sleepy" className="w-40 mb-2"/>
                <p className="font-toon text-lg">{t('empty')}</p>
                <p className="text-sm secondary">{t('emptyHint')}</p>
            </div>
        </If>

        <div className="px-6 py-4 border-t-2 border-dashed border-ink/25 flex flex-col gap-3 bg-cream/50">
            <CartWarnings title={t('notice')} warnings={warnings}/>
            <div className="flex items-center gap-4">
                <p className="mr-auto">
                    <span className="sr-only">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</span>
                    <span aria-hidden className="font-toon text-3xl">¥{shoppingCart.getTotalPrice().toString()}</span>
                </p>
                <button className="toon-btn disabled:opacity-40 disabled:pointer-events-none" disabled={checkoutDisabled}
                        onClick={() => {
                            if (shoppingCart.items.length < 1) {
                                return
                            }
                            router.replace('/order/checkout')
                        }}>{t('checkout.title')}</button>
            </div>
        </div>
    </div>
}
