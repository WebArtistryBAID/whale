import { getOrder } from '@/app/lib/ordering-actions'
import { redirect } from 'next/navigation'
import OrderDetailsClient from '@/app/order/details/[id]/OrderDetailsClient'
import SimpleNav from '@/app/core-components/SimpleNav'
import CookiesBoundary from '@/app/lib/CookiesBoundary'

export default async function OrderDetailsBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const order = await getOrder(parseInt(id as string))
    if (order == null) {
        redirect('/')
    }
    return <div className="bg-coffee-1 dark:bg-yellow-950">
        <SimpleNav/>
        <CookiesBoundary><OrderDetailsClient initialOrder={order} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/></CookiesBoundary>
    </div>
}
