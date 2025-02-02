import CouponCodeCreateClient from '@/app/user/manage/storefront/coupons/create/CouponCodeCreateClient'
import { getCouponCode } from '@/app/lib/ui-manage-actions'

export default async function CouponCodeCreateBase({ searchParams }: {
    searchParams?: { [_: string]: string | string[] | undefined }
}) {
    if (searchParams?.id != null) {
        return <CouponCodeCreateClient editMode existing={await getCouponCode(searchParams.id as string)}/>
    }
    return <CouponCodeCreateClient/>
}
