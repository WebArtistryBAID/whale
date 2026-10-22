import { recordId } from '@/app/lib/item-editor'
import { notFound } from 'next/navigation'
import { getTag, getTagAssociatedItems } from '@/app/lib/ui-manage-actions'
import TagViewClient from '@/app/user/manage/storefront/tags/[id]/TagViewClient'

export default async function TagViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getTag((recordId(id) ?? notFound()))
    if (object == null) {
        notFound()
    }
    return <TagViewClient key={object.id} object={object} items={await getTagAssociatedItems((recordId(id) ?? notFound()))}/>
}
