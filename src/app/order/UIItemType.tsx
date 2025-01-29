'use client'

import { HydratedItemType } from '@/app/lib/ui-data-actions'
import Image from 'next/image'
import { Button } from 'flowbite-react'
import { useTranslationClient } from '@/app/i18n/client'
import { useState } from 'react'
import If from '@/app/lib/If'
import UIItemDetailsOverlay from '@/app/order/UIItemDetailsOverlay'
import Decimal from 'decimal.js'

export default function UIItemType({ item, uploadPrefix }: { item: HydratedItemType, uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const [ selected, setSelected ] = useState(false)

    return <>
        <If condition={selected}>
            <div className="z-10 absolute top-0 left-0 w-full h-full">
                <UIItemDetailsOverlay item={item} uploadPrefix={uploadPrefix} close={() => setSelected(false)}/>
            </div>
        </If>

        <div aria-label={item.name + ' ' + t('a11y.item')}
             className="cursor-pointer text-left items-center rounded-3xl p-5 flex
                gap-5 hover:bg-yellow-400/10 transition-colors duration-100" onClick={() => setSelected(true)}>
            <div className="flex-shrink">
                <Image src={uploadPrefix + item.image} alt="" width={512} height={512}
                       className="w-16 lg:w-24 rounded-full"/>
            </div>
            <div className="flex-grow">
                <p aria-hidden className="font-bold font-display text-lg">{item.name}</p>
                <p className="text-sm secondary mb-2">{item.shortDescription}</p>
                <div className="flex gap-3 items-center w-full">
                    <If condition={Decimal(item.salePercent).eq(1)}>
                        <p className="mr-auto">¥{Decimal(item.basePrice).toString()}</p>
                    </If>
                    <If condition={!Decimal(item.salePercent).eq(1)}>
                        <p aria-hidden className="mr-auto">
                            <span className="line-through mr-1">¥{Decimal(item.basePrice).toString()}</span>
                            ¥{Decimal(item.basePrice).mul(item.salePercent).toString()}
                        </p>
                        <p className="sr-only">
                            {t('a11y.sale', {
                                price: item.basePrice,
                                salePrice: Decimal(item.basePrice).mul(item.salePercent).toString()
                            })}
                        </p>
                    </If>
                    <Button pill size="xs" color="warning" onClick={() => setSelected(true)}>{t('addItem')}</Button>
                </div>
            </div>
        </div>
    </>
}
