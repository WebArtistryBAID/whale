'use client'

import { HydratedOrder, isMaximumCupsReached, isStoreOpen } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getWaitingOrders, markOrderDone } from '@/app/lib/order-manage-actions'
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, TextInput } from 'flowbite-react'
import Link from 'next/link'
import If from '@/app/lib/If'
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

    return <div className="col-span-1 row-span-1 p-3 bg-amber-50 rounded-3xl">
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
    const [ isOpen, setOpen ] = useState(false)
    const [ atCapacity, setAtCapacity ] = useState(false)
    const [ capacityModal, setCapacityModal ] = useState(false)
    const [ capacity, setCapacity ] = useState('')
    const [ loading, setLoading ] = useState(false)

    const tick = async () => {
        const newOrders = await getWaitingOrders()

        setOrders(newOrders)
        setOpen(await isStoreOpen())
        setAtCapacity(await isMaximumCupsReached())
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

            <Button color="warning" onClick={async () => {
                const date = new Date()
                await setConfigValue('availability-override-date', `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
                await setConfigValue('availability-override-value', isOpen ? 'false' : 'true')
                setOpen(!isOpen)
            }}>{isOpen ? t('today.closeActionFull') : t('today.openActionFull')}</Button>
        </div>
    }

    return <>
        <Modal show={capacityModal} onClose={() => setCapacityModal(false)}>
            <ModalHeader>{t('today.capacityModal.title')}</ModalHeader>
            <ModalBody>
                <p className="mb-5">{t('today.capacityModal.message')}</p>
                <TextInput className="w-full" type="number" value={capacity}
                           placeholder={t('today.capacityModal.placeholder')}
                           onChange={e => setCapacity(e.currentTarget.value)}
                           aria-valuemin={0}/>
                <If condition={capacity !== '' && !isNaN(parseInt(capacity)) && parseInt(capacity) < 0}>
                    <p className="text-red-500 mt-3">{t('today.capacityModal.minimum')}</p>
                </If>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning"
                        disabled={capacity === '' || loading || isNaN(parseInt(capacity)) || parseInt(capacity) < 0}
                        onClick={async () => {
                            setLoading(true)
                            await setConfigValue('maximum-cups-per-day', capacity)
                            setAtCapacity(await isMaximumCupsReached())
                            setLoading(false)
                            setCapacityModal(false)
                        }}>{t('confirm')}</Button>
                <Button pill color="gray" onClick={() => setCapacityModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <div className="w-full h-full grid sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 grid-cols-1 p-5"
             aria-label={t('today.ordersPane')}>
            <div className="col-span-1 row-span-1 flex flex-col gap-3 p-5 bg-amber-50 rounded-3xl">
                <div className="flex items-center gap-2">
                    {isOpen && !atCapacity && <HiCheckCircle className="text-green-500 text-xl"/>}
                    {isOpen && atCapacity &&
                        <HiExclamationTriangle className="text-yellow-300 dark:text-yellow-400 text-xl"/>}
                    {!isOpen && <HiClock className="text-purple-500 text-xl"/>}
                    <p className="mr-auto">{isOpen ? (atCapacity ? t('today.storeStatusAtCapacity') :
                        t('today.storeStatusOpen')) : t('today.storeStatusClosed')}</p>
                </div>
                <Button color="warning" className="w-full" onClick={async () => {
                    const date = new Date()
                    await setConfigValue('availability-override-date', `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
                    await setConfigValue('availability-override-value', isOpen ? 'false' : 'true')
                    setOpen(!isOpen)
                }}>{isOpen ? t('today.closeActionFull') : t('today.openActionFull')}</Button>

                <Button color="warning" className="w-full"
                        onClick={() => setCapacityModal(true)}>{t('today.capacityAction')}</Button>
            </div>

            {Object.values(orders).map(order => <OrderInfo order={order} done={async () => {
                await markOrderDone(order.id)
                void tick()
            }} key={order.id} now={now}/>)}
        </div>
    </>
}
