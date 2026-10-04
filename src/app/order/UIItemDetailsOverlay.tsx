'use client'

import { HydratedItemType } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { HiMinus, HiPlus, HiX } from 'react-icons/hi'
import Markdown from 'react-markdown'
import UIOptionType from '@/app/order/UIOptionType'
import { useEffect, useRef, useState } from 'react'
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
                className="w-full h-full overflow-y-auto dots flex flex-col pop-in focus:outline-none">
        <div className="flex-1 p-5 lg:p-8">
            <div className="flex justify-end mb-2">
                <button className="h-11 w-11 rounded-full border-toon border-ink bg-paper flex items-center justify-center
                shadow-toon-sm hover:rotate-90 transition-transform" onClick={close} aria-label={t('close')}>
                    <HiX className="text-xl"/>
                </button>
            </div>
            <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-5">
                    <span aria-hidden className="absolute -inset-4 rounded-full bg-whale/60 border-toon border-ink rotate-6"/>
                    <img src={uploadPrefix + item.image} alt="" width={512} height={512}
                         className="relative w-48 h-48 lg:w-56 lg:h-56 object-cover rounded-full border-toon border-ink bg-latte"/>
                </div>
                <div className="flex gap-2 mb-3 justify-center flex-wrap">
                    {item.tags.map(tag =>
                        <span key={tag.id} className="font-toon text-sm px-3 rounded-full border-2 border-ink leading-7"
                              style={{ backgroundColor: tag.color, color: getTextColor(tag.color) }}>
                            {tag.name} <span className="sr-only">{t('a11y.tag')}</span>
                        </span>)}
                    <If condition={!Decimal(item.salePercent).eq(1)}>
                        <span className="font-toon text-sm px-3 rounded-full border-2 border-ink bg-tomato text-white leading-7">
                            {t('itemDetails.sale', { sale: Decimal(1).minus(Decimal(item.salePercent)).mul(100).toString() })}
                            <span className="sr-only">{t('a11y.tag')}</span>
                        </span>
                    </If>
                </div>
                <p className="font-toon text-3xl mb-1 focus:outline-none" tabIndex={0} ref={ref}>{item.name} <span
                    className="sr-only">({t('a11y.itemDetails')})</span></p>
                <p className="secondary">{item.shortDescription}</p>
            </div>

            <div className="toon-flat p-4 mb-6 text-sm leading-relaxed border-dashed">
                <Markdown>{item.description}</Markdown>
            </div>

            <div className="pb-4">
                {item.options.map(option =>
                    <UIOptionType key={option.id} optionType={option}
                                  selected={selectedOptions[option.id.toString()]} onChange={n => {
                        selectedOptions[option.id.toString()] = n
                        setSelectedOptions(selectedOptions)
                        setTypical(typical + 1)
                    }}/>)}
            </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 lg:gap-3 px-4 py-4 lg:px-8 bg-paper border-t-toon border-ink
        pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <p className="mr-auto font-toon text-2xl lg:text-3xl" aria-hidden>¥{price}</p>
            <span aria-live="polite" className="sr-only">
                {t('a11y.priceAmount', {
                    item: amount,
                    price
                })}
            </span>
            <div className="flex items-center rounded-full border-toon border-ink bg-cream p-1 gap-1">
                <button className="h-9 w-9 rounded-full bg-paper border-2 border-ink flex items-center justify-center
                disabled:opacity-30" aria-label={t('itemDetails.minus')} disabled={amount <= 1}
                        onClick={() => {
                            if (amount > 1) {
                                setAmount(amount - 1)
                                setTypical(typical + 1)
                            }
                        }}>
                    <HiMinus/>
                    <If condition={amount <= 1}><span className="sr-only">{t('itemDetails.cannotMinusMore')}</span></If>
                </button>
                <p aria-hidden className="w-7 text-center font-toon text-xl">{amount}</p>
                <button className="h-9 w-9 rounded-full bg-butter text-[#4a2511] border-2 border-ink flex items-center
                justify-center disabled:opacity-30" aria-label={t('itemDetails.add')}
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
            <button className="toon-btn px-4 lg:px-6" disabled={soldOut || availableToAdd === 0} onClick={() => {
                if (soldOut || availableToAdd === 0) {
                    return
                }
                shoppingCart.addItem(getThisItem())
                close()
            }}>{t('addConfirm')}</button>
        </div>
    </div>
}
