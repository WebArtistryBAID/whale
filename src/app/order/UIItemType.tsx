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
            <div className="z-50 fixed inset-x-0 bottom-0 top-16 lg:right-[26rem] xl:right-[30rem] lg:z-30">
                <UIItemDetailsOverlay item={item} uploadPrefix={uploadPrefix} close={() => setSelected(false)}/>
            </div>
        </If>

        <div aria-label={item.name + ' ' + t('a11y.item')}
             className={`group card p-3 lg:p-4 flex gap-4 items-center text-left transition-all duration-200
             ${soldOut ? 'opacity-60' : 'cursor-pointer hover:shadow-lift hover:-translate-y-0.5'}`}
             onClick={() => setSelected(true)}>
            <div className="relative flex-shrink-0">
                <img src={uploadPrefix + item.image} alt="" width={512} height={512}
                     className={`w-24 h-24 lg:w-28 lg:h-28 object-cover rounded-2xl bg-cream-100 ${soldOut ? 'grayscale' : ''}`}/>
                <If condition={onSale && !soldOut}>
                    <span aria-hidden className="absolute top-1.5 left-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5">
                        -{Decimal(1).minus(item.salePercent).mul(100).toString()}%
                    </span>
                </If>
            </div>
            <div className="flex-grow min-w-0 self-stretch flex flex-col">
                <p className="font-bold text-base lg:text-lg leading-snug">{item.name}</p>
                <p className="text-sm secondary line-clamp-2 mb-2">{item.shortDescription}</p>
                <div className="flex gap-3 items-center w-full mt-auto">
                    <If condition={!onSale && !soldOut}>
                        <p className="mr-auto price text-lg">¥{Decimal(item.basePrice).toString()}</p>
                    </If>
                    <If condition={onSale && !soldOut}>
                        <p aria-hidden className="mr-auto flex items-baseline gap-2">
                            <span className="price text-lg text-rose-600 dark:text-rose-400">¥{salePrice}</span>
                            <span className="line-through text-sm secondary">¥{Decimal(item.basePrice).toString()}</span>
                        </p>
                        <p className="sr-only">
                            {t('a11y.sale', {
                                price: item.basePrice,
                                salePrice
                            })}
                        </p>
                    </If>
                    <If condition={soldOut}>
                        <p className="mr-auto text-sm font-medium secondary">{t('itemDetails.soldOut')}</p>
                    </If>
                    <button disabled={soldOut} aria-label={t('addItem')}
                            onClick={e => {
                                e.stopPropagation()
                                setSelected(true)
                            }}
                            className="h-9 w-9 rounded-full bg-caramel text-white flex items-center justify-center
                            shadow-sm transition-transform duration-150 group-hover:scale-110
                            disabled:bg-stone-300 disabled:dark:bg-white/10 disabled:scale-100">
                        <HiPlus className="text-lg"/>
                    </button>
                </div>
            </div>
        </div>
    </>
}
