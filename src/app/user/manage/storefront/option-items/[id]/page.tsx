import { recordId } from '@/app/lib/item-editor'
import { notFound } from 'next/navigation'
import { getOptionItem, getOptionType } from '@/app/lib/ui-manage-actions'
import OptionItemViewClient from '@/app/user/manage/storefront/option-items/[id]/OptionItemViewClient'

export default async function OptionItemViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getOptionItem((recordId(id) ?? notFound()))
    if (object == null) {
        notFound()
    }
    const type = await getOptionType(object.typeId)
    if (!type) notFound()
    return <OptionItemViewClient key={object.id} object={object} typeName={type.name}/>
}
