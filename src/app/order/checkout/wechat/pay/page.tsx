import { getOrder } from '@/app/lib/ordering-actions'
import { redirect } from 'next/navigation'
import { PaymentStatus } from '@/generated/prisma/client'
import OrderPayClient from '@/app/order/checkout/wechat/pay/OrderPayClient'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { getMyTransaction } from '@/app/lib/balance-actions'

export default async function OrderPayBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const id = params!.id as string
    if (params?.type === 'balance') {
        const transaction = await getMyTransaction(parseInt(id))
        if (transaction == null || transaction.values[1] !== 'await') {
            redirect('/user')
        }
        return <CookiesBoundary><OrderPayClient transaction={transaction}/></CookiesBoundary>
    }
    const order = await getOrder(parseInt(id as string))
    if (order == null) {
        redirect('/')
    }
    if (order.paymentStatus !== PaymentStatus.notPaid) {
        redirect('/')
    }
    return <CookiesBoundary><OrderPayClient order={order}/></CookiesBoundary>
}
