import { getUser } from '@/app/login/login-actions'
import ManageUserClient from '@/app/user/manage/users/[id]/ManageUserClient'
import { getUserOrders } from '@/app/lib/order-manage-actions'

export default async function StudioUserBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const user = await getUser(parseInt(id))
    if (user == null) {
        return <div>Error</div>
    }
    return <ManageUserClient user={user} init={await getUserOrders(0, user.id)}/>
}
