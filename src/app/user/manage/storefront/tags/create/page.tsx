import { getTag } from '@/app/lib/ui-manage-actions'
import TagCreateClient from '@/app/user/manage/storefront/tags/create/TagCreateClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function TagCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    await requireAdminPage()
    const p = await searchParams
    if (p?.id != null) {
        return <TagCreateClient editMode existing={await getTag(parseInt(p.id as string))}/>
    }
    return <TagCreateClient/>
}
