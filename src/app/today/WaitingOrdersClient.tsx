'use client'

import { getOrderingAvailability, HydratedOrder, OrderingAvailabilityResponse } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getWaitingOrders, markOrderDone } from '@/app/lib/order-manage-actions'
import Link from 'next/link'
import { setConfigValue } from '@/app/lib/settings-actions'
import { HiCheckCircle, HiExclamationTriangle, HiPuzzlePiece } from 'react-icons/hi2'
import { HiCheck, HiClock } from 'react-icons/hi'
import Beluga from '@/app/core-components/Beluga'
import { isValidPickUpTime } from '@/app/lib/pick-up-times'

function getOfficialOpenTime(openAt: string | null | undefined): number | null {
    if (openAt == null) {
        return null
    }

    const openAtTime = new Date(openAt).getTime()
    return Number.isNaN(openAtTime) ? null : openAtTime
}

function getElapsedSeconds(createdAt: Date | string, openAt: string | null | undefined, now: number | null): number | null {
    if (now == null) {
        return null
    }

    const createdAtDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
    const createdAtTime = createdAtDate.getTime()
    const officialOpenTime = getOfficialOpenTime(openAt)

    if (Number.isNaN(createdAtTime) || (officialOpenTime != null && now < officialOpenTime)) {
        return null
    }

    const startTime = officialOpenTime == null ? createdAtTime : Math.max(createdAtTime, officialOpenTime)
    return Math.max(0, Math.floor((now - startTime) / 1000))
}

