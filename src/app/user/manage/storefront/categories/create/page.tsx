import { getCategory } from '@/app/lib/ui-manage-actions'
import CategoryCreateClient from '@/app/user/manage/storefront/categories/create/CategoryCreateClient'

export default async function CategoryCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    if (p?.id != null) {
        return <CategoryCreateClient editMode existing={await getCategory(parseInt(p.id as string))}/>
    }
    return <CategoryCreateClient/>
}
