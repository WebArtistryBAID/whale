'use client'

import { HydratedCategory } from '@/app/lib/ui-data-actions'

/**
 * Category buttons that jump to each category in the menu.
 */
export default function CategoryChips({ categories, className = '' }: {
    categories: HydratedCategory[],
    className?: string
}) {
    return <div className={`flex gap-2.5 overflow-x-auto scrollbar-none py-1 px-1 ${className}`}>
        {categories.map((category, index) =>
            <button key={category.id}
                    onClick={() => document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                    className={`flex-shrink-0 rounded-full px-4 h-9 font-toon text-base border-toon border-ink shadow-toon-sm
                    transition-transform hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                    ${[ 'bg-butter text-[#4a2511]', 'bg-whale text-[#163746]', 'bg-blush text-[#5a2020]', 'bg-mint text-[#1f3d2a]' ][index % 4]}`}>
                {category.name}
            </button>)}
    </div>
}
