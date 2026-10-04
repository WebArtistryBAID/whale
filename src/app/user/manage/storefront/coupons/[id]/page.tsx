import { getCouponCode } from '@/app/lib/ui-manage-actions'
import CouponCodeViewClient from '@/app/user/manage/storefront/coupons/[id]/CouponCodeViewClient'
import { requireAdminPage } from '@/app/lib/admin-page'

export default async function CouponCodeViewBase({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage()
    const id = (await params).id
    const coupon = await getCouponCode(id)
    if (coupon == null) {
        return <div>Error</div>
    }
    return <CouponCodeViewClient object={coupon}/>
}
