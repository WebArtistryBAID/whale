'use client'

import { HydratedItemType } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { HiMinus, HiPlus, HiX } from 'react-icons/hi'
import Markdown from 'react-markdown'
import UIOptionType from '@/app/order/UIOptionType'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'flowbite-react'
import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import If from '@/app/lib/If'
import Decimal from 'decimal.js'
import { getAvailableInventory, getRequestedAmountForItem, isItemSoldOut } from '@/app/lib/item-availability'

function getTextColor(backgroundColor: string): 'white' | 'black' {
    const r = parseInt(backgroundColor.slice(1, 3), 16)
    const g = parseInt(backgroundColor.slice(3, 5), 16)
    const b = parseInt(backgroundColor.slice(5, 7), 16)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return luminance < 0.5 ? 'white' : 'black'
}

export default function UIItemDetailsOverlay({ item, uploadPrefix, close }: {
    item: HydratedItemType,
    uploadPrefix: string,
    close: () => void
}) {
    const { t } = useTranslationClient('order')
    const [ selectedOptions, setSelectedOptions ] = useState<{ [key: string]: number }>({})
    const [ amount, setAmount ] = useState(1)
    const [ typical, setTypical ] = useState(0) // Trick to force re-render (VERY BAD practice, but I don't know why it doesn't work)
    const ref = useRef<HTMLDivElement>(null)
    const shoppingCart = useShoppingCart()
    const soldOut = isItemSoldOut(item)
    const availableInventory = getAvailableInventory(item)
    const alreadyInCart = getRequestedAmountForItem(shoppingCart.items, item.id)
    const availableToAdd = availableInventory == null ? null : Math.max(availableInventory - alreadyInCart, 0)

    useEffect(() => {
        // Select all default options
        const options = Object()

        for (const optionType of item.options) {
            const defaultOption = optionType.items.find(o => o.default)
            options[optionType.id.toString()] = defaultOption?.id ?? optionType.items[0].id
        }

        setSelectedOptions(options)
    }, [ item.options ])

    useEffect(() => {
        setTimeout(() => {
            ref.current?.focus()
        }, 100)
    }, [])

    useEffect(() => {
        if (availableToAdd != null && amount > availableToAdd) {
            setAmount(Math.max(availableToAdd, 1))
        }
    }, [ amount, availableToAdd ])

    function getThisItem(): OrderedItemTemplate {
        return {
            item: item,
            amount: amount,
            options: item.options.map(option => option.items.find(o => o.id === selectedOptions[option.id.toString()])!)
        }
    }

    const price = calculatePrice(getThisItem()).toString()

    return <div tabIndex={-1} aria-label={t('a11y.itemDetails')}
                className="focus:outline-none w-full h-full overflow-y-auto bg-cream dark:bg-espresso-900 flex flex-col
                animate-[fadeIn_150ms_ease-out]">
        <div className="flex-1 px-5 pt-5 lg:px-10 lg:pt-8 lg:grid lg:grid-cols-[minmax(0,20rem)_1fr] xl:grid-cols-[minmax(0,24rem)_1fr] lg:gap-10 lg:items-start">
            <div className="relative mb-6 lg:sticky lg:top-0">
                <img src={uploadPrefix + item.image} alt="" width={512} height={512}
                     className="object-cover w-full aspect-[4/3] lg:aspect-square rounded-lg bg-cream-100"/>
                <button className="absolute top-3 right-3 h-9 w-9 rounded-md bg-[#fffdf9] dark:bg-espresso-700
                border border-cream-200 dark:border-white/10 flex items-center justify-center hover:border-espresso
                transition-colors" onClick={close} aria-label={t('close')}><HiX/></button>
            </div>

            <div>
                <div className="flex gap-2 mb-3 items-center flex-wrap">
                    {item.tags.map(tag =>
                        <span key={tag.id} className="text-xs font-semibold px-2 py-0.5 rounded"
                              style={{ backgroundColor: tag.color, color: getTextColor(tag.color) }}>
                            {tag.name} <span className="sr-only">{t('a11y.tag')}</span>
                        </span>)}
                    <If condition={!Decimal(item.salePercent).eq(1)}>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded border border-caramel text-caramel
                        dark:border-caramel-100 dark:text-caramel-100">
                            {t('itemDetails.sale', { sale: Decimal(1).minus(Decimal(item.salePercent)).mul(100).toString() })}
                            <span className="sr-only">{t('a11y.tag')}</span>
                        </span>
                    </If>
                </div>

                <p className="text-2xl lg:text-3xl font-bold mb-1 focus:outline-none" tabIndex={0} ref={ref}>{item.name} <span
                    className="sr-only">({t('a11y.itemDetails')})</span></p>
                <p className="secondary mb-4">{item.shortDescription}</p>

                <div className="mb-6 text-sm leading-relaxed pb-6 border-b border-cream-200 dark:border-white/10">
                    <Markdown>{item.description}</Markdown></div>

                <div className="pb-6">
                    {item.options.map(option =>
                        <UIOptionType key={option.id} optionType={option}
                                      selected={selectedOptions[option.id.toString()]} onChange={n => {
                            selectedOptions[option.id.toString()] = n
                            setSelectedOptions(selectedOptions)
                            setTypical(typical + 1)
                        }}/>)}
                </div>
            </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 px-5 py-3 lg:px-10
        pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#fffdf9] dark:bg-espresso-700
        border-t border-cream-200 dark:border-white/10">
            <p className="mr-auto price text-2xl" aria-hidden>¥{price}</p>
            <span aria-live="polite" className="sr-only">
                {t('a11y.priceAmount', {
                    item: amount,
                    price
                })}
            </span>
            <div className="flex items-center rounded-md border border-cream-300 dark:border-white/20">
                <button className="h-10 w-10 flex items-center justify-center disabled:opacity-30"
                        aria-label={t('itemDetails.minus')} disabled={amount <= 1}
                        onClick={() => {
                            if (amount > 1) {
                                setAmount(amount - 1)
                                setTypical(typical + 1)
                            }
                        }}>
                    <HiMinus/>
                    <If condition={amount <= 1}><span className="sr-only">{t('itemDetails.cannotMinusMore')}</span></If>
                </button>
                <p aria-hidden className="w-8 text-center font-serif font-semibold tabular-nums">{amount}</p>
                <button className="h-10 w-10 flex items-center justify-center disabled:opacity-30"
                        aria-label={t('itemDetails.add')}
                        disabled={availableToAdd != null && amount >= availableToAdd}
                        onClick={() => {
                            if (availableToAdd != null && amount >= availableToAdd) {
                                return
                            }
                            setAmount(amount + 1)
                            setTypical(typical + 1)
                        }}><HiPlus/>
                    <If condition={availableToAdd != null && amount >= availableToAdd}>
                        <span className="sr-only">{t('itemDetails.cannotAddMore')}</span>
                    </If>
                </button>
            </div>
            <Button color="warning" size="lg" disabled={soldOut || availableToAdd === 0} onClick={() => {
                if (soldOut || availableToAdd === 0) {
                    return
                }
                shoppingCart.addItem(getThisItem())
                close()
            }}>{t('addConfirm')}</Button>
        </div>
    </div>
}
