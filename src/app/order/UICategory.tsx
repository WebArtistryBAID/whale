'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UIItemType from '@/app/order/UIItemType'
import { useTranslationClient } from '@/app/i18n/client'

export default function UICategory({ category, uploadPrefix }: { category: HydratedCategory, uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    return <section id={`category-${category.id}`} className="pt-8 lg:pt-10"
                    aria-label={category.name + ' ' + t('a11y.category')}>
        <h2 className="text-lg lg:text-xl font-bold pb-3 border-b-2 border-espresso dark:border-stone-300">
            {category.name}
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-x-10">
            {category.items.map(item => <UIItemType item={item} key={item.id} uploadPrefix={uploadPrefix}/>)}
        </div>
    </section>
}
