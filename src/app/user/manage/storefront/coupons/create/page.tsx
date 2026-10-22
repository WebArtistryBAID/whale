import { notFound } from 'next/navigation'
import CouponCodeCreateClient from '@/app/user/manage/storefront/coupons/create/CouponCodeCreateClient'
import { getCouponCode } from '@/app/lib/ui-manage-actions'

export default async function CouponCodeCreateBase({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    if (p?.id != null) {
        if (typeof p.id !== 'string' || !/^[a-zA-Z0-9]+$/.test(p.id)) notFound()
        const existing = await getCouponCode(p.id)
        if (!existing) notFound()
        return <CouponCodeCreateClient key={existing.id} editMode existing={existing}/>
    }
    return <CouponCodeCreateClient/>
}
