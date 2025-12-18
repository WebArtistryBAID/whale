'use client'

import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button, Popover } from 'flowbite-react'
import If from '@/app/lib/If'
import { HiClock } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useEffect, useRef, useState } from 'react'
import { Trans } from 'react-i18next/TransWithoutContext'
import { isMaximumCupsReached, isStoreOpen } from '@/app/lib/ordering-actions'
import { getConfigValueAsNumber } from '@/app/lib/settings-actions'

export default function UIShoppingCartMobile({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const [ showAll, setShowAll ] = useState(false)
    const detailsRef = useRef<HTMLDivElement>(null)

    const [ storeOpen, setStoreOpen ] = useState(false)
    const [ atCapacity, setAtCapacity ] = useState(false)
    const [ maxCups, setMaxCups ] = useState(0)

    useEffect(() => {
        (async () => {
            setStoreOpen(await isStoreOpen())
            setAtCapacity(await isMaximumCupsReached())
            setMaxCups(await getConfigValueAsNumber('maximum-cups-per-order'))
        })()
    }, [])

    useEffect(() => {
        if (showAll) {
            detailsRef.current!.focus()
        }
    }, [ showAll ])

    const checkout = <Button pill
                             disabled={!storeOpen || atCapacity || shoppingCart.getAmount() > maxCups || shoppingCart.items.length < 1}
                             color="yellow" onClick={() => {
        if (shoppingCart.items.length > 0) {
            router.replace('/order/checkout')
        }
    }}>{t('checkout.title')}</Button>

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
                    <If condition={!storeOpen || atCapacity || shoppingCart.getAmount() > maxCups}>
                        <span className="sr-only">
                            <If condition={!storeOpen}>
                                <span className="text-sm">{t('storeClosedModal.simple')}</span>
                            </If>
                            <If condition={atCapacity}>
                                <span className="text-sm">{t('maximumCupsModal.simple')}</span>
                            </If>
                            <If condition={shoppingCart.getAmount() > maxCups}>
                                <span className="text-sm"><Trans t={t} i18nKey="maximumCupsPerOrder"
                                                                 count={maxCups}/></span>
                            </If>
                        </span>
                        <Popover trigger="hover" aria-hidden content={<div className="p-3 flex flex-col gap-1">
                            <If condition={!storeOpen}>
                                <p className="text-sm">{t('storeClosedModal.simple')}</p>
                            </If>
                            <If condition={atCapacity}>
                                <p className="text-sm">{t('maximumCupsModal.simple')}</p>
                            </If>
                            <If condition={shoppingCart.getAmount() > maxCups}>
                                <p className="text-sm"><Trans t={t} i18nKey="maximumCupsPerOrder"
                                                              count={maxCups}/></p>
                            </If>
                        </div>}>
                            {checkout}
                        </Popover>
                    </If>
                    <If condition={storeOpen && !atCapacity && shoppingCart.getAmount() <= maxCups}>
                        {checkout}
                    </If>
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
