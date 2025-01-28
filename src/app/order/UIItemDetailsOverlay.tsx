'use client'

import {HydratedItemType} from '@/app/lib/ui-data-actions'
import {useTranslationClient} from '@/app/i18n/client'
import {HiX} from 'react-icons/hi'
import Image from 'next/image'
import Markdown from 'react-markdown'
import UIOptionType from '@/app/order/UIOptionType'
import {useEffect, useState} from 'react'

export default function UIItemDetailsOverlay({item, uploadPrefix, close}: {
    item: HydratedItemType,
    uploadPrefix: string,
    close: () => void
}) {
    const {t} = useTranslationClient('order')
    const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: number }>({})
    const [typical, setTypical] = useState(0) // Trick to force re-render (VERY BAD practice)

    useEffect(() => {
        // Select all default options
        const options = Object()

        for (const optionType of item.options) {
            const defaultOption = optionType.items.find(o => o.default)
            if (defaultOption) {
                options[optionType.id.toString()] = defaultOption.id
            }
        }

        setSelectedOptions(options)
    }, [item.options])

    return <div className="w-full h-full bg-default p-4 lg:p-8 xl:p-16">
        <div className="flex items-center mb-5">
            <p className="text-2xl font-bold font-display mr-auto">{item.name}</p>

            <button className="btn-icon-only" onClick={close} aria-label={t('close')}><HiX/></button>
        </div>
        <Image src={uploadPrefix + item.image} alt="" width={512} height={512}
               className="object-cover w-full rounded-3xl h-72 mb-3"/>
        <div className="mb-5 text-sm p-5 bg-yellow-100 dark:bg-yellow-800 rounded-3xl">
            <Markdown>{item.description}</Markdown></div>

        {item.options.map(option =>
            <UIOptionType key={`${option.id}-${typical}`} optionType={option}
                          selected={selectedOptions[option.id.toString()]} onChange={n => {
                selectedOptions[option.id.toString()] = n
                setSelectedOptions(selectedOptions)
                setTypical(typical + 1)
            }}/>)}
    </div>
}
