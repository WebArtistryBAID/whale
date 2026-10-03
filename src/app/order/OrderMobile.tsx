'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import { useTranslationClient } from '@/app/i18n/client'
import UIShoppingCartMobile from '@/app/order/UIShoppingCartMobile'
import CategoryChips from '@/app/order/CategoryChips'

export default function OrderMobile({ categories, uploadPrefix }: {
    categories: HydratedCategory[],
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <>
        <div className="sticky top-16 z-20 px-4 py-3 bg-cream/95 border-b-2 border-dashed border-ink/20">
            <CategoryChips categories={categories}/>
        </div>
        <div className="px-4 pt-6 pb-36 flex flex-col gap-10" aria-label={t('a11y.products')}>
            {categories.map(category => <UICategory key={category.id} category={category} uploadPrefix={uploadPrefix}/>)}
        </div>
        <UIShoppingCartMobile uploadPrefix={uploadPrefix}/>
    </>
}
