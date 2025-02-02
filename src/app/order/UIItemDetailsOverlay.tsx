'use client'

import { HydratedItemType } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { HiMinus, HiPlus, HiX } from 'react-icons/hi'
import Image from 'next/image'
import Markdown from 'react-markdown'
import UIOptionType from '@/app/order/UIOptionType'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button } from 'flowbite-react'
import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import If from '@/app/lib/If'
import Decimal from 'decimal.js'

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

    function getThisItem(): OrderedItemTemplate {
        return {
            item: item,
            amount: amount,
            options: item.options.map(option => option.items.find(o => o.id === selectedOptions[option.id.toString()])!)
        }
    }

    return <div tabIndex={0} aria-label={t('a11y.itemDetails')}
                className="w-full h-full overflow-y-auto bg-default p-4 lg:p-8 xl:p-16 relative">
        <div className="flex items-center mb-5">
            <p className="text-2xl font-bold font-display mr-auto" tabIndex={0} ref={ref}>{item.name} <span
                className="sr-only">({t('a11y.itemDetails')})</span></p>

            <button className="btn-icon-only" onClick={close} aria-label={t('close')}><HiX/></button>
        </div>
        <Image src={uploadPrefix + item.image} alt="" width={512} height={512}
               className="object-cover w-full rounded-3xl h-72 mb-3"/>

        <div className="flex gap-3 mb-3 items-center">
            {item.tags.map(tag =>
                <Badge key={tag.id}
                       style={{ backgroundColor: tag.color, color: getTextColor(tag.color) }}
                       className="rounded-full">{tag.name} <span
                    className="sr-only">{t('a11y.tag')}</span></Badge>)}

            <If condition={!Decimal(item.salePercent).eq(1)}>
                <Badge color="success" className="rounded-full">
                    {t('itemDetails.sale', { sale: Decimal(1).minus(Decimal(item.salePercent)).mul(100).toString() })}
                    <span className="sr-only">{t('a11y.tag')}</span>
                </Badge>
            </If>
        </div>

        <div className="mb-5 text-sm p-5 bg-yellow-50 dark:bg-yellow-800 rounded-3xl">
            <Markdown>{item.description}</Markdown></div>

        <div className="mb-48">
            {item.options.map(option =>
                <UIOptionType key={option.id} optionType={option}
                              selected={selectedOptions[option.id.toString()]} onChange={n => {
                    selectedOptions[option.id.toString()] = n
                    setSelectedOptions(selectedOptions)
                    setTypical(typical + 1)
                }}/>)}
        </div>

        <div className="fixed flex items-center bottom-0 left-0 w-full lg:w-1/2 bg-yellow-50 dark:bg-yellow-800 p-5">
            <p className="mr-auto text-lg"
               aria-hidden>¥{calculatePrice(getThisItem()).toString()}</p>
            <span aria-live="polite" className="sr-only">
                {t('a11y.priceAmount', {
                    item: amount,
                    price: calculatePrice(getThisItem()).toString()
                })}
            </span>
            <div className="flex bg-white dark:bg-yellow-900 rounded-full items-center p-2 mr-3 gap-2">
                <Button pill size="xs" color="warning" aria-label={t('itemDetails.minus')}
                        onClick={() => {
                            if (amount > 1) {
                                setAmount(amount - 1)
                                setTypical(typical + 1)
                            }
                        }}>
                    <HiMinus/>
                    <If condition={amount <= 1}><span className="sr-only">{t('itemDetails.cannotMinusMore')}</span></If>
                </Button>
                <p aria-hidden aria-label={t('a11y.amount')}>{amount}</p>
                <Button pill size="xs" color="warning" aria-label={t('itemDetails.add')}
                        onClick={() => {
                            setAmount(amount + 1)
                            setTypical(typical + 1)
                        }}><HiPlus/></Button>
            </div>
            <Button pill color="warning" onClick={() => {
                shoppingCart.addItem(getThisItem())
                close()
            }}>{t('addItem')}</Button>
        </div>
    </div>
}
