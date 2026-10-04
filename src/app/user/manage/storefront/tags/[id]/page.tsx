import { getTag, getTagAssociatedItems } from '@/app/lib/ui-manage-actions'
import TagViewClient from '@/app/user/manage/storefront/tags/[id]/TagViewClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function TagViewBase({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage()
    const id = (await params).id
    const object = await getTag(parseInt(id))
    if (object == null) {
        return <div>Error</div>
    }
    return <TagViewClient object={object} items={await getTagAssociatedItems(parseInt(id))}/>
}
