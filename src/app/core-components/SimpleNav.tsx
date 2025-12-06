import { getMyUser } from '@/app/login/login-actions'
import { Button, Navbar, NavbarBrand } from 'flowbite-react'
import Link from 'next/link'
import { serverTranslation } from '@/app/i18n'
import If from '@/app/lib/If'
import OnSiteOrder from '@/app/core-components/OnSiteOrder'

export default async function SimpleNav() {
    const me = await getMyUser()
    const { t } = await serverTranslation('order')

    return <Navbar fluid rounded className="bg-coffee-4 dark:bg-yellow-900 text-white">
        <a href="#primary-content" className="sr-only">{t('a11y.skip')}</a>
        <Link href="/">
            <NavbarBrand as="div">
                <img width={32} height={32} src="/assets/logo.png" className="mr-3 w-8 h-8 lg:w-10 lg:h-10"
                     alt="Whale Logo"/>
                <span className="font-bold font-display text-xl hidden lg:block">{t('brand')}</span>
            </NavbarBrand>
        </Link>

        <div className="flex gap-3">
            <If condition={me != null && me.permissions.includes('admin.manage')}>
                <OnSiteOrder/>
                <Link href="/today">
                    <Button pill color="warning" className="hidden lg:block">{t('today')}</Button>
                </Link>
            </If>
            <If condition={me == null}>
                <Link href="/login">
                    <Button pill color="warning">{t('login')}</Button>
                </Link>
            </If>
            <If condition={me != null}>
                <Link href="/user" className="btn-icon-only w-10 h-10" aria-label="User Icon">
                    <span className="font-bold">{me?.name.at(0)}</span>
                </Link>
            </If>
        </div>
    </Navbar>
}
