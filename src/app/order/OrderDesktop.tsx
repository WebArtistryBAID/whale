'use client'

import {HydratedCategory} from '@/app/lib/ui-data-actions'
import UICategory from '@/app/order/UICategory'
import {useShoppingCart} from '@/app/lib/shopping-cart'

export default function OrderDesktop({categories, uploadPrefix}: {
    categories: HydratedCategory[],
    uploadPrefix: string
}) {
    const shoppingCart = useShoppingCart()

    return <div className="flex w-screen h-[93vh]">
        <div className="w-1/2 p-8 xl:p-16 h-full overflow-y-auto relative">
            {categories.map(category => <UICategory category={category} key={category.id}
                                                    uploadPrefix={uploadPrefix}/>)}
        </div>
        <div className="w-1/2 p-8 xl:p-16 h-full border-l border-yellow-100 dark:border-yellow-800">
            {JSON.stringify(shoppingCart.items)}
        </div>
    </div>
}
