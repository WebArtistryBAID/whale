import ManageOrdersClient from '@/app/user/manage/orders/ManageOrdersClient'
import { getOrders } from '@/app/lib/order-manage-actions'
import { requireAdminPage } from '@/app/lib/admin-page'

export const dynamic = 'force-dynamic'

export default async function ManageOrdersBase() {
    await requireAdminPage()
    return <ManageOrdersClient init={await getOrders(0)}/>
}
