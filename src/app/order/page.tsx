import { getAds, getCoreItems } from '@/app/lib/ui-data-actions'
import OrderDesktop from '@/app/order/OrderDesktop'
import OrderMobile from '@/app/order/OrderMobile'
import OrderNags from '@/app/order/OrderNags'
import SimpleNav from '@/app/core-components/SimpleNav'

export default async function OrderBase() {
    const categories = await getCoreItems()
    return <div className="bg-coffee-1 dark:bg-yellow-950">
        <SimpleNav/>
        <OrderNags/>
        <div className="hidden lg:block" id="primary-content">
            <OrderDesktop ads={await getAds()} categories={categories}
                          uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
        </div>
        <div className="lg:hidden" id="primary-content">
            <OrderMobile categories={categories} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
        </div>
    </div>
}
