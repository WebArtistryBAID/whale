import { getOptionType, getOptionTypeAssociatedItems } from '@/app/lib/ui-manage-actions'
import OptionTypeViewClient from '@/app/user/manage/storefront/option-types/[id]/OptionTypeViewClient'

export default async function OptionTypeViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getOptionType(parseInt(id))
    if (object == null) {
        return <div>Error</div>
    }
    return <OptionTypeViewClient object={object} items={await getOptionTypeAssociatedItems(parseInt(id))}/>
}
