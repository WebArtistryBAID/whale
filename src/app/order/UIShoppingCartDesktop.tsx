'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiShoppingBag } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useCartStatus } from '@/app/order/useCartStatus'
import CartWarnings from '@/app/order/CartWarnings'

export default function UIShoppingCartDesktop({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const { warnings, checkoutDisabled } = useCartStatus()

    return <div aria-label={t('a11y.shoppingCart')} className="card h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
            <h2 className="text-lg font-bold mr-auto">{t('cartTitle')}</h2>
            <If condition={shoppingCart.items.length > 0}>
                <span className="rounded-full bg-caramel-50 dark:bg-white/5 text-caramel-700 dark:text-caramel-100
                text-xs font-semibold px-2.5 py-1">{t('cartCount', { count: shoppingCart.getAmount() })}</span>
            </If>
        </div>

        <If condition={shoppingCart.items.length > 0}>
            <div className="flex flex-col gap-4 px-6 pb-4 flex-1 overflow-y-auto">
                {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix} item={item}
                                                                                key={JSON.stringify(item) + index.toString()}
                                                                                index={index}/>)}
            </div>
        </If>

        <If condition={shoppingCart.items.length < 1}>
            <div className="flex flex-col justify-center items-center flex-1 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-caramel-50 dark:bg-white/5 flex items-center justify-center mb-3">
                    <HiShoppingBag className="text-3xl text-caramel dark:text-caramel-100"/>
                </div>
                <p className="secondary">{t('empty')}</p>
            </div>
        </If>

        <div className="border-t border-cream-200 dark:border-white/10 p-6 flex flex-col gap-4">
            <CartWarnings title={t('notice')} warnings={shoppingCart.items.length > 0 ? warnings : []}/>
            <div className="flex items-center gap-4">
                <p className="mr-auto text-lg">
                    <span className="sr-only">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</span>
                    <span aria-hidden className="price text-2xl">¥{shoppingCart.getTotalPrice().toString()}</span>
                </p>
                <Button pill size="lg" disabled={checkoutDisabled} color="warning" className="px-6" onClick={() => {
                    if (shoppingCart.items.length < 1) {
                        return
                    }
                    router.replace('/order/checkout')
                }}>{t('checkout.title')}</Button>
            </div>
        </div>
    </div>
}
