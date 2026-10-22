import { recordId } from '@/app/lib/item-editor'
import { notFound } from 'next/navigation'
import { getOptionType, getOptionTypeAssociatedItems } from '@/app/lib/ui-manage-actions'
import OptionTypeViewClient from '@/app/user/manage/storefront/option-types/[id]/OptionTypeViewClient'

export default async function OptionTypeViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getOptionType((recordId(id) ?? notFound()))
    if (object == null) {
        notFound()
    }
    return <OptionTypeViewClient key={object.id} object={object} items={await getOptionTypeAssociatedItems((recordId(id) ?? notFound()))}/>
}
