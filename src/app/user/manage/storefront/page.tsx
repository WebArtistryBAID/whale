import ManageStorefrontClient from '@/app/user/manage/storefront/ManageStorefrontClient'
import { getAds, getCategories, getCouponCodes, getOptionTypes, getTags } from '@/app/lib/ui-manage-actions'


export default async function ManageStorefrontBase() {
    return <ManageStorefrontClient categories={await getCategories()} optionTypes={await getOptionTypes()}
                                   couponCodes={await getCouponCodes()} tags={await getTags()} ads={await getAds()}/>
}
