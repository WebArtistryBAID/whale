import CookiesBoundary from '@/app/lib/CookiesBoundary'
import StripePollPage from '@/app/order/checkout/stripe/[id]/poll/StripePollPage'

export default function StripePollPageWrapper() {
    return <CookiesBoundary><StripePollPage/></CookiesBoundary>
}
