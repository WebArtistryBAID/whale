'use client'

import { getOrderingAvailability, HydratedOrder, OrderingAvailabilityResponse } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getWaitingOrders, markOrderDone } from '@/app/lib/order-manage-actions'
import { Badge, Button } from 'flowbite-react'
import Link from 'next/link'
import { setConfigValue } from '@/app/lib/settings-actions'
import { HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2'
import { HiClock, HiHashtag } from 'react-icons/hi'
import UIOrderedItem from '@/app/user/manage/orders/[id]/UIOrderedItem'

function getElapsedSeconds(createdAt: Date | string, now: number | null): number | null {
    if (now == null) {
        return null
    }

    const createdAtDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
    const createdAtTime = createdAtDate.getTime()

    if (Number.isNaN(createdAtTime)) {
        return null
    }

    return Math.max(0, Math.floor((now - createdAtTime) / 1000))
}

function formatElapsedTime(createdAt: Date | string, now: number | null): string {
    const elapsedSeconds = getElapsedSeconds(createdAt, now)

    if (elapsedSeconds == null) {
        return '--:--'
    }

    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function OrderInfo({ order, done, now }: {
    order: HydratedOrder,
    done: () => Promise<void>,
    now: number | null
}) {
    const { t } = useTranslationClient('user')

    return <div className="col-span-1 row-span-1 p-3 bg-amber-50 dark:bg-amber-800 rounded-3xl">
        <h2 className="flex items-center mb-3 font-bold">
            <Badge className="mr-2 rounded-full h-8 w-8 flex justify-center items-center" color="warning">
                <HiHashtag className="text-xl"/>
            </Badge>
            {order.id} <span className="sr-only">{t('today.orderNumber')}</span>
        </h2>

        <div className="mb-3">
            <p>{t('today.user')}: <span
                className="font-bold">{order.userId != null ? order.user!.name : t('anonymous')}</span></p>
            <p>{t('today.waitedFor')}: <span
                className={`font-bold ${(getElapsedSeconds(order.createdAt, now) ?? 0) > 600 ? 'text-red-500' : ''}`}>{formatElapsedTime(order.createdAt, now)}</span>
            </p>
            {order.deliveryRoom != null &&
                <p>{t('today.deliveryRoom')}: <span className="text-green-400 font-bold">{order.deliveryRoom!}</span>
                </p>}
        </div>

        <div className="mb-3">
            {order.items.map(item => <UIOrderedItem item={item} key={item.id}/>)}
            {order.items.length < 1 && <p className="secondary text-center">{t('today.noItems')}</p>}
        </div>

        <div className="flex items-center gap-3">
            <Button pill color="success" onClick={() => {
                void done()
            }}>{t('today.done')}</Button>
            <Link href={`/user/manage/orders/${order.id}`}><Button pill
                                                                   color="yellow">{t('today.details')}</Button></Link>
        </div>
    </div>
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

    if (Object.keys(orders).length < 1) {
        return <div className="w-screen h-screen flex flex-col justify-center items-center text-center">
            <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                 className="dark:hidden w-72" alt=""/>
            <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                 className="hidden dark:block w-72" alt=""/>
            <p className="mb-3">{t('today.empty')}</p>
            <Link href="/user/manage/orders" className="mb-3">
                <Button color="warning">{t('today.return')}</Button>
            </Link>

            {availability != null && <div className="mb-3 text-sm secondary">
                <p>{t('today.limitDate', { date: availability.currentDay.dateKey })}</p>
                <p>{t('today.officialLimit', { count: availability.currentDay.officialLimit })}</p>
                <p>{t('today.remainingLive', { count: availability.currentDay.remainingLiveCups })}</p>
                {availability.phase === 'preorder' &&
                    <p>{t('today.remainingPreOrder', {
                        count: availability.currentDay.remainingPreOrderCups,
                        time: availability.openTime
                    })}</p>}
            </div>}

            <Button color="warning" onClick={async () => {
                const date = new Date()
                await setConfigValue('availability-override-date', `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`)
                await setConfigValue('availability-override-value', isOrderWindowActive ? 'false' : 'true')
                await tick()
            }}>{isOrderWindowActive ? t('today.closeActionFull') : t('today.openActionFull')}</Button>

            <Link href="/user/manage/settings" className="mt-3">
                <Button color="warning">{t('today.settingsAction')}</Button>
            </Link>
        </div>
    }

    return <>
        <div className="w-full h-full grid sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 grid-cols-1 p-5"
             aria-label={t('today.ordersPane')}>
            <div className="col-span-1 row-span-1 flex flex-col gap-3 p-5 bg-amber-50 dark:bg-amber-800 rounded-3xl">
                <div className="flex items-center gap-2">
                    {(isOpen || isPreOrder) && !isCapacityBlocked &&
                        <HiCheckCircle className="text-green-500 text-xl"/>}
                    {(isOpen || isPreOrder) && isCapacityBlocked &&
                        <HiExclamationTriangle className="text-yellow-300 dark:text-yellow-400 text-xl"/>}
                    {!isOpen && !isPreOrder && <HiClock className="text-purple-500 text-xl"/>}
                    <p className="mr-auto">{statusText}</p>
                </div>
                {availability != null && <div className="text-sm secondary flex flex-col gap-1">
                    <p>{t('today.limitDate', { date: availability.currentDay.dateKey })}</p>
                    <p>{t('today.officialLimit', { count: availability.currentDay.officialLimit })}</p>
                    <p>{t('today.remainingLive', { count: availability.currentDay.remainingLiveCups })}</p>
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
                <Button color="warning" className="w-full" onClick={async () => {
                    const date = new Date()
                    await setConfigValue('availability-override-date', `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`)
                    await setConfigValue('availability-override-value', isOrderWindowActive ? 'false' : 'true')
                    await tick()
                }}>{isOrderWindowActive ? t('today.closeActionFull') : t('today.openActionFull')}</Button>

                <Link href="/user/manage/settings" className="w-full">
                    <Button color="warning" className="w-full">{t('today.settingsAction')}</Button>
                </Link>
            </div>

            {Object.values(orders).map(order => <OrderInfo order={order} done={async () => {
                await markOrderDone(order.id)
                void tick()
            }} key={order.id} now={now}/>)}
        </div>
    </>
}
