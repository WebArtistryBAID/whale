import { getCategories, getItemType, getOptionTypesHydrated, getTags } from '@/app/lib/ui-manage-actions'
import ItemCreateClient from '@/app/user/manage/storefront/items/create/ItemCreateClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function ItemCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    await requireAdminPage()
    const p = await searchParams
    if (p!.id != null) {
        return <ItemCreateClient editMode existing={await getItemType(parseInt(p!.id as string))}
                                 currentCategory={parseInt(p!.category as string)}
                                 availableCategories={await getCategories()}
                                 availableTags={await getTags()}
                                 availableOptions={await getOptionTypesHydrated()}
                                 uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
    }
    return <ItemCreateClient currentCategory={parseInt(p!.category as string)}
                             availableCategories={await getCategories()}
                             availableTags={await getTags()}
                             availableOptions={await getOptionTypesHydrated()}
                             uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
