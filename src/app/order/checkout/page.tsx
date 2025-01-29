import CheckoutClient from '@/app/order/checkout/CheckoutClient'

export default async function CheckoutBase() {
    return <div id="primary-content">
        <CheckoutClient uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
    </div>
}
