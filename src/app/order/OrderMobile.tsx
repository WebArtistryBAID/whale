'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import { useTranslationClient } from '@/app/i18n/client'
import UIShoppingCartMobile from '@/app/order/UIShoppingCartMobile'

export default function OrderMobile({ categories, uploadPrefix }: {
    categories: HydratedCategory[],
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <>
        <div className="p-5 pb-36" aria-label={t('a11y.products')}>
            {categories.map(category => <div className="mb-3" key={category.id}>
                <UICategory category={category} uploadPrefix={uploadPrefix}/>
            </div>)}
        </div>
        <UIShoppingCartMobile uploadPrefix={uploadPrefix}/>
    </>
}
