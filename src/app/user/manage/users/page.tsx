import { getUsers } from '@/app/login/login-actions'
import ManageUsersClient from '@/app/user/manage/users/ManageUsersClient'

export default async function ManageUsersBase() {
    return <ManageUsersClient users={await getUsers(0, '')}/>
}
