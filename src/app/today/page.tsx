import { getWaitingOrders } from '@/app/lib/order-manage-actions'
import { getMyUser } from '@/app/login/login-actions'
import { redirect } from 'next/navigation'
import WaitingOrdersClient from '@/app/today/WaitingOrdersClient'
import SimpleNav from '@/app/core-components/SimpleNav'

export const dynamic = 'force-dynamic'

export default async function WaitingOrdersBase() {
    const me = await getMyUser()
    if (me == null || !me.permissions.includes('admin.manage')) {
        redirect('/')
    }
    return <>
        <SimpleNav/>
        <div id="primary-content">
            <WaitingOrdersClient init={await getWaitingOrders()}/>
        </div>
    </>
}