function formatElapsedTime(
    createdAt: Date | string,
    openAt: string | null | undefined,
    now: number | null,
    preOrderLabel: string
): string {
    const officialOpenTime = getOfficialOpenTime(openAt)
    if (officialOpenTime != null && now != null && now < officialOpenTime) {
        return preOrderLabel
    }

    const elapsedSeconds = getElapsedSeconds(createdAt, openAt, now)

    if (elapsedSeconds == null) {
        return '--:--'
    }

    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function waitTone(elapsedSeconds: number | null): string {
    if (elapsedSeconds == null) {
        return 'bg-paper'
    }
    return elapsedSeconds > 600 ? 'bg-tomato text-white' : elapsedSeconds > 300 ? 'bg-butter' : 'bg-mint'
}

function OrderTicket({ order, done, now, openAt }: {
    order: HydratedOrder,
    done: () => Promise<void>,
    now: number | null,
    openAt: string | null
}) {
    const { t } = useTranslationClient('user')
    const [ busy, setBusy ] = useState(false)
    const elapsedSeconds = getElapsedSeconds(order.createdAt, openAt, now)
    const cups = order.items.reduce((acc, item) => acc + item.amount, 0)

    return <article className="toon overflow-hidden flex flex-col pop-in" aria-label={`${order.id} ${t('today.orderNumber')}`}>
        <header className="bg-butter/60 px-4 pt-3 pb-4 flex items-start gap-3">
            <p className="font-toon text-5xl leading-none">#{order.id}<span className="sr-only">{t('today.orderNumber')}</span></p>
            <div className="ml-auto flex flex-col items-end gap-1.5">
                <span className={`h-7 px-2.5 rounded-full border-2 border-ink font-bold text-sm flex items-center gap-1 tabular-nums ${waitTone(elapsedSeconds)}`}
                      title={t('today.waitedFor')}>
                    <HiClock/>{formatElapsedTime(order.createdAt, openAt, now, t('today.preOrderLabel'))}
                </span>
                <span className="text-xs">{t('today.cups', { count: cups })}</span>
            </div>
        </header>
        {/* perforation, like a paper ticket */}
        <div aria-hidden className="relative h-0 border-t-2 border-dashed border-ink/40">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cream border-toon border-ink"/>
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cream border-toon border-ink"/>
        </div>

        <div className="px-4 pt-4 pb-3 flex flex-wrap gap-1.5 text-xs">
            <span className="h-6 px-2.5 rounded-full border-2 border-ink bg-whale/60 flex items-center font-bold">
                {order.userId != null ? order.user!.name : t('anonymous')}
            </span>
            {isValidPickUpTime(order.pickUpTime) &&
                <span className="h-6 px-2.5 rounded-full border-2 border-ink bg-paper flex items-center">
                    {t('today.pickUpTime')} {t(`today.pickUpTimeOptions.${order.pickUpTime}`)}
                </span>}
            {order.deliveryRoom != null &&
                <span className="h-6 px-2.5 rounded-full border-2 border-ink bg-blush flex items-center font-bold">
                    {t('today.deliveryRoom')} {order.deliveryRoom}
                </span>}
        </div>

        <ul className="px-4 pb-3 flex flex-col gap-2 flex-grow">
            {order.items.map(item => <li key={item.id} className="flex items-start gap-3">
                <span className="h-8 min-w-8 px-1 rounded-full border-2 border-ink bg-paper font-toon flex items-center justify-center">×{item.amount}</span>
                <span className="min-w-0">
                    <span className="block font-toon text-lg leading-tight">{item.itemType.name}</span>
                    {item.appliedOptions.length > 0 &&
                        <span className="block text-sm secondary">{item.appliedOptions.map(option => option.name).join(' · ')}</span>}
                </span>
            </li>)}
            {order.items.length < 1 && <li className="secondary text-center">{t('today.noItems')}</li>}
        </ul>

        <footer className="px-4 pb-4 flex items-center gap-3">
            <button disabled={busy} onClick={async () => {
                setBusy(true)
                await done()
                setBusy(false)
            }} className="toon-btn h-11 text-base flex-grow bg-mint text-[#1f3d2a] disabled:opacity-50">
                <HiCheck/>{t('today.done')}
            </button>
            <Link href={`/user/manage/orders/${order.id}`} className="toon-btn-ghost h-11 text-base px-4">{t('today.details')}</Link>
        </footer>
    </article>
}

export default function WaitingOrdersClient({ init }: { init: { [id: number]: HydratedOrder } }) {
    const { t } = useTranslationClient('user')
    const [ orders, setOrders ] = useState(init)
    const [ now, setNow ] = useState<number | null>(null)
    const [ availability, setAvailability ] = useState<OrderingAvailabilityResponse | null>(null)

    const tick = async () => {
        const [ newOrders, newAvailability ] = await Promise.all([
            getWaitingOrders(),
            getOrderingAvailability()
        ])

        setOrders(newOrders)
        setAvailability(newAvailability)
    }

    useEffect(() => {
        void tick()
        const id = setInterval(tick, 10000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        setNow(Date.now())
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    const isOpen = availability?.isStoreOpen ?? false
    const isPreOrder = availability?.phase === 'preorder'
    const isOrderWindowActive = availability?.phase != null && availability.phase !== 'closed'
    const isCapacityBlocked = availability != null &&
        !availability.canOrderNow &&
        availability.unavailableReason !== 'store-closed'
    const statusText = availability == null
        ? t('today.storeStatusClosed')
        : availability.phase === 'preorder'
            ? (availability.canOrderNow ? t('today.storeStatusPreOrder') : t('today.storeStatusPreOrderFull'))
            : availability.isStoreOpen
                ? (availability.canOrderNow ? t('today.storeStatusOpen') : t('today.storeStatusAtCapacity'))
                : t('today.storeStatusClosed')
    const statusTone = (isOpen || isPreOrder) ? (isCapacityBlocked ? 'bg-butter' : 'bg-mint') : 'bg-blush'
    const list = Object.values(orders)
    const waitingCups = list.reduce((acc, order) => acc + order.items.reduce((a, item) => a + item.amount, 0), 0)

    const storeCard = <aside className="toon p-5 flex flex-col gap-4 lg:sticky lg:top-20" aria-label={t('today.info')}>
        <div className={`rounded-2xl border-toon border-ink px-4 py-3 flex items-center gap-2 ${statusTone}`}>
            {(isOpen || isPreOrder) && !isCapacityBlocked && <HiCheckCircle className="text-xl"/>}
            {(isOpen || isPreOrder) && isCapacityBlocked && <HiExclamationTriangle className="text-xl"/>}
            {!isOpen && !isPreOrder && <HiClock className="text-xl"/>}
            <p className="font-toon text-lg">{statusText}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-ink/20 p-3">
                <p className="text-xs secondary">{t('today.ordersPane')}</p>
                <p className="font-toon text-3xl">{list.length}</p>
                <p className="text-xs secondary">{t('today.cups', { count: waitingCups })}</p>
            </div>
            <div className="rounded-2xl border-2 border-ink/20 p-3">
                <p className="text-xs secondary">{t('today.remainingShort')}</p>
                <p className="font-toon text-3xl">{availability?.currentDay.remainingLiveCups ?? '...'}</p>
                <p className="text-xs secondary">{availability == null ? '' : t('today.officialLimit', { count: availability.currentDay.officialLimit })}</p>
            </div>
        </div>
        {availability != null && <div className="text-xs secondary flex flex-col gap-1">
            <p>{t('today.limitDate', { date: availability.currentDay.dateKey })}</p>
            <p>{t('today.preOrderUsage', {
                used: availability.currentDay.preOrderedCups,
                limit: availability.currentDay.preOrderLimit
            })}</p>
            {availability.phase === 'preorder' &&
                <p>{t('today.remainingPreOrder', {
                    count: availability.currentDay.remainingPreOrderCups,
                    time: availability.openTime
                })}</p>}
        </div>}
        <button className={`toon-btn h-11 text-base w-full ${isOrderWindowActive ? 'bg-paper' : ''}`} onClick={async () => {
            const date = new Date()
            await setConfigValue('availability-override-date', `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`)
            await setConfigValue('availability-override-value', isOrderWindowActive ? 'false' : 'true')
            await tick()
        }}>{isOrderWindowActive ? t('today.closeActionFull') : t('today.openActionFull')}</button>
        <div className="flex gap-3">
            <Link href="/user/manage/settings" className="toon-btn-ghost h-10 text-sm flex-grow px-3">{t('today.settingsAction')}</Link>
            <Link href="/user/manage/orders" className="toon-btn-ghost h-10 text-sm flex-grow px-3">{t('today.return')}</Link>
        </div>
    </aside>

    return <div className="dots min-h-[calc(100dvh-4rem)] p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-5 items-start">
            {storeCard}
            {list.length < 1
                ? <div className="toon p-8 flex flex-col items-center text-center gap-3">
                    <Beluga mood="sleepy" className="w-48"/>
                    <p className="font-toon text-2xl">{t('today.empty')}</p>
                    <p className="secondary text-sm">{t('today.emptyHint')}</p>
                    <Link href="/user/manage/break" className="toon-btn-ghost h-11 text-base bg-whale/50 mt-2"><HiPuzzlePiece/>{t('today.breakLink')}</Link>
                </div>
                : <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5" aria-label={t('today.ordersPane')}>
                    {list.map(order => <OrderTicket order={order} done={async () => {
                        await markOrderDone(order.id)
                        void tick()
                    }} key={order.id} now={now} openAt={availability?.openAt ?? null}/>)}
                </section>}
        </div>
    </div>
}
