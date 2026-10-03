'use client'

import { HydratedItemType } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { HiMinus, HiPlus, HiX } from 'react-icons/hi'
import Markdown from 'react-markdown'
import UIOptionType from '@/app/order/UIOptionType'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button } from 'flowbite-react'
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
        <div className="relative px-4 pt-4 lg:px-8 lg:pt-8">
            <img src={uploadPrefix + item.image} alt="" width={512} height={512}
                 className="object-cover w-full rounded-3xl h-56 lg:h-80 bg-cream-100 shadow-card"/>
            <button className="absolute top-7 right-7 lg:top-11 lg:right-11 h-10 w-10 rounded-full bg-white/90
            dark:bg-espresso-700/90 backdrop-blur text-espresso dark:text-white shadow-card flex items-center justify-center
            hover:bg-white transition-colors" onClick={close} aria-label={t('close')}><HiX className="text-lg"/></button>
        </div>

        <div className="px-4 lg:px-8 pt-5 flex-1">
            <div className="flex gap-2 mb-3 items-center flex-wrap">
                {item.tags.map(tag =>
                    <Badge key={tag.id}
                           style={{ backgroundColor: tag.color, color: getTextColor(tag.color) }}
                           className="rounded-full">{tag.name} <span
                        className="sr-only">{t('a11y.tag')}</span></Badge>)}

                <If condition={!Decimal(item.salePercent).eq(1)}>
                    <Badge color="failure" className="rounded-full">
                        {t('itemDetails.sale', { sale: Decimal(1).minus(Decimal(item.salePercent)).mul(100).toString() })}
                        <span className="sr-only">{t('a11y.tag')}</span>
                    </Badge>
                </If>
            </div>

            <p className="text-2xl lg:text-3xl font-bold tracking-tight mb-1 focus:outline-none" tabIndex={0} ref={ref}>{item.name} <span
                className="sr-only">({t('a11y.itemDetails')})</span></p>
            <p className="secondary mb-5">{item.shortDescription}</p>

            <div className="mb-6 text-sm leading-relaxed card p-5">
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

        <div className="sticky bottom-0 flex items-center gap-3 px-4 py-4 lg:px-8 bg-white/95 dark:bg-espresso-700/95
        backdrop-blur border-t border-cream-200 dark:border-white/10">
            <p className="mr-auto price text-2xl" aria-hidden>¥{price}</p>
            <span aria-live="polite" className="sr-only">
                {t('a11y.priceAmount', {
                    item: amount,
                    price
                })}
            </span>
            <div className="flex rounded-full items-center p-1 gap-1 bg-cream-100 dark:bg-white/5">
                <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white dark:bg-white/10 shadow-sm
                disabled:opacity-40" aria-label={t('itemDetails.minus')} disabled={amount <= 1}
                        onClick={() => {
                            if (amount > 1) {
                                setAmount(amount - 1)
                                setTypical(typical + 1)
                            }
                        }}>
                    <HiMinus/>
                    <If condition={amount <= 1}><span className="sr-only">{t('itemDetails.cannotMinusMore')}</span></If>
                </button>
                <p aria-hidden className="w-6 text-center font-semibold tabular-nums">{amount}</p>
                <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white dark:bg-white/10 shadow-sm
                disabled:opacity-40" aria-label={t('itemDetails.add')}
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
            <Button pill color="warning" size="lg" disabled={soldOut || availableToAdd === 0} onClick={() => {
                if (soldOut || availableToAdd === 0) {
                    return
                }
                shoppingCart.addItem(getThisItem())
                close()
            }}>{t('addConfirm')}</Button>
        </div>
    </div>
}
