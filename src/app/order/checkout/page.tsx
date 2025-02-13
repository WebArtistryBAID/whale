import CheckoutClient from '@/app/order/checkout/CheckoutClient'
import { getConfigValueAsBoolean } from '@/app/lib/settings-actions'

export default async function CheckoutBase() {
    return <div id="primary-content">
        <CheckoutClient showPayLater={await getConfigValueAsBoolean('allow-pay-later')}
                        uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
    </div>
}
