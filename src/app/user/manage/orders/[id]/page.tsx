import ManageOrderClient from '@/app/user/manage/orders/[id]/ManageOrderClient'
import { getOrder } from '@/app/lib/ordering-actions'

export default async function ManageOrderBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const order = await getOrder(parseInt(id))
    if (order == null) {
        return <div>Error</div>
    }
    return <div className="container">
        <ManageOrderClient init={order}/>
    </div>
}
