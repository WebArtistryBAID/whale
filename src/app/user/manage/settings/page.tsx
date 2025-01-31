import ManageSettingsClient from '@/app/user/manage/settings/ManageSettingsClient'
import { getConfigValues } from '@/app/lib/settings-actions'

export default async function ManageSettingsBase() {
    return <ManageSettingsClient initValues={await getConfigValues()}/>
}
