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
import { Spinner } from 'flowbite-react'
import Beluga from '@/app/core-components/Beluga'
import { HiChatAlt2, HiLocationMarker, HiReceiptTax } from 'react-icons/hi'
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

    return <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr_22rem] gap-6 lg:gap-10 items-start">
            <div id="primary-content" className="flex flex-col gap-6" aria-label={t('a11y.waitTime')}>
                <section className="toon relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-4 px-6 pt-6 pb-4">
                        <div className="text-center sm:text-left flex-1">
                            <p className="font-toon text-lg secondary">{t('pickupCode')}</p>
                            <h1 className="font-toon text-8xl leading-none my-1">
                                {order.id}
                                <span className="sr-only">{t('a11y.orderNumber')}</span>
                            </h1>
                            <p className="text-sm secondary">{t('details.orderNumberPrompt')}</p>
                        </div>
                        <Beluga mood={order.status === OrderStatus.done ? 'cheer' : step === 0 ? 'sleepy' : 'happy'}
                                withCup={order.status === OrderStatus.done} className="w-40 sm:w-48 bob"/>
                    </div>

                    <If condition={step > 0}>
                        <ol className="flex items-center gap-2 px-6 pb-5" aria-hidden>
                            {steps.map((label, index) => <li key={label} className={`flex items-center gap-2 ${index > 0 ? 'flex-1' : ''}`}>
                                {index > 0 ? <span className={`flex-1 h-1 rounded-full ${index < step ? 'bg-ink' : 'bg-ink/15'}`}/> : null}
                                <span className={`h-8 px-3 rounded-full border-2 font-toon text-sm flex items-center whitespace-nowrap
                                ${index < step ? 'border-ink bg-mint text-[#1f3d2a]' : 'border-ink/25 secondary'}`}>{label}</span>
                            </li>)}
                        </ol>
                    </If>

                    <div className="px-6 py-4 border-t-2 border-dashed border-ink/25 bg-cream/60" aria-label={t('a11y.waitTime')}>
                        <If condition={isActive}>
                            <If condition={order.status === OrderStatus.waiting}>
                                <If condition={estimate != null}>
                                    <p className="font-toon text-2xl">
                                        <Trans t={t} i18nKey="details.waitTime.minutes" count={estimate?.time ?? -1}/>
                                        <span className="ml-3 text-base secondary">
                                            <Trans t={t} i18nKey="details.waitTime.cups" count={estimate?.cups ?? -1}/>
                                        </span>
                                    </p>
                                    <p className="text-xs secondary mt-1">{t('details.waitTime.finePrint')}</p>
                                </If>
                                <If condition={estimate == null}>
                                    <Spinner color="warning"/>
                                </If>
                            </If>
                            <If condition={order.status === OrderStatus.done}>
                                <p className="font-toon text-2xl">{t(`details.waitTime.done_${order.type}`)}</p>
                            </If>
                        </If>
                        <If condition={order.type === OrderType.pickUp && isValidPickUpTime(order.pickUpTime)}>
                            <p className="mt-2 text-sm">
                                <span className="secondary">{t('details.pickUpTime')}</span>
                                <span className="ml-2 font-toon text-lg">{t(`checkout.pickUpTimeOptions.${order.pickUpTime}`)}</span>
                            </p>
                        </If>
                    </div>
                </section>

                <If condition={order.paymentStatus === PaymentStatus.notPaid}>
                    <section className="toon p-5 bg-butter/40">
                        <p className="font-toon text-xl mb-1">{t('details.paymentTitle')}</p>
                        <p className="text-sm mb-4">{order.paymentMethod === PaymentMethod.payLater ? t('details.paymentPromptPayLater') : t('details.paymentPrompt')}</p>
                        <div className="flex flex-wrap gap-3">
                            <Link href={`/order/checkout?order=${order.id}`} className="toon-btn h-11">{t('details.payNow')}</Link>
                            <If condition={order.paymentMethod !== PaymentMethod.payLater}>
                                <button className="toon-btn-ghost h-11" onClick={cancel}>{t('details.cancelOrder')}</button>
                            </If>
                        </div>
                    </section>
                </If>

                <If condition={order.paymentStatus === PaymentStatus.refunded}>
                    <section className="toon p-5 bg-blush/40 font-toon text-lg">{t('details.refundedPrompt')}</section>
                </If>

                <If condition={shoppingCart.onSiteOrderMode}>
                    <Link href="/order" className="toon-btn self-start">{t('details.onSiteContinue')}</Link>
                </If>

                <section className="toon-flat border-dashed p-5">
                    <h2 className="text-xl mb-3">{t('details.goodToKnow')}</h2>
                    <ul className="flex flex-col gap-3 text-sm">
                        <If condition={order.type === OrderType.pickUp}>
                            <li className="flex items-start gap-3"><span aria-hidden className="h-7 w-7 flex-shrink-0 rounded-full border-2 border-ink bg-paper flex items-center justify-center"><HiLocationMarker/></span><span><Trans t={t} i18nKey="details.pickUpPrompt"
                                                                                                 components={{ 1: <span className="font-bold" key="highlight"/> }}/></span></li>
                        </If>
                        <li className="flex items-start gap-3"><span aria-hidden className="h-7 w-7 flex-shrink-0 rounded-full border-2 border-ink bg-paper flex items-center justify-center"><HiChatAlt2/></span><span>{t('details.contactPrompt')}</span></li>
                        <If condition={order.paymentStatus === PaymentStatus.paid}>
                            <li className="flex items-start gap-3"><span aria-hidden className="h-7 w-7 flex-shrink-0 rounded-full border-2 border-ink bg-paper flex items-center justify-center"><HiReceiptTax/></span><span>{t('details.refundTip')}</span></li>
                        </If>
                    </ul>
                </section>
            </div>

            <aside className="toon lg:sticky lg:top-24 flex flex-col overflow-hidden" aria-label={t('a11y.orderedItems')}>
                <div className="px-5 py-4 border-b-2 border-dashed border-ink/25 bg-whale/40">
                    <h2 className="text-xl">{t('checkout.orderDetails')}</h2>
                </div>
                <div className="flex flex-col gap-4 px-5 py-5">
                    {order.items.map((item, index) =>
                        <UIOrderedItemTemplate key={index} item={{
                            item: item.itemType,
                            amount: item.amount,
                            options: item.appliedOptions
                        }} index={-1} uploadPrefix={uploadPrefix} price={item.price}/>)}
                </div>
                <div className="flex items-baseline justify-between px-5 py-4 border-t-2 border-dashed border-ink/25">
                    <span className="font-toon text-lg">{t('checkout.total')}</span>
                    <span className="font-toon text-4xl">¥{order.totalPrice}</span>
                </div>
            </aside>
        </div>
    </div>
}
