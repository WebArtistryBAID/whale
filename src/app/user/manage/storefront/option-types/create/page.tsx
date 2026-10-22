import { editorRecord } from '@/app/user/manage/storefront/editor/record'
import { getOptionType } from '@/app/lib/ui-manage-actions'
import OptionTypeCreateClient from '@/app/user/manage/storefront/option-types/create/OptionTypeCreateClient'

export default async function OptionTypeCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    if (p?.id != null) {
        return <OptionTypeCreateClient key={String(p?.id)} editMode existing={await editorRecord(p?.id, getOptionType)}/>
    }
    return <OptionTypeCreateClient/>
}
