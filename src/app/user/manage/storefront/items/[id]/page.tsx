import { getCategory, getItemType } from '@/app/lib/ui-manage-actions'
import ItemViewClient from '@/app/user/manage/storefront/items/[id]/ItemViewClient'

export default async function OptionItemViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getItemType(parseInt(id))
    if (object == null) {
        return <div>Error</div>
    }
    return <ItemViewClient object={object} categoryName={(await getCategory(object.categoryId))!.name}
                           uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
