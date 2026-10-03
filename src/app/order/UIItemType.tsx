'use client'

import { HydratedItemType } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useState } from 'react'
import If from '@/app/lib/If'
import UIItemDetailsOverlay from '@/app/order/UIItemDetailsOverlay'
import Decimal from 'decimal.js'
import { isItemSoldOut } from '@/app/lib/item-availability'
import { HiPlus } from 'react-icons/hi'

export default function UIItemType({ item, uploadPrefix }: { item: HydratedItemType, uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const [ selected, setSelected ] = useState(false)
    const soldOut = isItemSoldOut(item)
    const onSale = !Decimal(item.salePercent).eq(1)
    const salePrice = Decimal(item.basePrice).mul(item.salePercent).toString()

    return <>
        <If condition={selected && !soldOut}>
            <div className="z-50 fixed inset-x-0 bottom-0 top-16 lg:right-1/2 lg:z-30">
                <UIItemDetailsOverlay item={item} uploadPrefix={uploadPrefix} close={() => setSelected(false)}/>
            </div>
        </If>

        <div aria-label={item.name + ' ' + t('a11y.item')}
             className={`toon flex items-center gap-4 p-4 text-left ${soldOut ? 'opacity-70' : 'toon-press cursor-pointer'}`}
             onClick={() => setSelected(true)}>
            <div className="relative flex-shrink-0">
                <img src={uploadPrefix + item.image} alt="" width={512} height={512}
                     className={`w-24 h-24 lg:w-28 lg:h-28 object-cover rounded-full border-toon border-ink bg-latte
                     ${soldOut ? 'grayscale' : ''}`}/>
                <If condition={onSale && !soldOut}>
                    <span aria-hidden className="absolute -top-2 -left-2 rotate-[-12deg] rounded-full border-2 border-ink
                    bg-tomato text-white font-toon text-sm px-2 leading-6">
                        -{Decimal(1).minus(item.salePercent).mul(100).toString()}%
                    </span>
                </If>
                <If condition={soldOut}>
                    <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                        <span className="rotate-[-12deg] rounded-md border-2 border-ink bg-paper font-toon text-base px-2">
                            {t('itemDetails.soldOut')}
                        </span>
                    </span>
                </If>
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-toon text-xl leading-tight mb-1">{item.name}</p>
                <p className="text-sm secondary mb-3 line-clamp-2">{item.shortDescription}</p>
                <div className="flex gap-3 items-center w-full">
                    <If condition={!soldOut}>
                        <span aria-hidden className="mr-auto flex items-baseline gap-2">
                            <span className="price-tag text-lg">¥{onSale ? salePrice : Decimal(item.basePrice).toString()}</span>
                            <If condition={onSale}>
                                <span className="line-through text-sm secondary">¥{Decimal(item.basePrice).toString()}</span>
                            </If>
                        </span>
                        <span className="sr-only">{onSale
                            ? t('a11y.sale', { price: item.basePrice, salePrice })
                            : `¥${Decimal(item.basePrice).toString()}`}</span>
                    </If>
                    <If condition={soldOut}>
                        <span className="mr-auto font-toon secondary">{t('itemDetails.soldOut')}</span>
                    </If>
                    <button disabled={soldOut} aria-label={t('addItem')}
                            onClick={e => {
                                e.stopPropagation()
                                setSelected(true)
                            }}
                            className="h-11 w-11 flex-shrink-0 rounded-full border-toon border-ink bg-butter text-[#4a2511]
                            flex items-center justify-center shadow-toon-sm transition-transform hover:rotate-90
                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40">
                        <HiPlus className="text-xl"/>
                    </button>
                </div>
            </div>
        </div>
    </>
}
