import ManageOrdersClient from '@/app/user/manage/orders/ManageOrdersClient'
import { getOrders } from '@/app/lib/order-manage-actions'

export const dynamic = 'force-dynamic'

export default async function ManageOrdersBase() {
    return <ManageOrdersClient init={await getOrders(0)}/>
}
