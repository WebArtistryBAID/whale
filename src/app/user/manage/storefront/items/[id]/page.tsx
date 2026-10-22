import { getCategory, getItemType } from '@/app/lib/ui-manage-actions'
import ItemViewClient from '@/app/user/manage/storefront/items/[id]/ItemViewClient'
import { editorRecord } from '@/app/user/manage/storefront/editor/record'
import { notFound } from 'next/navigation'

export default async function ItemViewBase({ params }: { params: Promise<{ id: string }> }) {
    const item = await editorRecord((await params).id, getItemType)
    if (!item) notFound()
    const category = await getCategory(item.categoryId)
    if (!category) notFound()
    return <ItemViewClient key={item.id} object={item} categoryName={category.name} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
