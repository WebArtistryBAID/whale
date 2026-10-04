'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import UIShoppingCartDesktop from '@/app/order/UIShoppingCartDesktop'
import { useTranslationClient } from '@/app/i18n/client'
import { Ad } from '@/generated/prisma/browser'
import UIAdsClient from '@/app/core-components/UIAdsClient'
import CategoryChips from '@/app/order/CategoryChips'

export default function OrderDesktop({ categories, ads, uploadPrefix }: {
    categories: HydratedCategory[],
    ads: Ad[]
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <div className="flex w-full h-[calc(100dvh-4rem)]">
        <div className="w-1/2 h-full overflow-y-auto relative" aria-label={t('a11y.products')}>
            <div className="sticky top-0 z-20 px-8 xl:px-14 py-4 bg-cream/95 border-b-2 border-dashed border-ink/20">
                <CategoryChips categories={categories}/>
            </div>
            <div className="px-8 xl:px-14 py-8 flex flex-col gap-12">
                {categories.map(category => <UICategory key={category.id} category={category} uploadPrefix={uploadPrefix}/>)}
            </div>
        </div>
        <div className="w-1/2 h-full p-8 xl:p-12 border-l-toon border-ink flex flex-col gap-8">
            {ads.length > 0 ? <div className="h-[40%] flex-shrink-0">
                <UIAdsClient ads={ads} uploadPrefix={uploadPrefix}/>
            </div> : null}
            <div className="flex-1 min-h-0">
                <UIShoppingCartDesktop uploadPrefix={uploadPrefix}/>
            </div>
        </div>
    </div>
}
