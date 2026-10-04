import ManageLogsClient from '@/app/user/manage/logs/ManageLogsClient'
import { getAuditLogs } from '@/app/lib/order-manage-actions'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function UserLogsBase() {
    await requireAdminPage()
    return <ManageLogsClient init={await getAuditLogs(0)}/>
}
