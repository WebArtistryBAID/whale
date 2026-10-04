'use client'

import { HydratedOptionType } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import Decimal from 'decimal.js'

export default function UIOptionType({ optionType, selected, onChange }: {
    optionType: HydratedOptionType,
    selected: number,
    onChange: (newSelected: number) => void
}) {
    const { t } = useTranslationClient('order')

    return <fieldset className="mb-6" aria-label={optionType.name + ' ' + t('a11y.option')}>
        <legend className="font-toon text-lg mb-2">{optionType.name}</legend>
        <div className="flex gap-2.5 flex-wrap">
            {optionType.items.map(item => {
                const isSelected = selected === item.id
                const priceChange = Decimal(item.priceChange)
                return <button key={item.id} disabled={item.soldOut} onClick={() => onChange(item.id)}
                               aria-pressed={isSelected}
                               className={`rounded-full px-4 h-10 border-toon transition-all
                               disabled:opacity-40 disabled:line-through disabled:cursor-not-allowed
                               ${isSelected
                                   ? 'bg-butter text-[#4a2511] border-ink shadow-toon-sm font-semibold -translate-y-px'
                                   : 'bg-paper border-ink/25 hover:border-ink'}`}>
                    {item.name}
                    <If condition={!priceChange.eq(0)}>
                        <span className="ml-1 text-sm opacity-70">{priceChange.gt(0) ? '+' : ''}¥{priceChange.toString()}</span>
                    </If>
                    <If condition={isSelected}>
                        <span className="sr-only">{t('a11y.selected')}</span>
                    </If>
                </button>
            })}
        </div>
    </fieldset>
}
