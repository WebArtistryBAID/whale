import { getCategories, getItemType, getOptionTypesHydrated, getTags } from '@/app/lib/ui-manage-actions'
import ItemCreateClient from '@/app/user/manage/storefront/items/create/ItemCreateClient'
import { editorRecord } from '@/app/user/manage/storefront/editor/record'
import { recordId } from '@/app/lib/item-editor'
import { notFound, redirect } from 'next/navigation'

export default async function ItemCreateBase({ searchParams }: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams ?? {}
    const [existing, categories, tags, options] = await Promise.all([
        editorRecord(params.id, getItemType), getCategories(), getTags(), getOptionTypesHydrated()
    ])
    const requestedCategory = params.category == null ? null : recordId(params.category)
    if (params.category != null && (requestedCategory == null || !categories.some(category => category.id === requestedCategory))) notFound()
    const currentCategory = existing?.categoryId ?? requestedCategory ?? categories[0]?.id
    if (currentCategory == null) redirect('/user/manage/storefront')
    if (!categories.some(category => category.id === currentCategory)) notFound()
    return <ItemCreateClient key={existing?.id ?? `new-${currentCategory}`} existing={existing}
        currentCategory={currentCategory} availableCategories={categories} availableTags={tags}
        availableOptions={options} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
