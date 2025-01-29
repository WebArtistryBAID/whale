'use client'

import {HydratedCategory} from '@/app/lib/ui-data-actions'
import UIItemType from '@/app/order/UIItemType'
import {useTranslationClient} from '@/app/i18n/client'

export default function UICategory({category, uploadPrefix}: { category: HydratedCategory, uploadPrefix: string }) {
    const {t} = useTranslationClient('order')
    return <>
        <p className="font-display mb-3 text-lg">{category.name} <span className="sr-only">{t('a11y.category')}</span>
        </p>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
            {category.items.map(item => <UIItemType item={item} key={item.id} uploadPrefix={uploadPrefix}/>)}
        </div>
    </>
}
