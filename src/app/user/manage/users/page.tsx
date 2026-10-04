import { getUsers } from '@/app/login/login-actions'
import ManageUsersClient from '@/app/user/manage/users/ManageUsersClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function ManageUsersBase() {
    await requireAdminPage()
    return <ManageUsersClient users={await getUsers(0, '')}/>
}
