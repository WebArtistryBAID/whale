import ManageLogsClient from '@/app/user/manage/logs/ManageLogsClient'
import { getAuditLogs } from '@/app/lib/order-manage-actions'

export default async function UserLogsBase() {
    return <ManageLogsClient init={await getAuditLogs(0)}/>
}
