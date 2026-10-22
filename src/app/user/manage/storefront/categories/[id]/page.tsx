import { recordId } from '@/app/lib/item-editor'
import { notFound } from 'next/navigation'
import { getCategory } from '@/app/lib/ui-manage-actions'
import CategoryViewClient from '@/app/user/manage/storefront/categories/[id]/CategoryViewClient'

export default async function CategoryViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getCategory((recordId(id) ?? notFound()))
    if (object == null) {
        notFound()
    }
    return <CategoryViewClient key={object.id} object={object}/>
}
