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
        <legend className="mb-2 text-sm font-semibold">{optionType.name}</legend>
        <div className="flex gap-2 flex-wrap">
            {optionType.items.map(item => {
                const isSelected = selected === item.id
                const priceChange = Decimal(item.priceChange)
                return <button key={item.id} disabled={item.soldOut} onClick={() => onChange(item.id)}
                               aria-pressed={isSelected}
                               className={`rounded-md px-3.5 py-2 text-sm border transition-colors
                               disabled:opacity-40 disabled:line-through disabled:cursor-not-allowed
                               ${isSelected
                                   ? 'bg-espresso text-cream border-espresso dark:bg-stone-200 dark:text-espresso dark:border-stone-200'
                                   : 'border-cream-300 dark:border-white/20 enabled:hover:border-espresso dark:enabled:hover:border-white'}`}>
                    {item.name}
                    <If condition={!priceChange.eq(0)}>
                        <span className={`ml-1.5 font-serif tabular-nums ${isSelected ? 'opacity-70' : 'secondary'}`}>
                            {priceChange.gt(0) ? '+' : ''}¥{priceChange.toString()}
                        </span>
                    </If>
                    <If condition={isSelected}>
                        <span className="sr-only">{t('a11y.selected')}</span>
                    </If>
                </button>
            })}
        </div>
    </fieldset>
}
