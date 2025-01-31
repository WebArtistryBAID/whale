import { getMyNotifications } from '@/app/lib/notification-actions'
import UserInboxClient from '@/app/user/inbox/UserInboxClient'

export default async function UserInboxBase() {
    return <UserInboxClient notifications={await getMyNotifications(0)}/>
}
