import UserDashboardClient from '@/app/user/dashboard/UserDashboardClient'
import { requireUser } from '@/app/login/login-actions'

export default async function UserDashboardBase() {
    return <UserDashboardClient user={await requireUser()}/>
}
