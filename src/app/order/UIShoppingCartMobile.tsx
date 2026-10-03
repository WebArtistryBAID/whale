'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiChevronUp } from 'react-icons/hi'
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

    const checkout = <Button color="warning" disabled={checkoutDisabled} className="px-3" onClick={() => {
        if (shoppingCart.items.length < 1) {
            return
        }
        router.replace('/order/checkout')
    }}>{t('checkout.title')}</Button>

    return <>
        <If condition={showAll}>
            <div className="fixed inset-0 z-50 bg-espresso-900/40" onClick={() => setShowAll(false)}
                 aria-hidden></div>
            <div aria-label={t('a11y.shoppingCart')} ref={detailsRef} tabIndex={-1}
                 className="fixed bottom-0 inset-x-0 z-50 max-h-[75dvh] flex flex-col bg-[#fffdf9] dark:bg-espresso-700
                 rounded-t-lg border-t border-cream-200 dark:border-white/10 focus:outline-none">
                <div className="flex items-baseline px-5 pt-5 pb-3">
                    <h2 className="text-base font-bold mr-auto">{t('cartTitle')}</h2>
                    <button className="text-sm underline underline-offset-2 secondary" onClick={() => setShowAll(false)}>
                        {t('close')}
                    </button>
                </div>
                <If condition={shoppingCart.items.length > 0}>
                    <div className="flex flex-col gap-4 px-5 pb-5 overflow-y-auto">
                        {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix}
                                                                                        item={item}
                                                                                        key={JSON.stringify(item) + index.toString()}
                                                                                        index={index}/>)}
                    </div>
                </If>
                <If condition={shoppingCart.items.length < 1}>
                    <p className="px-5 py-10 text-center text-sm secondary">{t('empty')}</p>
                </If>
                <div className="perforation"/>
                <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col gap-4">
                    <CartWarnings title={t('notice')} warnings={shoppingCart.items.length > 0 ? warnings : []}/>
                    <div className="flex items-center gap-3">
                        <span className="font-semibold mr-auto">{t('checkout.total')}</span>
                        <span className="price text-2xl">¥{shoppingCart.getTotalPrice().toString()}</span>
                        {checkout}
                    </div>
                </div>
            </div>
        </If>
        <If condition={!showAll}>
            <div aria-label={t('a11y.shoppingCart')}
                 className="fixed bottom-0 inset-x-0 z-20 flex items-center gap-3 px-4 pt-3
                 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#fffdf9]/95 dark:bg-espresso-700/95 backdrop-blur-sm
                 border-t border-cream-200 dark:border-white/10">
                <button className="flex items-center gap-3 mr-auto text-left" onClick={() => setShowAll(true)}
                        aria-label={t('checkout.details')}>
                    <span className="h-10 min-w-10 px-2 rounded-md border border-espresso dark:border-stone-300
                    flex items-center justify-center font-serif font-semibold tabular-nums">
                        {shoppingCart.getAmount()}
                    </span>
                    <span>
                        <span className="block price text-xl leading-tight">¥{shoppingCart.getTotalPrice().toString()}</span>
                        <span className="flex items-center gap-1 text-xs secondary">
                            {t('checkout.details')} <HiChevronUp/>
                        </span>
                    </span>
                </button>
                {checkout}
            </div>
        </If>
    </>
}
