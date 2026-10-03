'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UIItemType from '@/app/order/UIItemType'
import { useTranslationClient } from '@/app/i18n/client'

export default function UICategory({ category, uploadPrefix }: { category: HydratedCategory, uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    return <section id={`category-${category.id}`} className="pt-6 lg:pt-8"
                    aria-label={category.name + ' ' + t('a11y.category')}>
        <h2 className="text-xl lg:text-2xl font-bold mb-4 flex items-center gap-3">
            {category.name}
            <span className="text-sm font-normal secondary">{category.items.length}</span>
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4">
            {category.items.map(item => <UIItemType item={item} key={item.id} uploadPrefix={uploadPrefix}/>)}
        </div>
    </section>
}
