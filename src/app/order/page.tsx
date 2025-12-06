import { getAds, getCoreItems } from '@/app/lib/ui-data-actions'
import OrderDesktop from '@/app/order/OrderDesktop'
import OrderMobile from '@/app/order/OrderMobile'
import OrderNags from '@/app/order/OrderNags'
import SimpleNav from '@/app/core-components/SimpleNav'
import CookiesBoundary from '@/app/lib/CookiesBoundary'

export default async function OrderBase() {
    const categories = await getCoreItems()
    return <div className="bg-coffee-1 dark:bg-yellow-950">
        <SimpleNav/>
        <CookiesBoundary>
            <OrderNags/>
        </CookiesBoundary>
        <div className="hidden lg:block" id="primary-content">
            <CookiesBoundary><OrderDesktop ads={await getAds()} categories={categories}
                                           uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/></CookiesBoundary>
        </div>
        <div className="lg:hidden" id="primary-content">
            <CookiesBoundary><OrderMobile categories={categories} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/></CookiesBoundary>
        </div>
    </div>
}
