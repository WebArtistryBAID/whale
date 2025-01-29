import CheckoutDesktop from '@/app/order/checkout/CheckoutDesktop'

export default async function CheckoutBase() {
    return <>
        <div className="hidden lg:block" id="primary-content">
            <CheckoutDesktop uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
        </div>
        <div className="lg:hidden" id="primary-content">
        </div>
    </>
}
