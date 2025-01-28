'use client'

import {HydratedItemType} from '@/app/lib/ui-data-actions'
import Image from 'next/image'
import {Button} from 'flowbite-react'
import {useTranslationClient} from '@/app/i18n/client'
import {useState} from 'react'
import If from '@/app/lib/If'
import UIItemDetailsOverlay from '@/app/order/UIItemDetailsOverlay'

export default function UIItemType({item, uploadPrefix}: { item: HydratedItemType, uploadPrefix: string }) {
    const {t} = useTranslationClient('order')
    const [selected, setSelected] = useState(false)

    return <>
        <If condition={selected}>
            <div className="z-10 absolute top-0 left-0 w-full h-full">
                <UIItemDetailsOverlay item={item} uploadPrefix={uploadPrefix} close={() => setSelected(false)}/>
            </div>
        </If>

        <div className="cursor-pointer text-left items-center rounded-3xl p-5 flex
                gap-5 hover:bg-amber-400/10 transition-colors duration-100" onClick={() => setSelected(true)}>
            <div>
                <Image src={uploadPrefix + item.image} alt={`${item.name}!`} width={512} height={512}
                       className="w-16 lg:w-24 rounded-full"/>
            </div>
            <div>
                <p className="font-bold font-display text-lg">{item.name}</p>
                <p className="text-sm secondary mb-2">{item.shortDescription}</p>
                <Button pill size="xs" color="yellow" onClick={() => setSelected(true)}>{t('addItem')}</Button>
            </div>
        </div>
    </>
}
