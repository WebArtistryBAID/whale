import { getMyAuditLogs } from '@/app/lib/user-actions'
import UserLogsClient from '@/app/user/logs/UserLogsClient'

export default async function UserLogsBase() {
    return <UserLogsClient init={await getMyAuditLogs(0)}/>
}
