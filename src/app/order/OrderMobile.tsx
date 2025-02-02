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
            {categories.map(category => <UICategory category={category} key={category.id}
                                                    uploadPrefix={uploadPrefix}/>)}
        </div>
        <UIShoppingCartMobile uploadPrefix={uploadPrefix}/>
    </>
}
