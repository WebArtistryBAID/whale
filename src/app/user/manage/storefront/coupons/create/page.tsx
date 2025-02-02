import CouponCodeCreateClient from '@/app/user/manage/storefront/coupons/create/CouponCodeCreateClient'
import { getCouponCode } from '@/app/lib/ui-manage-actions'

export default async function CouponCodeCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    if (p?.id != null) {
        return <CouponCodeCreateClient editMode existing={await getCouponCode(p.id as string)}/>
    }
    return <CouponCodeCreateClient/>
}
