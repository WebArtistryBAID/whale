'use client'

import {
    cancelUnpaidOrder,
    canPayWithBalance,
    EstimatedWaitTimeResponse,
    getEstimatedWaitTimeFor,
    getOrder,
    HydratedOrder,
    payLaterBalance
} from '@/app/lib/ordering-actions'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@/generated/prisma/browser'
import { Trans } from 'react-i18next/TransWithoutContext'
import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Popover, Spinner } from 'flowbite-react'
import { HiHashtag, HiInformationCircle } from 'react-icons/hi'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderDetailsClient({ initialOrder, uploadPrefix }: {
    initialOrder: HydratedOrder,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')
    const [ order, setOrder ] = useState(initialOrder)
    const [ estimate, setEstimate ] = useState<EstimatedWaitTimeResponse | null>(null)
    const [ payModal, setPayModal ] = useState(false)
    const [ canUseBalance, setCanUseBalance ] = useState(true)
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()
    const shoppingCart = useShoppingCart()

    useEffect(() => {
        (async () => {
            if (order.status === OrderStatus.waiting) {
                setEstimate(await getEstimatedWaitTimeFor(order.id))
            }
        })()
    }, [ order.id, order.status ])

    useEffect(() => {
        (async () => {
            setCanUseBalance(await canPayWithBalance(order.totalPrice))
        })()

        setInterval(async () => {
            const o = await getOrder(order.id)
            if (o == null) {
                location.href = '/'
                return
            }
            setOrder(o)
            if (o.status === OrderStatus.waiting) {
                setEstimate(await getEstimatedWaitTimeFor(o.id))
            }
        }, 10000)
    }, [ order.id, order.totalPrice ])

    async function cancel() {
        await cancelUnpaidOrder(order.id)
        location.href = '/'
    }

    return <>
        <Modal show={payModal} onClose={() => setPayModal(false)}>
            <ModalHeader>{t('details.paymentMethod')}</ModalHeader>
            <ModalBody>
                <p className="mb-1">{t('details.paymentMethodMessage')}</p>
                <p className="text-lg">{t('total', { price: order.totalPrice })}</p>
            </ModalBody>
            <ModalFooter>
                <Link href={`/order/checkout/wechat/pay?id=${order.id}`}>
                    <Button pill color="yellow">{t('checkout.wxPay')}</Button>
                </Link>
                <Button pill color="yellow" disabled={!canUseBalance || loading} onClick={async () => {
                    setLoading(true)
                    await payLaterBalance(order.id)
                    setLoading(false)
                    setPayModal(false)
                    router.refresh()
                }}>
                    {canUseBalance ? t('checkout.balance') : t('details.insufficientBalance')}</Button>
            </ModalFooter>
        </Modal>

        <div className="flex flex-col lg:flex-row w-screen lg:h-[93vh]">
            <div id="primary-content"
                 className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full flex text-center flex-col justify-center items-center overflow-y-auto"
                 aria-label={t('a11y.waitTime')}>
                <h1 className="text-7xl font-display mb-3 flex items-center">
                    <Badge className="mr-3 rounded-full h-12 w-12 flex justify-center items-center" color="warning">
                        <HiHashtag className="text-2xl"/>
                    </Badge>
                    {order.id}
                    <span className="sr-only">{t('a11y.orderNumber')}</span>
                </h1>
                <div aria-label={t('a11y.waitTime')} className="mb-5">
                    <If condition={order.paymentStatus === PaymentStatus.paid || (order.paymentMethod === PaymentMethod.payLater && order.paymentStatus === PaymentStatus.notPaid)}>
                        <If condition={order.status === OrderStatus.waiting}>
                            <If condition={estimate != null}>
                                <p className="text-lg"><Trans t={t} i18nKey="details.waitTime.cups"
                                                              count={estimate?.cups ?? -1}/></p>
                                <p className="text-lg flex items-center justify-center gap-3">
                                    <Trans t={t} i18nKey="details.waitTime.minutes"
                                           count={estimate?.time ?? -1}/>
                                    <Popover trigger="hover" aria-hidden content={<span className="p-3 text-sm">
                                    {t('details.waitTime.finePrint')}
                                </span>}>
                                        <Badge color="warning" icon={HiMagnifyingGlass}/>
                                    </Popover>
                                </p>
                                <span className="sr-only">{t('details.waitTime.finePrint')}</span>
                            </If>
                            <If condition={estimate == null}>
                                <Spinner color="warning"/>
                            </If>
                        </If>
                        <If condition={order.status === OrderStatus.done}>
                            <p className="text-lg">{t(`details.waitTime.done_${order.type}`)}</p>
                        </If>
                    </If>
                </div>

                <Alert color="green" rounded className="mb-3 w-full text-left" icon={HiInformationCircle}>
                    {t('details.orderNumberPrompt')}
                </Alert>

                <Alert color="green" rounded className="mb-3 w-full text-left" icon={HiInformationCircle}>
                    {t('details.contactPrompt')}
                </Alert>

                <If condition={order.type === OrderType.pickUp}>
                    <Alert color="yellow" rounded className="mb-3 w-full text-left" icon={HiInformationCircle}>
                        <Trans t={t} i18nKey="details.pickUpPrompt"
                               components={{ 1: <span className="font-bold" key="highlight"/> }}/>
                    </Alert>
                </If>

                <If condition={order.paymentStatus === PaymentStatus.refunded}>
                    <Alert color="yellow" rounded className="mb-3 w-full text-left" icon={HiInformationCircle}>
                        {t('details.refundedPrompt')}
                    </Alert>
                </If>

                <If condition={order.paymentStatus === PaymentStatus.notPaid}>
                    <If condition={order.paymentMethod === PaymentMethod.payLater}>
                        <Alert additionalContent={<div className="text-left">
                            <p className="mb-1">{t('details.paymentPromptPayLater')}</p>
                            <Button size="xs" pill color="warning"
                                    className="inline-block"
                                    onClick={() => setPayModal(true)}>{t('details.payNow')}</Button>
                        </div>}
                               color="yellow" rounded className="mb-3 w-full text-left" icon={HiInformationCircle}>
                            <span className="font-bold">{t('details.paymentTitle')}</span>
                        </Alert>
                    </If>
                    <If condition={order.paymentMethod !== PaymentMethod.payLater}>
                        <Alert additionalContent={<div className="text-left">
                            <p className="mb-1">{t('details.paymentPrompt')}</p>
                            <div className="flex gap-3">
                                <Link href={`/order/checkout/wechat/pay?id=${order.id}`}>
                                    <Button size="xs" pill color="warning"
                                            className="inline-block">{t('details.payNow')}</Button>
                                </Link>
                                <Button size="xs" pill color="failure" onClick={cancel}
                                        className="inline-block">{t('details.cancelOrder')}</Button>
                            </div>
                        </div>}
                               color="yellow" rounded className="mb-3 w-full text-left" icon={HiInformationCircle}>
                            <span className="font-bold">{t('details.paymentTitle')}</span>
                        </Alert>
                    </If>
                </If>

                <If condition={shoppingCart.onSiteOrderMode}>
                    <Link href="/order">
                        <Button color="warning" pill className="mb-3">{t('details.onSiteContinue')}</Button>
                    </Link>
                </If>

                <If condition={order.paymentStatus === PaymentStatus.paid}>
                    <p className="text-xs secondary">{t('details.refundTip')}</p>
                </If>
            </div>
            <div
                className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto border-l border-yellow-100 dark:border-yellow-800"
                aria-label={t('a11y.orderedItems')}>
                <p>{t('checkout.total')}</p>
                <p className="text-lg mb-5">¥{order.totalPrice}</p>
                <div className="flex flex-col gap-5">
                    {order.items.map((item, index) =>
                        <UIOrderedItemTemplate key={index} item={{
                            item: item.itemType,
                            amount: item.amount,
                            options: item.appliedOptions
                        }} index={-1} uploadPrefix={uploadPrefix} price={item.price}/>)}
                </div>
            </div>
        </div>
    </>
}
