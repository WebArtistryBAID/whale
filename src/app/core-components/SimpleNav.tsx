import { getMyUser } from '@/app/login/login-actions'
import { Button, Navbar, NavbarBrand } from 'flowbite-react'
import Link from 'next/link'
import { serverTranslation } from '@/app/i18n'
import If from '@/app/lib/If'
import OnSiteOrder from '@/app/core-components/OnSiteOrder'

export default async function SimpleNav() {
    const me = await getMyUser()
    const { t } = await serverTranslation('order')

    return <Navbar fluid rounded className="bg-yellow-100 dark:bg-yellow-900">
        <a href="#primary-content" className="sr-only">{t('a11y.skip')}</a>
        <NavbarBrand as={Link} href="/">
            <img width={32} height={32} src="/assets/logo.png" className="mr-3 w-8 h-8 lg:w-10 lg:h-10"
                 alt="Whale Logo"/>
            <span className="font-bold font-display text-xl hidden lg:block">{t('brand')}</span>
        </NavbarBrand>

        <div className="flex gap-3">
            <If condition={me != null && me.permissions.includes('admin.manage')}>
                <OnSiteOrder/>
                <Button as={Link} href="/today" pill color="yellow" className="hidden lg:block">{t('today')}</Button>
            </If>
            <If condition={me == null}>
                <Button as={Link} href="/login" pill color="warning">{t('login')}</Button>
            </If>
            <If condition={me != null}>
                <Link href="/user" className="btn-icon-only w-10 h-10" aria-label="User Icon">
                    <span className="font-bold">{me?.name.at(0)}</span>
                </Link>
            </If>
        </div>
    </Navbar>
}