'use client'

import { HydratedOrder, isMaximumCupsReached, isStoreOpen } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getWaitingOrders } from '@/app/lib/order-manage-actions'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, TextInput } from 'flowbite-react'
import Link from 'next/link'
import { OrderType } from '@/generated/prisma/browser'
import If from '@/app/lib/If'
import OrderWithData from '@/app/user/manage/orders/[id]/OrderWithData'
import { setConfigValue } from '@/app/lib/settings-actions'
import { HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2'
import { HiClock } from 'react-icons/hi'

export default function WaitingOrdersClient({ init }: { init: { [id: number]: HydratedOrder } }) {
    const { t } = useTranslationClient('user')
    const [ orders, setOrders ] = useState(init)
    const [ selected, setSelected ] = useState(Object.keys(init).length < 1 ? -1 : parseInt(Object.keys(init)[0]))
    const [ isOpen, setOpen ] = useState(false)
    const [ atCapacity, setAtCapacity ] = useState(false)
    const [ capacityModal, setCapacityModal ] = useState(false)
    const [ capacity, setCapacity ] = useState('')
    const [ loading, setLoading ] = useState(false)

    useEffect(() => {
        const tick = async () => {
            const newOrders = await getWaitingOrders()

            setOrders(newOrders)
            setOpen(await isStoreOpen())
            setAtCapacity(await isMaximumCupsReached())

            setSelected(prev =>
                Object.prototype.hasOwnProperty.call(newOrders, String(prev)) ? prev : -1
            )
        }

        void tick()
        const id = setInterval(tick, 10000)
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

        <div className="flex h-[93vh] w-screen">
            <div className="w-1/5 h-full flex flex-col p-5" aria-label={t('today.ordersPane')}>
                <div className="override-y-auto flex flex-col gap-3 flex-grow">
                    {Object.keys(orders).map(id =>
                        <Button key={id} onClick={() => setSelected(parseInt(id))} className="w-full"
                                color={selected === parseInt(id) ? 'warning' : (orders[parseInt(id)].type === OrderType.pickUp ? 'gray' : 'green')}>
                            {id}
                            <If condition={orders[parseInt(id)].type === OrderType.delivery}>
                                <span className="ml-1">{t('today.delivery')}</span>
                            </If>
                            <If condition={selected === parseInt(id)}>
                                <span className="sr-only">{t('selected')}</span>
                            </If>
                        </Button>
                    )}
                </div>
                <div className="flex-shrink flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        {isOpen && !atCapacity && <HiCheckCircle className="text-green-500 text-xl"/>}
                        {isOpen && atCapacity &&
                            <HiExclamationTriangle className="text-yellow-300 dark:text-yellow-400 text-xl"/>}
                        {!isOpen && <HiClock className="text-purple-500 text-xl"/>}
                        <p className="mr-auto">{isOpen ? (atCapacity ? t('today.storeStatusAtCapacity') :
                            t('today.storeStatusOpen')) : t('today.storeStatusClosed')}</p>
                    </div>
                    <Button color="yellow" className="w-full" onClick={async () => {
                        const date = new Date()
                        await setConfigValue('availability-override-date', `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
                        await setConfigValue('availability-override-value', isOpen ? 'false' : 'true')
                        setOpen(!isOpen)
                    }}>{isOpen ? t('today.closeActionFull') : t('today.openActionFull')}</Button>

                    <Button color="yellow" className="w-full"
                            onClick={() => setCapacityModal(true)}>{t('today.capacityAction')}</Button>
                </div>
            </div>
            <div className="w-4/5 p-8 h-full overflow-y-auto" aria-label={t('today.detailsPane')}>
                {selected !== -1 ?
                    <OrderWithData order={orders[selected]} close={() => setSelected(-1)} forceUpdate={async () => {
                        setOrders(await getWaitingOrders())
                    }}/> : null}
            </div>
        </div>
    </>
}
