import ManageSettingsClient from '@/app/user/manage/settings/ManageSettingsClient'
import { getConfigValues } from '@/app/lib/settings-actions'

export const dynamic = 'force-dynamic'

export default async function ManageSettingsBase() {
    return <ManageSettingsClient initValues={await getConfigValues()}/>
}
