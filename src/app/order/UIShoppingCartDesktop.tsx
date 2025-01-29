'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiClock } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'

export default function UIShoppingCartDesktop({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()

    return <div aria-label={t('a11y.shoppingCart')}
                className="bg-amber-50 dark:bg-yellow-800 rounded-3xl h-full relative">
        <If condition={shoppingCart.items.length > 0}>
            <div className="flex flex-col gap-5 mb-8 p-8 h-full overflow-y-auto">
                {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix} item={item}
                                                                                key={JSON.stringify(item) + index.toString()}
                                                                                index={index}/>)}
            </div>
        </If>

        <If condition={shoppingCart.items.length < 1}>
            <div className="flex flex-col justify-center items-center h-4/5 w-full">
                <HiClock className="text-6xl mb-1 text-amber-400 dark:text-yellow-400"/>
                <p>{t('empty')}</p>
            </div>
        </If>

        <div className="absolute z-20 bottom-0 w-full flex items-center rounded-3xl p-5">
            <p className="text-lg mr-auto">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</p>
            <Button pill color="yellow" onClick={() => {
                if (shoppingCart.items.length > 0) {
                    router.push('/order/checkout')
                }
            }}>{t('checkout.title')}</Button>
        </div>
    </div>
}
