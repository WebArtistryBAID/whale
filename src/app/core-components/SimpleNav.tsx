import { getMyUser } from '@/app/login/login-actions'
import Link from 'next/link'
import { serverTranslation } from '@/app/i18n'
import If from '@/app/lib/If'
import OnSiteOrder from '@/app/core-components/OnSiteOrder'

export default async function SimpleNav() {
    const me = await getMyUser()
    const { t } = await serverTranslation('order')

    return <nav className="sticky top-0 z-40 h-16 flex items-center gap-2 lg:gap-3 px-3 lg:px-6 bg-paper border-b-toon border-ink">
        <a href="#primary-content" className="sr-only">{t('a11y.skip')}</a>
        <Link href="/" className="flex items-center gap-2 mr-auto group">
            <img width={40} height={40} src="/assets/logo.png" alt="Whale Logo"
                 className="w-10 h-10 rounded-full bg-white border-toon border-ink group-hover:rotate-[-10deg] transition-transform"/>
            <span className="font-toon text-xl lg:text-2xl">{t('brand')}</span>
        </Link>

        <If condition={me != null && me.permissions.includes('admin.manage')}>
            <OnSiteOrder/>
            <Link href="/today" className="hidden lg:flex items-center h-10 px-4 rounded-full font-toon border-toon border-ink
            bg-paper shadow-toon-sm hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform">
                {t('today')}
            </Link>
        </If>
        <If condition={me == null}>
            <Link prefetch={false} href="/login" className="flex items-center h-10 px-5 rounded-full font-toon border-toon border-ink bg-butter
            text-[#4a2511] shadow-toon-sm hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform">
                {t('login')}
            </Link>
        </If>
        <If condition={me != null}>
            <Link href="/user" aria-label="User Icon"
                  className="h-10 w-10 rounded-full border-toon border-ink bg-whale text-[#163746] font-toon text-lg
                  flex items-center justify-center shadow-toon-sm hover:-translate-y-px transition-transform">
                <span>{me?.name.at(0)}</span>
            </Link>
        </If>
    </nav>
}
