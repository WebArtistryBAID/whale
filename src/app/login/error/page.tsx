import CookiesBoundary from '@/app/lib/CookiesBoundary'
import PageLoginOnboarding from '@/app/login/error/PageLoginOnboarding'

export default function LoginOnboarding() {
    return <CookiesBoundary><PageLoginOnboarding/></CookiesBoundary>
}
