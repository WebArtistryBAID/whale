import ManageOrderClient from '@/app/user/manage/orders/[id]/ManageOrderClient'
import { getOrder } from '@/app/lib/ordering-actions'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function ManageOrderBase({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage()
    const id = (await params).id
    const order = await getOrder(parseInt(id))
    if (order == null) {
        return <div>Error</div>
    }
    return <div className="container">
        <ManageOrderClient init={order}/>
    </div>
}
