import { getMyUser } from '@/app/login/login-actions'
import { Button } from 'flowbite-react'
import Link from 'next/link'
import { serverTranslation } from '@/app/i18n'
import If from '@/app/lib/If'
import OnSiteOrder from '@/app/core-components/OnSiteOrder'

export default async function SimpleNav() {
    const me = await getMyUser()
    const { t } = await serverTranslation('order')

    return <nav className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 lg:px-8
    bg-espresso/95 dark:bg-espresso-900/95 backdrop-blur text-white shadow-[0_1px_0_rgba(255,255,255,0.06)]">
        <a href="#primary-content" className="sr-only">{t('a11y.skip')}</a>
        <Link href="/" className="flex items-center gap-3 mr-auto">
            <img width={40} height={40} src="/assets/logo.png" className="w-9 h-9 rounded-full ring-2 ring-white/20"
                 alt="Whale Logo"/>
            <span className="font-bold text-lg tracking-tight">{t('brand')}</span>
        </Link>

        <If condition={me != null && me.permissions.includes('admin.manage')}>
            <OnSiteOrder/>
            <Link href="/today" className="hidden lg:block">
                <Button pill size="sm" color="warning">{t('today')}</Button>
            </Link>
        </If>
        <If condition={me == null}>
            <Link href="/login">
                <Button pill size="sm" color="warning">{t('login')}</Button>
            </Link>
        </If>
        <If condition={me != null}>
            <Link href="/user" aria-label="User Icon"
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20
                  flex items-center justify-center font-bold transition-colors">
                <span>{me?.name.at(0)}</span>
            </Link>
        </If>
    </nav>
}
