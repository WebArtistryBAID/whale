'use client'

import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import Image from 'next/image'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiClock } from 'react-icons/hi'

function UIOrderedItemTemplate({ item, index, uploadPrefix }: {
    item: OrderedItemTemplate,
    index: number,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    return <div className="flex items-center gap-5" aria-label={item.item.name + ' ' + t('a11y.shoppingCartItem')}>
        <Image src={uploadPrefix + item.item.image} alt="" width={512} height={512}
               className="w-16 lg:w-24 rounded-full flex-shrink"/>
        <div className="flex-grow">
            <p className="font-bold font-display text-lg" aria-hidden>{item.item.name}</p>
            <p className="text-sm secondary mb-2">
                <span className="sr-only">{t('a11y.appliedOptions')}</span>
                {item.options.map(i => i.name).join(' / ')}
            </p>
            <div className="flex w-full items-center">
                <p aria-hidden className="mr-auto">
                    x<span className="mr-3">{item.amount}</span>
                    ¥{calculatePrice(item).toString()}
                </p>
                <span className="sr-only">{t('a11y.priceAmountShoppingCart', {
                    item: item.amount,
                    price: calculatePrice(item).toString()
                })}</span>
                <Button pill size="xs" color="warning"
                        onClick={() => shoppingCart.removeItem(index)}>{t('remove')}</Button>
            </div>
        </div>
    </div>
}

export default function UIShoppingCart({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()

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
            <Button pill color="yellow">{t('checkout')}</Button>
        </div>
    </div>
}
