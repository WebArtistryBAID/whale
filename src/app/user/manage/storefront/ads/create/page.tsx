import { getAd } from '@/app/lib/ui-manage-actions'
import AdCreateClient from '@/app/user/manage/storefront/ads/create/AdCreateClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function AdCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    await requireAdminPage()
    const p = await searchParams
    if (p?.id != null) {
        return <AdCreateClient uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`} editMode
                               existing={await getAd(parseInt(p.id as string))}/>
    }
    return <AdCreateClient uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
