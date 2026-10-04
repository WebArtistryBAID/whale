import ManageStatsClient from '@/app/user/manage/stats/ManageStatsClient'
import { getStats } from '@/app/lib/stats-actions'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function ManageStatsBase() {
    await requireAdminPage()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return <ManageStatsClient stats={await getStats('week', today)}/>
}
