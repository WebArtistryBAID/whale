import UIAdsClient from '@/app/core-components/UIAdsClient'
import { getAds } from '@/app/lib/ui-data-actions'

export default async function UIAds() {
    return <UIAdsClient ads={await getAds()} uploadPrefix={`/${process.env.UPLOAD_SERVE_PATH}/`}/>
}
