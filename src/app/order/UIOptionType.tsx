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

    return <div className="mb-6" aria-label={optionType.name + ' ' + t('a11y.option')}>
        <p className="mb-2 text-sm font-semibold">{optionType.name}</p>
        <div className="flex gap-2 flex-wrap">
            {optionType.items.map(item => {
                const isSelected = selected === item.id
                const priceChange = Decimal(item.priceChange)
                return <button key={item.id} disabled={item.soldOut} onClick={() => onChange(item.id)}
                               aria-pressed={isSelected}
                               className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors
                               disabled:opacity-40 disabled:line-through disabled:cursor-not-allowed
                               ${isSelected
                                   ? 'bg-espresso text-white border-espresso dark:bg-caramel dark:border-caramel'
                                   : 'bg-white dark:bg-white/5 border-cream-200 dark:border-white/10 hover:border-caramel/50'}`}>
                    {item.name}
                    <If condition={!priceChange.eq(0)}>
                        <span className={`ml-1 ${isSelected ? 'text-white/70' : 'secondary'}`}>
                            {priceChange.gt(0) ? '+' : ''}¥{priceChange.toString()}
                        </span>
                    </If>
                    <If condition={isSelected}>
                        <span className="sr-only">{t('a11y.selected')}</span>
                    </If>
                </button>
            })}
        </div>
    </div>
}
