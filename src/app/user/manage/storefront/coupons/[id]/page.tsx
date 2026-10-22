import { notFound } from 'next/navigation'
import { getCouponCode } from '@/app/lib/ui-manage-actions'
import CouponCodeViewClient from '@/app/user/manage/storefront/coupons/[id]/CouponCodeViewClient'

export default async function CouponCodeViewBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const coupon = await getCouponCode(id)
    if (coupon == null) {
        notFound()
    }
    return <CouponCodeViewClient key={coupon.id} object={coupon}/>
}
