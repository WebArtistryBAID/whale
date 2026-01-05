import CheckoutClient from '@/app/order/checkout/CheckoutClient'
import { getConfigValueAsBoolean } from '@/app/lib/settings-actions'
import SimpleNav from '@/app/core-components/SimpleNav'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { getOrder } from '@/app/lib/ordering-actions'
import { PaymentStatus } from '@/generated/prisma/client'
import { getMyTransaction } from '@/app/lib/balance-actions'

export default async function CheckoutBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const orderId = params?.order
    const rechargeId = params?.recharge

    const existingOrder = orderId == null ? null : await getOrder(parseInt(orderId as string))
    const transaction = rechargeId == null ? null : await getMyTransaction(parseInt(rechargeId as string))

    return <div className="bg-coffee-1 dark:bg-yellow-950">
        <SimpleNav/>
        <div id="primary-content">
            <CookiesBoundary>
                <CheckoutClient showPayLater={await getConfigValueAsBoolean('allow-pay-later')}
                                existingOrder={existingOrder?.paymentStatus === PaymentStatus.notPaid ? existingOrder : null}
                                rechargeTransaction={transaction?.values[1] === 'await' ? transaction : null}
                                uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
            </CookiesBoundary>
        </div>
    </div>
}
