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
import { Button, Spinner } from 'flowbite-react'
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

    return <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="grid lg:grid-cols-[1fr_22rem] gap-8 lg:gap-16 items-start">
            <div id="primary-content" className="flex flex-col" aria-label={t('a11y.waitTime')}>
                <section className="card">
                    <div className="px-6 lg:px-8 pt-6 pb-7 text-center">
                        <p className="text-sm secondary">{t('details.orderNumberPrompt')}</p>
                        <h1 className="font-serif text-7xl lg:text-8xl font-semibold tabular-nums my-3">
                            <span className="text-4xl lg:text-5xl align-top mr-1 secondary">No.</span>{order.id}
                            <span className="sr-only">{t('a11y.orderNumber')}</span>
                        </h1>
                        <If condition={order.type === OrderType.pickUp && isValidPickUpTime(order.pickUpTime)}>
                            <p className="text-sm">
                                <span className="secondary">{t('details.pickUpTime')}</span>
                                <span className="ml-2 font-semibold">{t(`checkout.pickUpTimeOptions.${order.pickUpTime}`)}</span>
                            </p>
                        </If>
                    </div>
                    <div className="perforation"/>
                    <div className="px-6 lg:px-8 py-6" aria-label={t('a11y.waitTime')}>
                        <If condition={step > 0}>
                            <ol className="flex items-center mb-5 text-sm" aria-hidden>
                                {steps.map((label, index) => <li key={label}
                                                                 className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
                                    {index > 0 ? <span className={`flex-1 h-px mx-3 ${index < step ? 'bg-espresso dark:bg-stone-300' : 'bg-cream-300 dark:bg-white/20'}`}/> : null}
                                    <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs mr-2
                                    ${index < step ? 'bg-espresso border-espresso text-cream dark:bg-stone-200 dark:border-stone-200 dark:text-espresso' : 'border-cream-300 dark:border-white/30 secondary'}`}>
                                        {index < step ? '✓' : index + 1}
                                    </span>
                                    <span className={index < step ? 'font-semibold' : 'secondary'}>{label}</span>
                                </li>)}
                            </ol>
                        </If>
                        <If condition={isActive}>
                            <If condition={order.status === OrderStatus.waiting}>
                                <If condition={estimate != null}>
                                    <p className="text-xl font-bold"><Trans t={t} i18nKey="details.waitTime.minutes"
                                                                            count={estimate?.time ?? -1}/>
                                        <span className="ml-3 text-sm font-normal secondary"><Trans t={t}
                                                                                                    i18nKey="details.waitTime.cups"
                                                                                                    count={estimate?.cups ?? -1}/></span>
                                    </p>
                                    <p className="text-xs secondary mt-1">{t('details.waitTime.finePrint')}</p>
                                </If>
                                <If condition={estimate == null}>
                                    <Spinner color="warning"/>
                                </If>
                            </If>
                            <If condition={order.status === OrderStatus.done}>
                                <p className="text-xl font-bold">{t(`details.waitTime.done_${order.type}`)}</p>
                            </If>
                        </If>
                        <If condition={order.paymentStatus === PaymentStatus.refunded}>
                            <p className="font-semibold text-caramel dark:text-caramel-100">{t('details.refundedPrompt')}</p>
                        </If>
                        <If condition={order.paymentStatus === PaymentStatus.notPaid}>
                            <p className="font-bold mb-1">{t('details.paymentTitle')}</p>
                            <p className="secondary text-sm mb-4">{order.paymentMethod === PaymentMethod.payLater ? t('details.paymentPromptPayLater') : t('details.paymentPrompt')}</p>
                            <div className="flex gap-3">
                                <Link href={`/order/checkout?order=${order.id}`}>
                                    <Button color="warning">{t('details.payNow')}</Button>
                                </Link>
                                <If condition={order.paymentMethod !== PaymentMethod.payLater}>
                                    <Button color="gray" onClick={cancel}>{t('details.cancelOrder')}</Button>
                                </If>
                            </div>
                        </If>
                    </div>
                </section>

                <If condition={shoppingCart.onSiteOrderMode}>
                    <Link href="/order" className="self-start mt-5">
                        <Button color="warning">{t('details.onSiteContinue')}</Button>
                    </Link>
                </If>

                <section className="mt-8">
                    <h2 className="text-base font-bold mb-3">{t('details.goodToKnow')}</h2>
                    <ul className="text-sm divide-y divide-cream-200 dark:divide-white/10 border-y border-cream-200 dark:border-white/10">
                        <If condition={order.type === OrderType.pickUp}>
                            <li className="py-3"><Trans t={t} i18nKey="details.pickUpPrompt"
                                                         components={{ 1: <span className="font-bold" key="highlight"/> }}/></li>
                        </If>
                        <li className="py-3">{t('details.contactPrompt')}</li>
                        <If condition={order.paymentStatus === PaymentStatus.paid}>
                            <li className="py-3">{t('details.refundTip')}</li>
                        </If>
                    </ul>
                </section>
            </div>

            <aside className="card lg:sticky lg:top-24 flex flex-col" aria-label={t('a11y.orderedItems')}>
                <h2 className="text-base font-bold px-6 pt-5 pb-4">{t('checkout.orderDetails')}</h2>
                <div className="flex flex-col gap-4 px-6 pb-5">
                    {order.items.map((item, index) =>
                        <UIOrderedItemTemplate key={index} item={{
                            item: item.itemType,
                            amount: item.amount,
                            options: item.appliedOptions
                        }} index={-1} uploadPrefix={uploadPrefix} price={item.price}/>)}
                </div>
                <div className="perforation"/>
                <div className="flex items-baseline px-6 pt-5 pb-6">
                    <span className="font-semibold mr-auto">{t('checkout.total')}</span>
                    <span className="price text-3xl">¥{order.totalPrice}</span>
                </div>
            </aside>
        </div>
    </div>
}
