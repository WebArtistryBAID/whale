import { getOptionType } from '@/app/lib/ui-manage-actions'
import OptionTypeCreateClient from '@/app/user/manage/storefront/option-types/create/OptionTypeCreateClient'

export default async function OptionTypeCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    if (p?.id != null) {
        return <OptionTypeCreateClient editMode existing={await getOptionType(parseInt(p.id as string))}/>
    }
    return <OptionTypeCreateClient/>
}
