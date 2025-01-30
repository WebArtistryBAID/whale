import { getCoreItems } from '@/app/lib/ui-data-actions'
import OrderDesktop from '@/app/order/OrderDesktop'
import OrderMobile from '@/app/order/OrderMobile'
import CurrentOrderBubble from '@/app/order/CurrentOrderBubble'

export default async function OrderBase() {
    const categories = await getCoreItems()
    return <>
        <div className="hidden lg:block" id="primary-content">
            <OrderDesktop categories={categories} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
        </div>
        <div className="lg:hidden" id="primary-content">
            <OrderMobile categories={categories} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
        </div>

        <CurrentOrderBubble/>
    </>
}
