'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'

/**
 * A sticky row of category links that scrolls the menu to the chosen category.
 */
export default function CategoryTabs({ categories, scrollContainerId, sticky = 'top-0' }: {
    categories: HydratedCategory[],
    scrollContainerId?: string,
    sticky?: string
}) {
    function scrollTo(id: number) {
        const target = document.getElementById(`category-${id}`)
        if (target == null) {
            return
        }
        const container = scrollContainerId == null ? null : document.getElementById(scrollContainerId)
        if (container != null) {
            container.scrollTo({ top: target.offsetTop - 56, behavior: 'smooth' })
        } else {
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 116, behavior: 'smooth' })
        }
    }

    return <div className={`sticky ${sticky} z-20 bg-cream/95 dark:bg-espresso-900/95 backdrop-blur-sm
    border-b border-cream-200 dark:border-white/10`}>
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none px-4 lg:px-10">
            {categories.map(category =>
                <button key={category.id} onClick={() => scrollTo(category.id)}
                        className="flex-shrink-0 py-3.5 text-sm font-medium secondary border-b-2 border-transparent -mb-px
                        hover:text-espresso hover:border-espresso dark:hover:text-white dark:hover:border-white transition-colors">
                    {category.name}
                </button>)}
        </div>
    </div>
}
