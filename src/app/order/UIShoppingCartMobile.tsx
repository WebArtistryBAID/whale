'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiClock } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useEffect, useRef, useState } from 'react'

export default function UIShoppingCartMobile({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const [ showAll, setShowAll ] = useState(true)
    const detailsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (showAll) {
            detailsRef.current!.focus()
        }
    }, [ showAll ])

    return <>
        <If condition={showAll}>
            <div className="fixed top-0 w-screen h-screen z-10 bg-gray-400/50" onClick={() => setShowAll(false)}
                 aria-hidden></div>
            <div aria-label={t('a11y.shoppingCart')} ref={detailsRef} tabIndex={0}
                 className="bg-amber-50 dark:bg-yellow-800 rounded-t-3xl h-[50vh] fixed bottom-0 w-screen z-20">
                <If condition={shoppingCart.items.length > 0}>
                    <div className="flex flex-col gap-5 mb-8 p-8 h-full overflow-y-auto">
                        {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate uploadPrefix={uploadPrefix}
                                                                                        item={item}
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

                <div className="absolute z-20 bottom-0 w-full flex items-center rounded-3xl p-3">
                    <p className="text-lg mr-auto">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</p>
                    <Button pill color="gray" className="mr-3" onClick={() => setShowAll(false)}>
                        {t('close')}
                    </Button>
                    <Button pill color="warning" onClick={() => {
                        if (shoppingCart.items.length > 0) {
                            router.push('/order/checkout')
                        }
                    }}>{t('checkout.title')}</Button>
                </div>
            </div>
        </If>
        <If condition={!showAll}>
            <div aria-label={t('a11y.shoppingCart')} tabIndex={0}
                 className="bg-amber-50 dark:bg-yellow-800 flex items-center p-3 fixed bottom-0 w-screen z-20">
                <p className="text-lg mr-auto">{t('total', { price: shoppingCart.getTotalPrice().toString() })}</p>
                <Button pill color="warning" onClick={() => {
                    setShowAll(true)
                }}>{t('checkout.details')}</Button>
            </div>
        </If>
    </>
}
