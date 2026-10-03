'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import UIShoppingCartDesktop from '@/app/order/UIShoppingCartDesktop'
import { useTranslationClient } from '@/app/i18n/client'
import { Ad } from '@/generated/prisma/browser'
import UIAdsClient from '@/app/core-components/UIAdsClient'
import CategoryTabs from '@/app/order/CategoryTabs'

export default function OrderDesktop({ categories, ads, uploadPrefix }: {
    categories: HydratedCategory[],
    ads: Ad[]
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')

    return <div className="flex w-full h-[calc(100dvh-4rem)]">
        <div id="menu-scroll" className="flex-1 h-full overflow-y-auto relative" aria-label={t('a11y.products')}>
            <CategoryTabs categories={categories} scrollContainerId="menu-scroll"/>
            <div className="px-8 xl:px-12 pb-16 max-w-5xl">
                {categories.map(category => <UICategory key={category.id} category={category}
                                                         uploadPrefix={uploadPrefix}/>)}
            </div>
        </div>
        <aside className="w-[26rem] xl:w-[30rem] h-full p-6 flex flex-col gap-6 border-l border-cream-200 dark:border-white/5">
            {ads.length > 0 ? <div className="h-56 flex-shrink-0">
                <UIAdsClient ads={ads} uploadPrefix={uploadPrefix}/>
            </div> : null}
            <div className="flex-1 min-h-0">
                <UIShoppingCartDesktop uploadPrefix={uploadPrefix}/>
            </div>
        </aside>
    </div>
}
