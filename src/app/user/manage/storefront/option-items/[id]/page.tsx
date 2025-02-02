import { getOptionItem, getOptionType } from '@/app/lib/ui-manage-actions'
import OptionItemViewClient from '@/app/user/manage/storefront/option-items/[id]/OptionItemViewClient'

export default async function OptionItemViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getOptionItem(parseInt(id))
    if (object == null) {
        return <div>Error</div>
    }
    return <OptionItemViewClient object={object} typeName={(await getOptionType(object.typeId))!.name}/>
}
