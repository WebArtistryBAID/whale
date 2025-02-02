import { getCategory } from '@/app/lib/ui-manage-actions'
import CategoryViewClient from '@/app/user/manage/storefront/categories/[id]/CategoryViewClient'

export default async function CategoryViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getCategory(parseInt(id))
    if (object == null) {
        return <div>Error</div>
    }
    return <CategoryViewClient object={object}/>
}
