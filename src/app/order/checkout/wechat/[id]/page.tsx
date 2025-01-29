import { getOrder } from '@/app/lib/ordering-actions'
import { redirect } from 'next/navigation'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { getMyUser } from '@/app/login/login-actions'
import OrderPayClient from '@/app/order/checkout/wechat/[id]/OrderPayClient'

export default async function OrderPayBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const me = await getMyUser()
    const order = await getOrder(parseInt(id as string))
    if (order == null) {
        redirect('/')
    }
    if (order.paymentStatus !== PaymentStatus.notPaid || order.status === OrderStatus.done) {
        redirect('/')
    }
    if (order.userId != null && order.userId !== me?.id) {
        redirect('/')
    }
    return <OrderPayClient order={order}/>
}
