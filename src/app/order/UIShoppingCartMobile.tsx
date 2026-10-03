'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiChevronUp, HiShoppingBag } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useEffect, useRef, useState } from 'react'
import { useCartStatus } from '@/app/order/useCartStatus'
import CartWarnings from '@/app/order/CartWarnings'

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

    const total = <p className="mr-auto">
        <span className="sr-only">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</span>
        <span aria-hidden className="price text-xl">¥{shoppingCart.getTotalPrice().toString()}</span>
    </p>

    return <>
        <If condition={showAll}>
            <div className="fixed inset-0 z-50 bg-espresso-900/40 backdrop-blur-sm" onClick={() => setShowAll(false)}
                 aria-hidden></div>
            <div aria-label={t('a11y.shoppingCart')} ref={detailsRef} tabIndex={0}
                 className="bg-white dark:bg-espresso-700 rounded-t-3xl max-h-[75dvh] fixed bottom-0 inset-x-0 z-50
                 flex flex-col shadow-lift animate-[fadeIn_150ms_ease-out]">
                <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-white/20" aria-hidden/>
                <div className="flex items-center px-5 pt-3 pb-2">
                    <h2 className="text-lg font-bold mr-auto">{t('cartTitle')}</h2>
                    <button className="text-sm secondary px-3 py-1" onClick={() => setShowAll(false)}>{t('close')}</button>
                </div>
                <If condition={shoppingCart.items.length > 0}>
                    <div className="flex flex-col gap-4 px-5 py-3 overflow-y-auto">
                        {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix}
                                                                                        item={item}
                                                                                        key={JSON.stringify(item) + index.toString()}
                                                                                        index={index}/>)}
                    </div>
                </If>
                <If condition={shoppingCart.items.length < 1}>
                    <div className="flex flex-col justify-center items-center py-12">
                        <HiShoppingBag className="text-4xl mb-2 text-caramel"/>
                        <p className="secondary">{t('empty')}</p>
                    </div>
                </If>
                <div className="border-t border-cream-200 dark:border-white/10 p-4 flex flex-col gap-3
                pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <CartWarnings title={t('notice')} warnings={shoppingCart.items.length > 0 ? warnings : []}/>
                    <div className="flex items-center gap-3">
                        {total}
                        <Button pill size="lg" disabled={checkoutDisabled} color="warning" onClick={() => {
                            if (shoppingCart.items.length < 1) {
                                return
                            }
                            router.replace('/order/checkout')
                        }}>{t('checkout.title')}</Button>
                    </div>
                </div>
            </div>
        </If>
        <If condition={!showAll}>
            <div className="fixed bottom-0 inset-x-0 z-20 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div aria-label={t('a11y.shoppingCart')} tabIndex={0}
                     className="flex items-center gap-3 rounded-full bg-espresso dark:bg-espresso-700 text-white
                     shadow-lift pl-3 pr-2 py-2">
                    <button className="flex items-center gap-3 mr-auto" onClick={() => setShowAll(true)}
                            aria-label={t('checkout.details')}>
                        <span className="relative h-11 w-11 rounded-full bg-caramel flex items-center justify-center">
                            <HiShoppingBag className="text-xl"/>
                            <If condition={shoppingCart.getAmount() > 0}>
                                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-white
                                text-espresso text-[11px] font-bold flex items-center justify-center tabular-nums">
                                    {shoppingCart.getAmount()}
                                </span>
                            </If>
                        </span>
                        <span className="text-left">
                            <span className="block price text-lg text-white leading-tight">¥{shoppingCart.getTotalPrice().toString()}</span>
                            <span className="flex items-center gap-1 text-xs text-white/60">
                                {t('checkout.details')} <HiChevronUp/>
                            </span>
                        </span>
                    </button>
                    <Button pill color="warning" disabled={checkoutDisabled} onClick={() => {
                        if (warnings.length > 0) {
                            setShowAll(true)
                            return
                        }
                        router.replace('/order/checkout')
                    }}>{t('checkout.title')}</Button>
                </div>
            </div>
        </If>
    </>
}
