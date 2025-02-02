'use client'

import { getOrder, HydratedOrder } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { HiCheck, HiClock, HiHashtag } from 'react-icons/hi'
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react'
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@prisma/client'
import { markOrderDone, refundOrder } from '@/app/lib/order-manage-actions'
import { useEffect, useState } from 'react'
import If from '@/app/lib/If'
import Link from 'next/link'
import UIOrderedItem from '@/app/user/manage/orders/[id]/UIOrderedItem'

export default function ManageOrderClient({ init }: { init: HydratedOrder }) {
    const { t } = useTranslationClient('user')
    const [ order, setOrder ] = useState(init)
    const [ refundModal, setRefundModal ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ refundError, setRefundError ] = useState(false)

    useEffect(() => {
        setInterval(async () => {
            const o = await getOrder(order.id)
            if (o == null) {
                location.href = '/'
                return
            }
            setOrder(o)
        }, 10000)
    }, [ order.id ])

    return <>
        <Modal show={refundModal} onClose={() => setRefundModal(false)}>
            <ModalHeader>{t('today.refundModal.title')}</ModalHeader>
            <ModalBody>
                <p className="mb-1">{t('today.refundModal.message')}</p>
                <If condition={order.paymentMethod === PaymentMethod.cash}>
                    <p>{t('today.refundModal.messageCash')}</p>
                </If>
                <If condition={order.paymentMethod === PaymentMethod.balance || (order.paymentMethod === PaymentMethod.payLater && order.wxPayId == null)}>
                    <p>{t('today.refundModal.messageBalance')}</p>
                </If>
                <If condition={order.paymentMethod === PaymentMethod.wxPay || order.paymentMethod === PaymentMethod.payForMe}>
                    <p>{t('today.refundModal.messageWeChat')}</p>
                </If>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning" disabled={loading || refundError} onClick={async () => {
                    setLoading(true)
                    setRefundError(!(await refundOrder(order.id)))
                    setLoading(false)
                    setRefundModal(false)

                    const o = await getOrder(order.id)
                    if (o == null) {
                        location.href = '/'
                        return
                    }
                    setOrder(o)
                }}>{refundError ? t('error') : t('confirm')}</Button>
                <Button pill color="gray" onClick={() => setRefundModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <h1 className="flex items-center mb-5">
            <Badge className="mr-3 rounded-full h-8 w-8 flex justify-center items-center" color="warning">
                <HiHashtag className="text-xl"/>
            </Badge>
            {order.id} <span className="sr-only">{t('today.orderNumber')}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 col-span-1" aria-label={t('today.info')}>
                <If condition={order.userId != null}>
                    <p className="secondary text-sm font-display">{t('today.user')}</p>
                    <p className="text-xl mb-3"><Link
                        href={`/user/manage/users/${order.userId}`}>{order.user?.name}</Link></p>
                </If>

                <p className="secondary text-sm font-display">{t('today.createdAt')}</p>
                <p className="text-xl mb-3">{order.createdAt.toLocaleString()}</p>

                <p className="secondary text-sm font-display">{t('today.price')}</p>
                <p className="text-xl mb-3">¥{order.totalPrice}</p>

                <p className="secondary text-sm font-display">{t('today.payment')}</p>
                <p className="text-xl">{t(`today.${order.paymentStatus}`)}</p>

                <If condition={order.type === OrderType.delivery}>
                    <p className="secondary text-sm font-display mt-3">{t('today.deliveryRoom')}</p>
                    <p className="text-xl">{order.deliveryRoom}</p>
                </If>
            </div>

            <div className="border-amber-50 dark:border-amber-900 border shadow-lg rounded-3xl p-5 col-span-1"
                 aria-label={t('today.status')}>
                <div className="flex w-full h-full gap-3 justify-center items-center">
                    <button
                        aria-label={t('today.waiting') + (order.status === OrderStatus.waiting ? t('selected') : '')}
                        className="w-40 h-40 rounded-3xl bg-yellow-50 dark:bg-yellow-800
                    hover:bg-yellow-100 dark:hover:bg-yellow-700 transition-colors duration-100
                    flex flex-col text-center items-center justify-center p-5" disabled={true}>
                        <HiClock
                            className={`${order.status === OrderStatus.waiting ? 'text-red-500 dark:text-red-400' : 'text-yellow-300 dark:text-yellow-400'} text-3xl mb-1`}/>
                        <p className={`${order.status === OrderStatus.waiting ? 'font-bold' : ''} text-lg`}
                           aria-hidden>{t('today.waiting')}</p>
                        <If condition={order.status === OrderStatus.waiting}>
                            <p className="secondary text-xs" aria-hidden>{t('today.current')}</p>
                        </If>
                    </button>

                    <button aria-label={t('today.done') + (order.status === OrderStatus.done ? t('selected') : '')}
                            className="w-40 h-40 rounded-3xl bg-yellow-50 dark:bg-yellow-800
                    hover:bg-yellow-100 dark:hover:bg-yellow-700 transition-colors duration-100
                    flex flex-col text-center items-center justify-center p-5"
                            disabled={order.status === OrderStatus.done || loading}
                            onClick={async () => {
                                setLoading(true)
                                await markOrderDone(order.id)
                                const o = await getOrder(order.id)
                                if (o == null) {
                                    location.href = '/'
                                    return
                                }
                                setOrder(o)
                                setLoading(false)
                            }}>
                        <HiCheck
                            className={`${order.status === OrderStatus.done ? 'text-green-400' : 'text-yellow-300 dark:text-yellow-400'} text-3xl mb-1`}/>
                        <p className={`${order.status === OrderStatus.done ? 'font-bold' : ''} text-lg`}
                           aria-hidden>{t('today.done')}</p>
                        <If condition={order.status === OrderStatus.done}>
                            <p className="secondary text-xs" aria-hidden>{t('today.current')}</p>
                        </If>
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 col-span-1 flex-col gap-3 flex"
                 aria-label={t('today.items')}>
                {order.items.map(item => <UIOrderedItem item={item} key={item.id}/>)}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 col-span-1" aria-label={t('today.actions')}>
                <p className="secondary text-sm font-display">{t('today.paymentMethod')}</p>
                <p className="text-xl mb-3">{t(`today.${order.paymentMethod}`)}</p>

                <If condition={order.wxPayId != null}>
                    <p className="secondary text-sm font-display">{t('today.wxPayID')}</p>
                    <p className="text-xl mb-3">{order.wxPayId}</p>
                </If>

                <If condition={order.paymentStatus === PaymentStatus.paid && new Date().getTime() - order.createdAt.getTime() <= 90 * 24 * 60 * 60 * 1000}>
                    <Button className="mb-3" color="failure" pill
                            onClick={() => setRefundModal(true)}>{t('today.refund')}</Button>
                </If>
                <p className="text-sm secondary">{t('today.refundInfo')}</p>
            </div>
        </div>
    </>
}
