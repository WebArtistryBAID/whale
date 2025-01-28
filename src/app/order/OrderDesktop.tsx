'use client'

import {HydratedCategory} from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'

export default function OrderDesktop({categories, uploadPrefix}: {
    categories: HydratedCategory[],
    uploadPrefix: string
}) {
    return <div className="flex w-screen h-[93vh]">
        <div className="w-1/2 p-8 xl:p-16 h-full overflow-y-auto relative">
            {categories.map(category => <UICategory category={category} key={category.id}
                                                    uploadPrefix={uploadPrefix}/>)}
        </div>
        <div className="w-1/2 p-8 xl:p-16 h-full border-l border-gray-50 dark:border-yellow-800">

        </div>
    </div>
}
