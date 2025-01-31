import UserOrdersClient from '@/app/user/orders/UserOrdersClient'
import { getMyOrders } from '@/app/lib/user-actions'

export default async function UserOrdersBase() {
    return <UserOrdersClient init={await getMyOrders(0)}/>
}
