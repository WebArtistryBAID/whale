import { getMyUser } from '@/app/login/login-actions'
import Link from 'next/link'
import { serverTranslation } from '@/app/i18n'
import If from '@/app/lib/If'
import OnSiteOrder from '@/app/core-components/OnSiteOrder'

export default async function SimpleNav() {
    const me = await getMyUser()
    const { t } = await serverTranslation('order')

    return <nav className="sticky top-0 z-40 h-16 flex items-center gap-2 px-4 lg:px-8
    bg-cream/95 dark:bg-espresso-900/95 backdrop-blur-sm border-b border-cream-200 dark:border-white/10">
        <a href="#primary-content" className="sr-only">{t('a11y.skip')}</a>
        <Link href="/" className="flex items-center gap-2.5 mr-auto">
            <img width={40} height={40} src="/assets/logo.png" className="w-10 h-10 -my-1" alt="Whale Logo"/>
            <span className="font-bold text-lg">{t('brand')}</span>
        </Link>

        <If condition={me != null && me.permissions.includes('admin.manage')}>
            <OnSiteOrder/>
            <Link href="/today" className="hidden lg:flex items-center h-9 px-3 rounded-md text-sm font-medium
            hover:bg-cream-100 dark:hover:bg-white/5 transition-colors">{t('today')}</Link>
        </If>
        <If condition={me == null}>
            <Link href="/login" className="flex items-center h-9 px-4 rounded-md text-sm font-medium
            bg-espresso text-cream hover:bg-black dark:bg-cream dark:text-espresso transition-colors">{t('login')}</Link>
        </If>
        <If condition={me != null}>
            <Link href="/user" aria-label="User Icon"
                  className="ml-1 h-9 w-9 rounded-full border border-cream-300 dark:border-white/20 flex items-center
                  justify-center text-sm font-bold hover:border-espresso dark:hover:border-white transition-colors">
                <span>{me?.name.at(0)}</span>
            </Link>
        </If>
    </nav>
}
