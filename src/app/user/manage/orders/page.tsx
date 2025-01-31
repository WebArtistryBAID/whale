import ManageOrdersClient from '@/app/user/manage/orders/ManageOrdersClient'
import { getOrders } from '@/app/lib/manage-actions'

export default async function ManageOrdersBase() {
    return <ManageOrdersClient init={await getOrders(0)}/>
}
