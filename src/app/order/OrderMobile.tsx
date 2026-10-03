'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import { useTranslationClient } from '@/app/i18n/client'
import UIShoppingCartMobile from '@/app/order/UIShoppingCartMobile'
import CategoryTabs from '@/app/order/CategoryTabs'

export default function OrderMobile({ categories, uploadPrefix }: {
    categories: HydratedCategory[],
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <>
        <CategoryTabs categories={categories} sticky="top-16"/>
        <div className="px-4 pb-36" aria-label={t('a11y.products')}>
            {categories.map(category => <UICategory key={category.id} category={category}
                                                     uploadPrefix={uploadPrefix}/>)}
        </div>
        <UIShoppingCartMobile uploadPrefix={uploadPrefix}/>
    </>
}
