import { serverTranslation } from '@/app/i18n'
import SimpleNav from '@/app/core-components/SimpleNav'
import Link from 'next/link'
import { HiArrowRight, HiCake, HiUser } from 'react-icons/hi'
import { getMyUser } from '@/app/login/login-actions'
import If from '@/app/lib/If'
import RecentOrder from '@/app/core-components/RecentOrder'
import { IconType } from 'react-icons'
import { Trans } from 'react-i18next/TransWithoutContext'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { getOrderingAvailability } from '@/app/lib/ordering-actions'

function HomeBlock({ title, subtitle, icon: Icon, href, primary }: {
    title: string,
    subtitle: string,
    icon: IconType,
    href: string,
    primary?: boolean
}) {
    return <Link aria-label={title} href={href}
                 className={`group relative overflow-hidden rounded-3xl p-6 lg:p-8 flex flex-col justify-between
                 min-h-40 lg:min-h-48 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift
                 ${primary
                     ? 'bg-gradient-to-br from-caramel to-espresso text-white shadow-card'
                     : 'card'}`}>
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center
        ${primary ? 'bg-white/15' : 'bg-caramel-50 dark:bg-white/5'}`}>
            <Icon className={`text-2xl ${primary ? 'text-white' : 'text-caramel dark:text-caramel-100'}`}/>
        </div>
        <div className="flex items-end gap-3 mt-6" aria-hidden>
            <div className="mr-auto">
                <p className="font-bold text-xl lg:text-2xl">{title}</p>
                <p className={`text-sm ${primary ? 'text-white/80' : 'secondary'}`}>{subtitle}</p>
            </div>
            <HiArrowRight className={`text-xl transition-transform duration-200 group-hover:translate-x-1
            ${primary ? 'text-white' : 'text-caramel'}`}/>
        </div>
    </Link>
}

export default async function Home() {
    const { t } = await serverTranslation('welcome')
    const user = await getMyUser()
    const availability = await getOrderingAvailability()
    const statusKey = availability.phase === 'live' ? 'statusLive' : availability.phase === 'preorder' ? 'statusPreorder' : 'statusClosed'

    return <div className="min-h-screen">
        <SimpleNav/>
        <main id="primary-content" className="relative overflow-hidden min-h-[calc(100dvh-4rem)] flex items-center">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_90%_-10%,rgba(192,106,43,0.14),transparent),radial-gradient(40rem_30rem_at_-10%_80%,rgba(251,191,36,0.14),transparent)]"/>

            <div className="relative w-full max-w-5xl mx-auto px-5 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div aria-label={t('welcome')}>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium mb-6
                    ${availability.phase === 'closed'
                        ? 'bg-stone-200/70 text-stone-600 dark:bg-white/10 dark:text-stone-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'}`}>
                        <span className={`h-2 w-2 rounded-full ${availability.phase === 'closed' ? 'bg-stone-400' : 'bg-emerald-500 animate-pulse'}`}/>
                        {t(statusKey)}
                        <span className="opacity-60">·</span>
                        {t('hours', { open: availability.openTime, close: availability.closeTime })}
                    </span>
                    <h1 className="text-4xl lg:text-5xl leading-tight mb-5 [word-break:keep-all]">
                        <Trans t={t} i18nKey="title" components={{ 1: <span key="soft-break">&shy;</span> }}/>
                    </h1>
                    <p className="text-lg secondary max-w-md">{t('tagline')}</p>
                </div>

                <div className="flex flex-col gap-4">
                    <HomeBlock title={t('order')} subtitle={t('orderSub')} href="/order" icon={HiCake} primary/>
                    <div className="flex flex-col sm:flex-row gap-4 [&>*]:flex-1">
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
        </main>
    </div>
}
