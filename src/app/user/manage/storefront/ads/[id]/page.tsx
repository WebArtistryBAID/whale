import { recordId } from '@/app/lib/item-editor'
import { notFound } from 'next/navigation'
import { getAd } from '@/app/lib/ui-manage-actions'
import AdViewClient from '@/app/user/manage/storefront/ads/[id]/AdViewClient'

export default async function AdViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const object = await getAd((recordId(id) ?? notFound()))
    if (object == null) {
        notFound()
    }
    return <AdViewClient key={object.id} object={object} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
