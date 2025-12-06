'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import UIShoppingCartDesktop from '@/app/order/UIShoppingCartDesktop'
import { useTranslationClient } from '@/app/i18n/client'
import { Ad } from '@/generated/prisma/browser'
import UIAdsClient from '@/app/core-components/UIAdsClient'

export default function OrderDesktop({ categories, ads, uploadPrefix }: {
    categories: HydratedCategory[],
    ads: Ad[]
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <div className="flex w-screen h-[93vh]">
        <div className="w-1/2 p-8 xl:p-16 h-full overflow-y-auto relative" aria-label={t('a11y.products')}>
            {categories.map(category => <UICategory category={category} key={category.id}
                                                    uploadPrefix={uploadPrefix}/>)}
        </div>
        <div className="w-1/2 p-8 xl:p-16 h-full border-l border-amber-100 dark:border-amber-800">
            <div className="h-full flex flex-col gap-8">
                <div className="h-1/2">
                    <UIAdsClient ads={ads} uploadPrefix={uploadPrefix}/>
                </div>
                <div className="h-1/2">
                    <UIShoppingCartDesktop uploadPrefix={uploadPrefix}/>
                </div>
            </div>
        </div>
    </div>
}
