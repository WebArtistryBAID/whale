import { getOrder } from '@/app/lib/ordering-actions'
import { redirect } from 'next/navigation'
import { PaymentStatus } from '@/generated/prisma/client'
import OrderPayClient from '@/app/order/checkout/wechat/pay/OrderPayClient'
import CookiesBoundary from '@/app/lib/CookiesBoundary'

export default async function OrderPayBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const id = (await searchParams)!.id as string
    const order = await getOrder(parseInt(id as string))
    if (order == null) {
        redirect('/')
    }
    if (order.paymentStatus !== PaymentStatus.notPaid) {
        redirect('/')
    }
    return <CookiesBoundary><OrderPayClient order={order}/></CookiesBoundary>
}
