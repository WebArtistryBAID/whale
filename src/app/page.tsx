import { serverTranslation } from '@/app/i18n'
import SimpleNav from '@/app/core-components/SimpleNav'
import Link from 'next/link'
import { getMyUser } from '@/app/login/login-actions'
import RecentOrder from '@/app/core-components/RecentOrder'
import { Trans } from 'react-i18next/TransWithoutContext'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { getOrderingAvailability } from '@/app/lib/ordering-actions'
import { getCoreItems } from '@/app/lib/ui-data-actions'
import Decimal from 'decimal.js'
import { isItemSoldOut } from '@/app/lib/item-availability'

export default async function Home() {
    const { t } = await serverTranslation('welcome')
    const user = await getMyUser()
    const availability = await getOrderingAvailability()
    const categories = await getCoreItems()
    const statusKey = availability.phase === 'live' ? 'statusLive' : availability.phase === 'preorder' ? 'statusPreorder' : 'statusClosed'

    return <div className="min-h-screen">
        <SimpleNav/>
        <main id="primary-content"
              className="max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_26rem] gap-12 lg:gap-20">
            <section aria-label={t('welcome')} className="flex flex-col min-w-0">
                <p className="text-sm mb-8 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${availability.phase === 'closed' ? 'bg-cream-300' : 'bg-leaf'}`}/>
                    <span className="font-medium">{t(statusKey)}</span>
                    <span className="secondary">{t('hours', { open: availability.openTime, close: availability.closeTime })}</span>
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.15] font-semibold mb-6 [word-break:keep-all]">
                    <Trans t={t} i18nKey="title" components={{ 1: <span key="soft-break">&shy;</span> }}/>
                </h1>
                <p className="text-lg secondary max-w-md mb-10">{t('tagline')}</p>

                <div className="flex flex-wrap gap-3 mb-10">
                    <Link href="/order" className="inline-flex items-center h-12 px-6 rounded-md bg-caramel text-white
                    font-semibold hover:bg-caramel-600 transition-colors">{t('startOrder')}</Link>
                    {user == null
                        ? <Link href="/login" className="inline-flex items-center h-12 px-6 rounded-md border border-cream-300
                        dark:border-white/20 font-semibold hover:border-espresso transition-colors">{t('login')}</Link>
                        : <Link href="/user" className="inline-flex items-center h-12 px-6 rounded-md border border-cream-300
                        dark:border-white/20 font-semibold hover:border-espresso transition-colors">{t('user')}</Link>}
                </div>

                <CookiesBoundary><RecentOrder/></CookiesBoundary>
            </section>

            <aside aria-label={t('menuTitle')} className="card px-6 lg:px-7 py-8 self-start min-w-0">
                <h2 className="font-serif text-2xl font-semibold text-center mb-1">{t('menuTitle')}</h2>
                <p className="text-center text-xs secondary mb-6">{t('hours', { open: availability.openTime, close: availability.closeTime })}</p>
                {categories.filter(category => category.items.length > 0).map(category =>
                    <div key={category.id} className="mb-6 last:mb-4">
                        <p className="text-xs font-semibold secondary mb-2 pb-1 border-b border-cream-200 dark:border-white/10">{category.name}</p>
                        <ul className="flex flex-col gap-1.5">
                            {category.items.map(item => {
                                const soldOut = isItemSoldOut(item)
                                return <li key={item.id} className={`flex items-baseline text-sm ${soldOut ? 'opacity-50' : ''}`}>
                                    <span className="truncate">{item.name}</span>
                                    <span className="leader" aria-hidden/>
                                    <span className="price">
                                        {soldOut ? t('soldOut') : `¥${Decimal(item.basePrice).mul(item.salePercent).toString()}`}
                                    </span>
                                </li>
                            })}
                        </ul>
                    </div>)}
                <Link href="/order" className="block text-center text-sm font-semibold text-caramel hover:underline">
                    {t('viewMenu')} →
                </Link>
            </aside>
        </main>
    </div>
}
