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
            <div className="z-50 fixed inset-x-0 bottom-0 top-16 lg:right-[26rem] xl:right-[28rem] lg:z-30">
                <UIItemDetailsOverlay item={item} uploadPrefix={uploadPrefix} close={() => setSelected(false)}/>
            </div>
        </If>

        <div aria-label={item.name + ' ' + t('a11y.item')}
             className={`group flex gap-4 py-5 border-b border-cream-200 dark:border-white/10
             ${soldOut ? '' : 'cursor-pointer'}`}
             onClick={() => setSelected(true)}>
            <img src={uploadPrefix + item.image} alt="" width={512} height={512}
                 className={`flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-md bg-cream-100
                 ${soldOut ? 'grayscale opacity-60' : ''}`}/>
            <div className="flex-grow min-w-0 flex flex-col">
                <div className="flex items-baseline">
                    <p className={`font-bold leading-snug group-hover:underline underline-offset-4 decoration-1
                    ${soldOut ? 'secondary' : ''}`}>{item.name}</p>
                    <span className="leader" aria-hidden/>
                    <If condition={!onSale && !soldOut}>
                        <p className="price text-lg">¥{Decimal(item.basePrice).toString()}</p>
                    </If>
                    <If condition={onSale && !soldOut}>
                        <p aria-hidden className="price text-lg text-caramel dark:text-caramel-100">¥{salePrice}</p>
                        <p className="sr-only">{t('a11y.sale', { price: item.basePrice, salePrice })}</p>
                    </If>
                    <If condition={soldOut}>
                        <p className="text-sm font-medium secondary">{t('itemDetails.soldOut')}</p>
                    </If>
                </div>
                <p className="text-sm secondary line-clamp-2 mt-1">{item.shortDescription}</p>
                <div className="flex items-center gap-3 mt-auto pt-2">
                    <If condition={onSale && !soldOut}>
                        <span aria-hidden className="text-xs secondary">
                            <span className="line-through">¥{Decimal(item.basePrice).toString()}</span>
                            <span className="ml-2 font-semibold text-caramel dark:text-caramel-100">
                                {t('itemDetails.sale', { sale: Decimal(1).minus(item.salePercent).mul(100).toString() })}
                            </span>
                        </span>
                    </If>
                    <button disabled={soldOut} aria-label={t('addItem')}
                            onClick={e => {
                                e.stopPropagation()
                                setSelected(true)
                            }}
                            className="ml-auto h-8 w-8 rounded-md border border-espresso dark:border-stone-300 flex items-center
                            justify-center transition-colors hover:bg-espresso hover:text-cream dark:hover:bg-stone-200
                            dark:hover:text-espresso disabled:opacity-30 disabled:pointer-events-none">
                        <HiPlus/>
                    </button>
                </div>
            </div>
        </div>
    </>
}
