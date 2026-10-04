import ManageSettingsClient from '@/app/user/manage/settings/ManageSettingsClient'
import { getConfigValues } from '@/app/lib/settings-actions'
import { requireAdminPage } from '@/app/lib/admin-page'

export const dynamic = 'force-dynamic'

export default async function ManageSettingsBase() {
    await requireAdminPage()
    return <ManageSettingsClient initValues={await getConfigValues()}/>
}
