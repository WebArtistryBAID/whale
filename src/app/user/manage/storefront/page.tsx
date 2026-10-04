import ManageStorefrontClient from '@/app/user/manage/storefront/ManageStorefrontClient'
import { getAds, getCategories, getCouponCodes, getOptionTypes, getTags } from '@/app/lib/ui-manage-actions'
import { requireAdminPage } from '@/app/lib/admin-page'


export default async function ManageStorefrontBase() {
    await requireAdminPage()
    return <ManageStorefrontClient categories={await getCategories()} optionTypes={await getOptionTypes()}
                                   couponCodes={await getCouponCodes()} tags={await getTags()} ads={await getAds()}/>
}
