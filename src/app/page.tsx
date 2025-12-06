import { serverTranslation } from '@/app/i18n'
import SimpleNav from '@/app/core-components/SimpleNav'
import Link from 'next/link'
import { HiCake, HiUser } from 'react-icons/hi'
import { getMyUser } from '@/app/login/login-actions'
import If from '@/app/lib/If'
import RecentOrder from '@/app/core-components/RecentOrder'
import { IconType } from 'react-icons'
import { Trans } from 'react-i18next/TransWithoutContext'
import CookiesBoundary from '@/app/lib/CookiesBoundary'

function HomeBlock({ title, subtitle, icon, href }: { title: string, subtitle: string, icon: IconType, href: string }) {
    return <Link aria-label={title} className="w-40 lg:w-72 h-40 rounded-3xl bg-amber-50 dark:bg-amber-800
    hover:bg-amber-100 dark:hover:bg-amber-700 transition-colors duration-100
    flex flex-col lg:flex-row text-center lg:text-left gap-1 lg:gap-3 items-center justify-center p-5" href={href}>
        <div>
            {icon({
                className: 'text-yellow-300 dark:text-yellow-400 text-3xl lg:text-5xl'
            })}
        </div>
        <div>
            <p className="font-bold text-lg" aria-hidden>{title}</p>
            <p className="secondary text-xs" aria-hidden>{subtitle}</p>
        </div>
    </Link>
}

export default async function Home() {
    const { t } = await serverTranslation('welcome')
    const user = await getMyUser()

    return <div className="bg-coffee-1 dark:bg-yellow-950 min-h-screen">
        <SimpleNav/>
        <div id="primary-content" className="flex flex-col lg:flex-row w-screen lg:h-[93vh]">
            <div className="w-full text-center items-center
            flex flex-col justify-center p-8 xl:p-16 lg:h-full overflow-y-auto" aria-label={t('welcome')}>
                <h1 className="mb-8">
                    <Trans t={t} i18nKey="title" components={{ 1: <span key="soft-break">&shy;</span> }}/>
                </h1>

                <div className="flex flex-wrap justify-center items-center gap-5">
                    <HomeBlock title={t('order')} subtitle={t('orderSub')} href="/order" icon={HiCake}/>

                    <If condition={user == null}>
                        <HomeBlock title={t('login')} subtitle={t('loginSub')} href="/login" icon={HiUser}/>
                    </If>

                    <If condition={user != null}>
                        <HomeBlock title={t('user')} subtitle={t('userSub')} href="/user" icon={HiUser}/>
                    </If>

                    <CookiesBoundary><RecentOrder/></CookiesBoundary>
                </div>
            </div>
        </div>
    </div>
}
