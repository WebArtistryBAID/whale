'use client'

import {
    cancelUnpaidOrder,
    EstimatedWaitTimeResponse,
    getEstimatedWaitTimeFor,
    getOrder,
    HydratedOrder
} from '@/app/lib/ordering-actions'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@/generated/prisma/browser'
import { Trans } from 'react-i18next/TransWithoutContext'
import { useEffect, useState } from 'react'
import { Alert, Button, Spinner } from 'flowbite-react'
import { HiChatAlt2, HiClock, HiInformationCircle, HiLocationMarker } from 'react-icons/hi'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import Link from 'next/link'
import { isValidPickUpTime } from '@/app/lib/pick-up-times'

export default function OrderDetailsClient({ initialOrder, uploadPrefix }: {
    initialOrder: HydratedOrder,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('order')
    const [ order, setOrder ] = useState(initialOrder)
    const [ estimate, setEstimate ] = useState<EstimatedWaitTimeResponse | null>(null)
    const shoppingCart = useShoppingCart()

    useEffect(() => {
        (async () => {
            if (order.status === OrderStatus.waiting) {
                setEstimate(await getEstimatedWaitTimeFor(order.id))
            }
        })()
    }, [ order.id, order.status ])

    useEffect(() => {
        const intervalId = setInterval(async () => {
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
        return () => clearInterval(intervalId)
    }, [ order.id ])

    async function cancel() {
        await cancelUnpaidOrder(order.id)
        location.href = '/'
    }

    const isActive = order.paymentStatus === PaymentStatus.paid ||
        (order.paymentMethod === PaymentMethod.payLater && order.paymentStatus === PaymentStatus.notPaid)
    const step = order.paymentStatus === PaymentStatus.refunded ? 0
        : order.status === OrderStatus.done ? 3
            : isActive ? 2 : 1
    const steps = [
        t('details.steps.placed'),
        t('details.steps.preparing'),
        order.type === OrderType.delivery ? t('details.steps.readyDelivery') : t('details.steps.ready')
    ]

    return <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <div className="grid lg:grid-cols-[1fr_22rem] gap-6 lg:gap-8 items-start">
            <div id="primary-content" className="flex flex-col gap-5" aria-label={t('a11y.waitTime')}>
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-espresso to-caramel
                text-white p-6 lg:p-8 shadow-lift">
                    <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"/>
                    <p className="text-sm text-white/70 mb-1">{t('details.orderNumberPrompt')}</p>
                    <h1 className="text-6xl lg:text-7xl font-bold tabular-nums tracking-tight mb-6">
                        #{order.id}
                        <span className="sr-only">{t('a11y.orderNumber')}</span>
                    </h1>

                    <If condition={step > 0}>
                        <ol className="flex items-center gap-2 mb-6" aria-hidden>
                            {steps.map((label, index) => <li key={label} className="flex-1">
                                <div className={`h-1.5 rounded-full mb-2 ${index < step ? 'bg-white' : 'bg-white/25'}`}/>
                                <span className={`text-xs ${index < step ? 'font-semibold' : 'text-white/60'}`}>{label}</span>
                            </li>)}
                        </ol>
                    </If>

                    <div aria-label={t('a11y.waitTime')} className="min-h-12">
                        <If condition={isActive}>
                            <If condition={order.status === OrderStatus.waiting}>
                                <If condition={estimate != null}>
                                    <p className="text-2xl font-bold"><Trans t={t} i18nKey="details.waitTime.minutes"
                                                                             count={estimate?.time ?? -1}/></p>
                                    <p className="text-white/80"><Trans t={t} i18nKey="details.waitTime.cups"
                                                                        count={estimate?.cups ?? -1}/></p>
                                    <p className="text-xs text-white/60 mt-2">{t('details.waitTime.finePrint')}</p>
                                </If>
                                <If condition={estimate == null}>
                                    <Spinner color="warning"/>
                                </If>
                            </If>
                            <If condition={order.status === OrderStatus.done}>
                                <p className="text-2xl font-bold">{t(`details.waitTime.done_${order.type}`)}</p>
                            </If>
                        </If>
                    </div>
                </section>

                <If condition={order.paymentStatus === PaymentStatus.notPaid}>
                    <section className="card p-5 lg:p-6 border-amber-300/70 dark:border-amber-700/50">
                        <p className="font-bold mb-1">{t('details.paymentTitle')}</p>
                        <p className="secondary text-sm mb-4">{order.paymentMethod === PaymentMethod.payLater ? t('details.paymentPromptPayLater') : t('details.paymentPrompt')}</p>
                        <div className="flex gap-3">
                            <Link href={`/order/checkout?order=${order.id}`}>
                                <Button pill color="warning">{t('details.payNow')}</Button>
                            </Link>
                            <If condition={order.paymentMethod !== PaymentMethod.payLater}>
                                <Button pill color="gray" onClick={cancel}>{t('details.cancelOrder')}</Button>
                            </If>
                        </div>
                    </section>
                </If>

                <If condition={order.paymentStatus === PaymentStatus.refunded}>
                    <Alert color="warning" rounded className="rounded-3xl" icon={HiInformationCircle}>
                        {t('details.refundedPrompt')}
                    </Alert>
                </If>

                <If condition={shoppingCart.onSiteOrderMode}>
                    <Link href="/order" className="self-start">
                        <Button color="warning" pill>{t('details.onSiteContinue')}</Button>
                    </Link>
                </If>

                <section className="card p-5 lg:p-6">
                    <p className="font-bold mb-3">{t('details.goodToKnow')}</p>
                    <ul className="flex flex-col gap-3 text-sm">
                        <If condition={order.type === OrderType.pickUp}>
                            <li className="flex gap-3">
                                <HiLocationMarker className="text-lg text-caramel flex-shrink-0 mt-0.5"/>
                                <span><Trans t={t} i18nKey="details.pickUpPrompt"
                                             components={{ 1: <span className="font-bold" key="highlight"/> }}/></span>
                            </li>
                        </If>
                        <li className="flex gap-3">
                            <HiChatAlt2 className="text-lg text-caramel flex-shrink-0 mt-0.5"/>
                            <span>{t('details.contactPrompt')}</span>
                        </li>
                        <If condition={order.paymentStatus === PaymentStatus.paid}>
                            <li className="flex gap-3">
                                <HiInformationCircle className="text-lg text-caramel flex-shrink-0 mt-0.5"/>
                                <span>{t('details.refundTip')}</span>
                            </li>
                        </If>
                    </ul>
                </section>
            </div>

            <aside className="card p-5 lg:p-6 lg:sticky lg:top-24 flex flex-col gap-5" aria-label={t('a11y.orderedItems')}>
                <If condition={order.type === OrderType.pickUp && isValidPickUpTime(order.pickUpTime)}>
                    <div className="rounded-2xl bg-caramel-50 dark:bg-white/5 p-4 flex items-center gap-3">
                        <HiClock className="text-2xl text-caramel"/>
                        <div>
                            <p className="text-xs secondary">{t('details.pickUpTime')}</p>
                            <p className="font-bold">{t(`checkout.pickUpTimeOptions.${order.pickUpTime}`)}</p>
                        </div>
                    </div>
                </If>
                <div className="flex flex-col gap-4">
                    {order.items.map((item, index) =>
                        <UIOrderedItemTemplate key={index} item={{
                            item: item.itemType,
                            amount: item.amount,
                            options: item.appliedOptions
                        }} index={-1} uploadPrefix={uploadPrefix} price={item.price}/>)}
                </div>
                <div className="flex items-baseline justify-between border-t border-dashed border-cream-200 dark:border-white/10 pt-4">
                    <span className="font-semibold">{t('checkout.total')}</span>
                    <span className="price text-2xl">¥{order.totalPrice}</span>
                </div>
            </aside>
        </div>
    </div>
}
