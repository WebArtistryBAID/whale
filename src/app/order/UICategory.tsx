'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UIItemType from '@/app/order/UIItemType'
import { useTranslationClient } from '@/app/i18n/client'

export default function UICategory({ category, uploadPrefix }: { category: HydratedCategory, uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    return <section id={`category-${category.id}`} className="scroll-mt-24" aria-label={category.name + ' ' + t('a11y.category')}>
        <h2 className="text-2xl mb-5 flex items-center gap-3">
            <span className="marker">{category.name}</span>
            <span className="text-sm font-body font-bold h-7 min-w-7 px-2 rounded-full border-2 border-ink bg-paper
            flex items-center justify-center">{category.items.length}</span>
        </h2>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
            {category.items.map(item => <UIItemType item={item} key={item.id} uploadPrefix={uploadPrefix}/>)}
        </div>
    </section>
}
