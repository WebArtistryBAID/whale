'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useCartStatus } from '@/app/order/useCartStatus'
import CartWarnings from '@/app/order/CartWarnings'

export default function UIShoppingCartDesktop({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const { warnings, checkoutDisabled } = useCartStatus()

    return <div aria-label={t('a11y.shoppingCart')} className="card h-full flex flex-col">
        <div className="flex items-baseline px-6 pt-5 pb-4">
            <h2 className="text-base font-bold mr-auto">{t('cartTitle')}</h2>
            <If condition={shoppingCart.items.length > 0}>
                <span className="text-sm secondary">{t('cartCount', { count: shoppingCart.getAmount() })}</span>
            </If>
        </div>

        <If condition={shoppingCart.items.length > 0}>
            <div className="flex flex-col gap-4 px-6 pb-5 flex-1 overflow-y-auto">
                {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix} item={item}
                                                                                key={JSON.stringify(item) + index.toString()}
                                                                                index={index}/>)}
            </div>
        </If>

        <If condition={shoppingCart.items.length < 1}>
            <div className="flex-1 flex items-center justify-center px-6 text-sm secondary">
                <p>{t('empty')}</p>
            </div>
        </If>

        <div className="perforation mx-0"/>
        <div className="px-6 pt-4 pb-5 flex flex-col gap-4">
            <CartWarnings title={t('notice')} warnings={shoppingCart.items.length > 0 ? warnings : []}/>
            <div className="flex items-baseline">
                <span className="font-semibold mr-auto">{t('checkout.total')}</span>
                <span className="sr-only">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</span>
                <span aria-hidden className="price text-3xl">¥{shoppingCart.getTotalPrice().toString()}</span>
            </div>
            <Button size="lg" fullSized disabled={checkoutDisabled} color="warning" onClick={() => {
                if (shoppingCart.items.length < 1) {
                    return
                }
                router.replace('/order/checkout')
            }}>{t('checkout.title')}</Button>
        </div>
    </div>
}
