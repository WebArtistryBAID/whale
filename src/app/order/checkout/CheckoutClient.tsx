'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart, useStoredOrder } from '@/app/lib/shopping-cart'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { Trans } from 'react-i18next/TransWithoutContext'
import If from '@/app/lib/If'
import { Button, ButtonGroup, Popover, TextInput } from 'flowbite-react'
import { CouponCode, PaymentMethod, PaymentStatus, User } from '@prisma/client'
import { canPayWithBalance, canPayWithPayLater, couponQuickValidate, createOrder } from '@/app/lib/ordering-actions'
import Decimal from 'decimal.js'
import { getMyUser } from '@/app/login/login-actions'
import Link from 'next/link'
import { HiInformationCircle } from 'react-icons/hi'

function isMobileOriPad(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

function PaymentMethodButton({ paymentMethod, selected, select, disabled }: {
    paymentMethod: PaymentMethod,
    selected: boolean,
    select: () => void,
    disabled: boolean
}) {
    const { t } = useTranslationClient('order')
    return <Button color={selected ? 'warning' : 'gray'} pill size="xs"
                   onClick={select} disabled={disabled}>
        {t(`checkout.${paymentMethod}`)}
        <If condition={selected}>
            <span className="sr-only">{t('a11y.selected')}</span>
        </If>
    </Button>
}

export default function CheckoutClient({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const storedOrder = useStoredOrder()
    const router = useRouter()
    const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>(PaymentMethod.wxPay)
    const [ coupon, setCoupon ] = useState('')
    const [ foundCoupon, setFoundCoupon ] = useState<CouponCode | null>(null)
    const [ me, setMe ] = useState<User | null>(null)
    const [ useDelivery, setUseDelivery ] = useState(false)
    const [ deliveryRoom, setDeliveryRoom ] = useState('')
    const [ orderFailed, setOrderFailed ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ balanceEnabled, setBalanceEnabled ] = useState(true)
    const [ payLaterEnabled, setPayLaterEnabled ] = useState(true)

    useEffect(() => {
        if (shoppingCart.items.length < 1) {
            router.push('/order')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ router ])

    useEffect(() => {
        (async () => {
            if (coupon.length < 1) {
                setFoundCoupon(null)
            } else {
                setLoading(true)
                setFoundCoupon(await couponQuickValidate(coupon))
                setLoading(false)
            }
        })()
    }, [ coupon ])

    useEffect(() => {
        (async () => {
            setLoading(true)
            setMe(await getMyUser())
            setLoading(false)
        })()
    }, [])

    useEffect(() => {
        (async () => {
            setBalanceEnabled(await canPayWithBalance(getRealTotal().toString()))
            setPayLaterEnabled(await canPayWithPayLater())
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ shoppingCart.items, foundCoupon ])

    function getRealTotal(): Decimal {
        if (foundCoupon == null) {
            return shoppingCart.getTotalPrice()
        }
        return Decimal.max(0, shoppingCart.getTotalPrice().minus(Decimal(foundCoupon?.value ?? '0')))
    }

    function getActualCouponValue(): Decimal {
        return shoppingCart.getTotalPrice().minus(getRealTotal())
    }

    function isCouponTooBig(): boolean {
        if (foundCoupon == null) {
            return false
        }
        return Decimal(foundCoupon.value).greaterThan(shoppingCart.getTotalPrice())
    }

    async function order() {
        setLoading(true)
        const order = await createOrder(shoppingCart.items, coupon.length > 0 ? coupon : null, shoppingCart.onSiteOrderMode,
            useDelivery ? deliveryRoom : null, paymentMethod)
        setLoading(false)
        if (order == null) {
            setOrderFailed(true)
            return
        }
        storedOrder.setOrder(order.id)
        shoppingCart.clear()
        if (order.paymentStatus === PaymentStatus.paid || paymentMethod === PaymentMethod.payLater) {
            // Redirect to check page directly
            router.push(`/order/details/${order.id}`)
        } else {
            // Start payment process
            router.push(`/order/checkout/wechat/${order.id}`)
        }
    }

    return <div className="flex flex-col lg:flex-row w-screen lg:h-[93vh]">
        <div className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto" aria-label={t('checkout.title')}>
            <h1 aria-hidden className="mb-5">{t('checkout.title')}</h1>

            <ButtonGroup className="mb-3">
                <Button color={useDelivery ? 'gray' : 'warning'} onClick={() => setUseDelivery(false)}>
                    {t('checkout.pickUp')}
                    <If condition={!useDelivery}>
                        <span className="sr-only">{t('a11y.selected')}</span>
                    </If>
                </Button>

                <Button color={useDelivery ? 'warning' : 'gray'} onClick={() => setUseDelivery(true)}>
                    {t('checkout.delivery')}
                    <If condition={useDelivery}>
                        <span className="sr-only">{t('a11y.selected')}</span>
                    </If>
                </Button>
            </ButtonGroup>

            <p aria-hidden className="mb-1">{t('checkout.orderDetails')}</p>
            <div className="mb-5 text-sm p-5 bg-yellow-50 dark:bg-yellow-800 rounded-3xl"
                 aria-label={t('checkout.orderDetails')}>
                <p className="text-sm">{t('checkout.total')}</p>
                <p className="mb-3 text-lg">¥{getRealTotal().toString()}</p>
                <p className="text-sm">{t('checkout.wait')}</p>
                <p className="text-lg"><Trans t={t} i18nKey="checkout.waitTime" count={3}/></p>
                <If condition={foundCoupon != null}>
                    <p className="text-sm mt-3" aria-hidden>{t('checkout.coupon')}</p>
                    <p className="text-lg" aria-hidden>-¥{getActualCouponValue().toString()}</p>
                    <span className="sr-only"
                          aria-live="polite">{t('a11y.coupon', { price: getActualCouponValue() })}</span>
                </If>
            </div>

            <p aria-hidden className="mb-1">{t('checkout.paymentMethod')}</p>
            <div className="mb-5" aria-label={t('checkout.paymentMethod')}>
                <div className="flex flex-wrap gap-3 items-center">
                    <PaymentMethodButton paymentMethod={PaymentMethod.wxPay}
                                         selected={paymentMethod === PaymentMethod.wxPay}
                                         disabled={loading}
                                         select={() => setPaymentMethod(PaymentMethod.wxPay)}/>

                    <If condition={shoppingCart.onSiteOrderMode}>
                        <PaymentMethodButton paymentMethod={PaymentMethod.cash}
                                             selected={paymentMethod === PaymentMethod.cash}
                                             disabled={loading}
                                             select={() => setPaymentMethod(PaymentMethod.cash)}/>
                    </If>

                    <If condition={me != null && !shoppingCart.onSiteOrderMode}>
                        <PaymentMethodButton paymentMethod={PaymentMethod.balance}
                                             disabled={!balanceEnabled || loading}
                                             selected={paymentMethod === PaymentMethod.balance}
                                             select={() => setPaymentMethod(PaymentMethod.balance)}/>
                        <PaymentMethodButton paymentMethod={PaymentMethod.payLater}
                                             disabled={!payLaterEnabled || loading}
                                             selected={paymentMethod === PaymentMethod.payLater}
                                             select={() => setPaymentMethod(PaymentMethod.payLater)}/>
                    </If>

                    <If condition={isMobileOriPad() && !shoppingCart.onSiteOrderMode}>
                        <PaymentMethodButton paymentMethod={PaymentMethod.payForMe}
                                             disabled={loading}
                                             selected={paymentMethod === PaymentMethod.payForMe}
                                             select={() => setPaymentMethod(PaymentMethod.payForMe)}/>
                    </If>

                    <Popover trigger="hover" aria-hidden content={<div className="p-3">
                        <If condition={!shoppingCart.onSiteOrderMode}>
                            <p className="mt-1 text-sm">{t('checkout.onSiteNag')}</p>
                        </If>
                        <If condition={me == null && !shoppingCart.onSiteOrderMode}>
                            <p className="text-sm">
                                <Trans t={t} i18nKey="checkout.loginNag"
                                       components={{ 1: <Link key="login" href="/user" className="inline"/> }}/>
                            </p>
                        </If>
                        <If condition={me != null && !balanceEnabled}>
                            <p className="mt-1 text-sm">{t('checkout.balanceDisabled')}</p>
                        </If>
                        <If condition={me != null && !payLaterEnabled}>
                            <p className="mt-1 text-sm">{t('checkout.payLaterDisabled')}</p>
                        </If>
                    </div>}>
                        <HiInformationCircle className="text-yellow-300 dark:text-yellow-600"/>
                    </Popover>
                </div>

                <div aria-label={t('a11y.paymentMethods')} className="sr-only">
                    <If condition={!shoppingCart.onSiteOrderMode}>
                        <p className="mt-1 text-sm">{t('checkout.onSiteNag')}</p>
                    </If>
                    <If condition={me == null && !shoppingCart.onSiteOrderMode}>
                        <p className="text-sm">
                            <Trans t={t} i18nKey="checkout.loginNag"
                                   components={{ 1: <Link key="login" href="/user" className="inline"/> }}/>
                        </p>
                    </If>
                    <If condition={me != null && !balanceEnabled}>
                        <p className="mt-1 text-sm">{t('checkout.balanceDisabled')}</p>
                    </If>
                    <If condition={me != null && !payLaterEnabled}>
                        <p className="mt-1 text-sm">{t('checkout.payLaterDisabled')}</p>
                    </If>
                </div>
            </div>

            <p aria-hidden className="mb-1">{t('checkout.coupon')}</p>
            <TextInput className="w-full" type="text" value={coupon} placeholder={t('checkout.coupon') + '...'}
                       onChange={e => setCoupon(e.currentTarget.value)}/>
            <p className="mt-1 text-sm text-red-500" aria-live="polite">
                <If condition={coupon.length > 0 && foundCoupon == null}>
                    {t('checkout.couponInvalid')}
                </If>
            </p>
            <p className="mt-1 text-sm" aria-live="polite">
                <If condition={foundCoupon != null && isCouponTooBig()}>
                    {t('checkout.couponTooBig', { original: foundCoupon?.value })}
                </If>
            </p>

            <If condition={useDelivery}>
                <p aria-hidden className="mt-5 mb-1">{t('checkout.deliveryRoom')}</p>
                <TextInput className="w-full" type="text" value={deliveryRoom}
                           placeholder={t('checkout.deliveryRoom') + '...'}
                           onChange={e => setDeliveryRoom(e.currentTarget.value)}/>
            </If>

            <Button fullSized className="mt-8" color="warning" onClick={order}
                    disabled={(coupon.length > 0 && foundCoupon == null) || (useDelivery && deliveryRoom.length < 3) || loading}>
                <If condition={orderFailed}>
                    {t('tryAgain')}
                </If>
                <If condition={!orderFailed}>
                    <If condition={getRealTotal().eq(0) || paymentMethod === PaymentMethod.cash}>
                        {t('continue')}
                    </If>
                    <If condition={!(getRealTotal().eq(0) || paymentMethod === PaymentMethod.cash)}>
                        {t('checkout.pay')}
                    </If>
                </If>
            </Button>
        </div>
        <div
            className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto border-l border-yellow-100 dark:border-yellow-800 flex flex-col gap-5"
            aria-label={t('a11y.orderedItems')}>
            {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate key={index} item={item} index={-1}
                                                                            uploadPrefix={uploadPrefix}/>)}
        </div>
    </div>
}
