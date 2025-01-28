'use client'

import {HydratedOptionType} from '@/app/lib/ui-data-actions'
import {useTranslationClient} from '@/app/i18n/client'
import {Button} from 'flowbite-react'
import If from '@/app/lib/If'

export default function UIOptionType({optionType, selected, onChange}: {
    optionType: HydratedOptionType,
    selected: number,
    onChange: (newSelected: number) => void
}) {
    const {t} = useTranslationClient('order')

    return <div className="mb-5">
        <p className="mb-1 text-sm">{optionType.name}</p>
        <div className="flex gap-3">
            {optionType.items.map(item =>
                <Button key={item.id} color={selected === item.id ? 'yellow' : 'gray'} pill size="xs"
                        onClick={() => onChange(item.id)}>
                    {item.name}
                    <If condition={selected === item.id}>
                        <span className="sr-only">{t('selected')}</span>
                    </If>
                </Button>)}
        </div>
    </div>
}
