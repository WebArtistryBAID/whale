import { getOptionItem, getOptionTypes } from '@/app/lib/ui-manage-actions'
import OptionItemCreateClient from '@/app/user/manage/storefront/option-items/create/OptionItemCreateClient'
import { editorRecord } from '@/app/user/manage/storefront/editor/record'
import { recordId } from '@/app/lib/item-editor'
import { notFound, redirect } from 'next/navigation'

export default async function OptionItemCreateBase({ searchParams }: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams ?? {}
    const [existing, types] = await Promise.all([editorRecord(params.id, getOptionItem), getOptionTypes()])
    const requestedType = params.type == null ? null : recordId(params.type)
    if (params.type != null && (requestedType == null || !types.some(type => type.id === requestedType))) notFound()
    const currentType = existing?.typeId ?? requestedType ?? types[0]?.id
    if (currentType == null) redirect('/user/manage/storefront')
    if (!types.some(type => type.id === currentType)) notFound()
    return <OptionItemCreateClient key={existing?.id ?? `new-${currentType}`} editMode={!!existing}
        existing={existing} currentType={currentType} availableTypes={types}/>
}
