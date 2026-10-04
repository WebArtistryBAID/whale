import { getOptionItem, getOptionTypes } from '@/app/lib/ui-manage-actions'
import OptionItemCreateClient from '@/app/user/manage/storefront/option-items/create/OptionItemCreateClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function OptionItemCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    await requireAdminPage()
    const p = await searchParams
    if (p!.id != null) {
        return <OptionItemCreateClient editMode existing={await getOptionItem(parseInt(p!.id as string))}
                                       currentType={parseInt(p!.type as string)}
                                       availableTypes={await getOptionTypes()}/>
    }
    return <OptionItemCreateClient currentType={parseInt(p!.type as string)}
                                   availableTypes={await getOptionTypes()}/>
}
