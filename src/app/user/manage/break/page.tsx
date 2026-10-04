import BreakGameClient from '@/app/user/manage/break/BreakGameClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function BreakBase() {
    await requireAdminPage()
    return <BreakGameClient/>
}
