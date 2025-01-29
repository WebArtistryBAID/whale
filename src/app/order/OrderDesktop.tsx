'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import UIShoppingCart from '@/app/order/UIShoppingCart'
import { useTranslationClient } from '@/app/i18n/client'

export default function OrderDesktop({ categories, uploadPrefix }: {
    categories: HydratedCategory[],
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <div className="flex w-screen h-[93vh]">
        <div className="w-1/2 p-8 xl:p-16 h-full overflow-y-auto relative" aria-label={t('a11y.products')}>
            {categories.map(category => <UICategory category={category} key={category.id}
                                                    uploadPrefix={uploadPrefix}/>)}
        </div>
        <div className="w-1/2 p-8 xl:p-16 h-full border-l border-yellow-100 dark:border-yellow-800">
            <div className="h-full flex flex-col gap-3">
                <div className="h-1/2">

                </div>
                <div className="h-1/2">
                    <UIShoppingCart uploadPrefix={uploadPrefix}/>
                </div>
            </div>
        </div>
    </div>
}
