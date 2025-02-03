import { getOrder } from '@/app/lib/ordering-actions'
import { redirect } from 'next/navigation'
import { PaymentStatus } from '@prisma/client'
import { getMyUser } from '@/app/login/login-actions'
import OrderPayClient from '@/app/order/checkout/wechat/pay/OrderPayClient'

export default async function OrderPayBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const id = (await searchParams)!.id as string
    const me = await getMyUser()
    const order = await getOrder(parseInt(id as string))
    if (order == null) {
        redirect('/')
    }
    if (order.paymentStatus !== PaymentStatus.notPaid) {
        redirect('/')
    }
    if (order.userId != null && order.userId !== me?.id) {
        redirect('/')
    }
    return <OrderPayClient order={order}/>
}
