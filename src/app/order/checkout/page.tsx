import CheckoutClient from '@/app/order/checkout/CheckoutClient'
import { getConfigValueAsBoolean } from '@/app/lib/settings-actions'
import SimpleNav from '@/app/core-components/SimpleNav'
import CookiesBoundary from '@/app/lib/CookiesBoundary'

export default async function CheckoutBase() {
    return <div className="bg-coffee-1 dark:bg-yellow-950">
        <SimpleNav/>
        <div id="primary-content">
            <CookiesBoundary>
                <CheckoutClient showPayLater={await getConfigValueAsBoolean('allow-pay-later')}
                                uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
            </CookiesBoundary>
        </div>
    </div>
}
