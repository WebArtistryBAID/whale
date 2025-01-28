import {getCoreItems} from '@/app/lib/ui-data-actions'
import OrderDesktop from '@/app/order/OrderDesktop'
import OrderMobile from '@/app/order/OrderMobile'

export default async function OrderBase() {
    const categories = await getCoreItems()
    return <>
        <div className="hidden lg:block">
            <OrderDesktop categories={categories}/>
        </div>
        <div className="lg:hidden">
            <OrderMobile categories={categories}/>
        </div>
    </>
}
