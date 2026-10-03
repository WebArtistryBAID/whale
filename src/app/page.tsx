import { serverTranslation } from '@/app/i18n'
import SimpleNav from '@/app/core-components/SimpleNav'
import Link from 'next/link'
import { getMyUser } from '@/app/login/login-actions'
import RecentOrder from '@/app/core-components/RecentOrder'
import { Trans } from 'react-i18next/TransWithoutContext'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { getOrderingAvailability } from '@/app/lib/ordering-actions'
import { getCoreItems } from '@/app/lib/ui-data-actions'
import Beluga from '@/app/core-components/Beluga'
import Squiggle from '@/app/core-components/Squiggle'
import Decimal from 'decimal.js'
import { isItemSoldOut } from '@/app/lib/item-availability'
import { HiArrowRight } from 'react-icons/hi'

export default async function Home() {
    const { t } = await serverTranslation('welcome')
    const user = await getMyUser()
    const availability = await getOrderingAvailability()
    const items = (await getCoreItems()).flatMap(category => category.items).slice(0, 8)
    const uploadPrefix = `/${process.env.UPLOAD_SERVE_PATH}/`
    const closed = availability.phase === 'closed'
    const statusKey = availability.phase === 'live' ? 'statusLive' : availability.phase === 'preorder' ? 'statusPreorder' : 'statusClosed'

    return <div className="min-h-screen dots">
        <SimpleNav/>
        <main id="primary-content" aria-label={t('welcome')}>
            <section className="max-w-6xl mx-auto px-5 pt-10 lg:pt-16 pb-6 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
                <div className="order-2 lg:order-1">
                    <span className={`inline-flex items-center gap-2 font-toon text-base px-4 py-1.5 rounded-full border-toon
                    border-ink shadow-toon-sm -rotate-2 mb-6 ${closed ? 'bg-paper' : 'bg-mint text-[#1f3d2a]'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full border-2 border-current ${closed ? '' : 'bg-white'}`}/>
                        {t(statusKey)} · {t('hours', { open: availability.openTime, close: availability.closeTime })}
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl leading-[1.2] mb-8 lg:[word-break:keep-all]">
                        <Trans t={t} i18nKey="title" components={{ 1: <span key="soft-break">&shy;</span> }}/>
                    </h1>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/order" className="toon-btn h-14 px-8 text-xl">{t('startOrder')}<HiArrowRight/></Link>
                        {user == null
                            ? <Link href="/login" className="toon-btn-ghost h-14 px-7 text-xl">{t('login')}</Link>
                            : <Link href="/user" className="toon-btn-ghost h-14 px-7 text-xl">{t('user')}</Link>}
                    </div>
                </div>

                <div className="order-1 lg:order-2 relative flex flex-col items-center">
                    <div className="toon relative px-5 py-3 font-toon text-lg lg:text-xl mb-3 rotate-2 self-center lg:self-start lg:ml-10">
                        {closed ? t('bubbleClosed') : t('bubble')}
                        <span aria-hidden className="absolute -bottom-[11px] left-1/2 h-5 w-5 rotate-45 bg-paper
                        border-r-toon border-b-toon border-ink"/>
                    </div>
                    <Beluga mood={closed ? 'sleepy' : 'happy'} withCup={!closed} className="w-72 lg:w-[26rem] bob"/>
                    <Squiggle className="w-80 lg:w-[28rem] h-4 -mt-3 text-whale"/>
                    <Squiggle className="w-64 lg:w-[22rem] h-4 text-whale/60"/>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-5 pb-12" aria-label={t('menuTitle')}>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="text-3xl"><span className="marker">{t('menuTitle')}</span></h2>
                    <Link href="/order" className="font-toon text-lg flex items-center gap-1 hover:underline
                    decoration-butter decoration-[3px] underline-offset-4">{t('viewMenu')}<HiArrowRight/></Link>
                </div>
                <div className="flex gap-5 overflow-x-auto scrollbar-none pb-3 pt-1 px-1 -mx-1">
                    {items.map((item, index) => {
                        const soldOut = isItemSoldOut(item)
                        return <Link key={item.id} href="/order"
                                     className={`toon toon-press flex-shrink-0 w-44 p-4 flex flex-col items-center text-center
                                     ${index % 3 === 0 ? 'rotate-[-1.5deg]' : index % 3 === 1 ? 'rotate-1' : ''}`}>
                            <img src={uploadPrefix + item.image} alt="" width={256} height={256}
                                 className={`w-28 h-28 rounded-full object-cover border-toon border-ink mb-3 ${soldOut ? 'grayscale' : ''}`}/>
                            <span className="font-toon text-lg leading-tight mb-2">{item.name}</span>
                            <span className="price-tag">
                                {soldOut ? t('soldOut') : `¥${Decimal(item.basePrice).mul(item.salePercent).toString()}`}
                            </span>
                        </Link>
                    })}
                </div>
                <div className="mt-6">
                    <CookiesBoundary><RecentOrder/></CookiesBoundary>
                </div>
            </section>
        </main>
    </div>
}
