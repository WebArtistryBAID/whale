'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'
import { useTranslationClient } from '@/app/i18n/client'

/**
 * A sticky row of category chips that scrolls the menu to the chosen category.
 */
export default function CategoryTabs({ categories, scrollContainerId, sticky = 'top-0' }: {
    categories: HydratedCategory[],
    scrollContainerId?: string,
    sticky?: string
}) {
    const { t } = useTranslationClient('order')

    function scrollTo(id: number) {
        const target = document.getElementById(`category-${id}`)
        if (target == null) {
            return
        }
        const container = scrollContainerId == null ? null : document.getElementById(scrollContainerId)
        if (container != null) {
            container.scrollTo({ top: target.offsetTop - 64, behavior: 'smooth' })
        } else {
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' })
        }
    }

    return <div className={`sticky ${sticky} z-20 bg-cream/90 dark:bg-espresso-900/90 backdrop-blur`}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 lg:px-8 xl:px-12 py-3">
            <span className="eyebrow mr-2 flex-shrink-0">{t('menu')}</span>
            {categories.map(category =>
                <button key={category.id} onClick={() => scrollTo(category.id)}
                        className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium bg-white dark:bg-white/5
                        border border-cream-200 dark:border-white/10 hover:border-caramel/50 hover:text-caramel
                        transition-colors">
                    {category.name}
                </button>)}
        </div>
    </div>
}
