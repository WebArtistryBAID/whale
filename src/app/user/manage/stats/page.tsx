import ManageStatsClient from '@/app/user/manage/stats/ManageStatsClient'
import { getStats } from '@/app/lib/stats-actions'

export default async function ManageStatsBase() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return <ManageStatsClient stats={await getStats('week', today)}/>
}
