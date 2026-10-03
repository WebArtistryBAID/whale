'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { HiShoppingBag } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useEffect, useRef, useState } from 'react'
import { useCartStatus } from '@/app/order/useCartStatus'
import CartWarnings from '@/app/order/CartWarnings'
import Beluga from '@/app/core-components/Beluga'

export default function UIShoppingCartMobile({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const [ showAll, setShowAll ] = useState(false)
    const detailsRef = useRef<HTMLDivElement>(null)
    const { warnings, checkoutDisabled } = useCartStatus()

    useEffect(() => {
        if (showAll) {
            detailsRef.current?.focus()
        }
    }, [ showAll ])

    const checkout = <button className="toon-btn h-11 px-5 disabled:opacity-40 disabled:pointer-events-none"
                             disabled={checkoutDisabled} onClick={() => {
        if (shoppingCart.items.length < 1) {
            return
        }
        router.replace('/order/checkout')
    }}>{t('checkout.title')}</button>

    return <>
        <If condition={showAll}>
            <div className="fixed inset-0 z-50 bg-ink/30" onClick={() => setShowAll(false)} aria-hidden></div>
            <div aria-label={t('a11y.shoppingCart')} ref={detailsRef} tabIndex={-1}
                 className="fixed bottom-0 inset-x-0 z-50 max-h-[78dvh] flex flex-col bg-paper rounded-t-[1.6rem]
                 border-t-toon border-x-toon border-ink pop-in focus:outline-none">
                <div className="flex items-center px-5 pt-4 pb-3 border-b-2 border-dashed border-ink/25">
                    <h2 className="text-2xl mr-auto">{t('cartTitle')}</h2>
                    <button className="font-toon text-base px-3 h-8 rounded-full border-2 border-ink" onClick={() => setShowAll(false)}>
                        {t('close')}
                    </button>
                </div>
                <If condition={shoppingCart.items.length > 0}>
                    <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
                        {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix}
                                                                                        item={item}
                                                                                        key={JSON.stringify(item) + index.toString()}
                                                                                        index={index}/>)}
                    </div>
                </If>
                <If condition={shoppingCart.items.length < 1}>
                    <div className="flex flex-col items-center py-8 text-center">
                        <Beluga mood="sleepy" className="w-36 mb-1"/>
                        <p className="font-toon text-lg">{t('empty')}</p>
                        <p className="text-sm secondary">{t('emptyHint')}</p>
                    </div>
                </If>
                <div className="px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t-2 border-dashed border-ink/25
                flex flex-col gap-3">
                    <CartWarnings title={t('notice')} warnings={warnings}/>
                    <div className="flex items-center gap-3">
                        <span className="font-toon text-3xl mr-auto">¥{shoppingCart.getTotalPrice().toString()}</span>
                        {checkout}
                    </div>
                </div>
            </div>
        </If>
        <If condition={!showAll}>
            <div className="fixed bottom-0 inset-x-0 z-20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div aria-label={t('a11y.shoppingCart')}
                     className="toon flex items-center gap-3 pl-2 pr-2 py-2 rounded-full">
                    <button className="flex items-center gap-3 mr-auto text-left" onClick={() => setShowAll(true)}
                            aria-label={t('checkout.details')}>
                        <span className="relative h-12 w-12 rounded-full border-toon border-ink bg-whale text-[#163746]
                        flex items-center justify-center">
                            <HiShoppingBag className="text-2xl"/>
                            <If condition={shoppingCart.getAmount() > 0}>
                                <span className="absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1 rounded-full border-2 border-ink
                                bg-tomato text-white font-toon text-sm flex items-center justify-center">
                                    {shoppingCart.getAmount()}
                                </span>
                            </If>
                        </span>
                        <span>
                            <span className="block font-toon text-2xl leading-none">¥{shoppingCart.getTotalPrice().toString()}</span>
                            <span className="block text-xs secondary">{t('checkout.details')}</span>
                        </span>
                    </button>
                    {checkout}
                </div>
            </div>
        </If>
    </>
}
