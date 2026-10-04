import { getAd } from '@/app/lib/ui-manage-actions'
import AdViewClient from '@/app/user/manage/storefront/ads/[id]/AdViewClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function AdViewBase({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage()
    const id = (await params).id
    const object = await getAd(parseInt(id))
    if (object == null) {
        return <div>Error</div>
    }
    return <AdViewClient object={object} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
