'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart, useStoredOrder } from '@/app/lib/shopping-cart'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { Trans } from 'react-i18next/TransWithoutContext'
import If from '@/app/lib/If'
import {
    Badge,
    Button,
    ButtonGroup,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Popover,
    Spinner,
    TextInput
} from 'flowbite-react'
import { CouponCode, PaymentMethod, PaymentStatus, User, UserAuditLog } from '@/generated/prisma/browser'
import type { HydratedOrder } from '@/app/lib/ordering-actions'
import {
    canPayWithBalance,
    canPayWithPayLater,
    couponQuickValidate,
    createOrder,
    getEstimatedWaitTime,
    payOrderWithBalance,
    setOrderPaymentMethod
} from '@/app/lib/ordering-actions'
import Decimal from 'decimal.js'
import { getMyUser } from '@/app/login/login-actions'
import Link from 'next/link'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { getConfigValueAsBoolean } from '@/app/lib/settings-actions'
import { getStripeRedirectURI } from '@/app/lib/stripe-actions'

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

type CheckoutMode = 'cart' | 'order' | 'recharge'

export default function CheckoutClient({ showPayLater, uploadPrefix, existingOrder, rechargeTransaction }: {
    showPayLater: boolean,
    uploadPrefix: string,
    existingOrder?: HydratedOrder | null,
    rechargeTransaction?: UserAuditLog | null
}) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const storedOrder = useStoredOrder()
    const router = useRouter()
    const mode: CheckoutMode = rechargeTransaction != null ? 'recharge' : (existingOrder != null ? 'order' : 'cart')
    const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>(existingOrder?.paymentStatus === PaymentStatus.notPaid && existingOrder.paymentMethod !== PaymentMethod.payLater ? existingOrder.paymentMethod : PaymentMethod.wxPay)
    const [ coupon, setCoupon ] = useState('')
    const [ foundCoupon, setFoundCoupon ] = useState<CouponCode | null>(null)
    const [ me, setMe ] = useState<User | null>(null)
    const [ useDelivery, setUseDelivery ] = useState(false)
    const [ deliveryRoom, setDeliveryRoom ] = useState('')
    const [ orderFailed, setOrderFailed ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ awaitRedirect, setAwaitRedirect ] = useState(false)
    const [ redirectTarget, setRedirectTarget ] = useState('#')
    const [ balanceEnabled, setBalanceEnabled ] = useState(false)
    const [ payLaterEnabled, setPayLaterEnabled ] = useState(false)
    const [ deliveryEnabled, setDeliveryEnabled ] = useState(false)
    const [ waitTime, setWaitTime ] = useState(-1)
    const [ showLoginNag, setShowLoginNag ] = useState(false)

    useEffect(() => {
        router.prefetch('/order/checkout/wechat/pay')
        if (mode === 'cart' && shoppingCart.items.length < 1) {
            router.replace('/order')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ router, mode ])

    useEffect(() => {
        (async () => {
            if (mode !== 'cart') {
                return
            }
            if (coupon.length < 1) {
                setFoundCoupon(null)
            } else {
                setLoading(true)
                setFoundCoupon(await couponQuickValidate(coupon))
                setLoading(false)
            }
        })()
    }, [ coupon, mode ])

    useEffect(() => {
        (async () => {
            setLoading(true)
            setMe(await getMyUser())
            if (mode === 'cart') {
                setWaitTime((await getEstimatedWaitTime()).time)
            }
            setLoading(false)
        })()
    }, [ mode ])

    useEffect(() => {
        (async () => {
            if (mode === 'cart') {
                setBalanceEnabled(await canPayWithBalance(getRealTotal().toString()))
                setPayLaterEnabled(await canPayWithPayLater())
                setDeliveryEnabled(await getConfigValueAsBoolean('allow-delivery'))
            } else if (mode === 'order' && existingOrder != null) {
                setBalanceEnabled(await canPayWithBalance(existingOrder.totalPrice))
                setPayLaterEnabled(false)
                setDeliveryEnabled(false)
            } else {
                setBalanceEnabled(false)
                setPayLaterEnabled(false)
                setDeliveryEnabled(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ shoppingCart.items, foundCoupon, mode, existingOrder?.totalPrice, rechargeTransaction?.id, paymentMethod ])

    const hasCartCouponIssue = useMemo(() => mode === 'cart' && coupon.length > 0 && foundCoupon == null, [ coupon.length, foundCoupon, mode ])

    function getRealTotal(): Decimal {
        if (mode === 'cart') {
            let currentPrice: Decimal
            if (foundCoupon == null) {
                currentPrice = shoppingCart.getTotalPrice()
            } else {
                currentPrice = Decimal.max(0, shoppingCart.getTotalPrice().minus(Decimal(foundCoupon?.value ?? '0')))
            }
            if (paymentMethod === PaymentMethod.stripe) {
                currentPrice = currentPrice.mul(1.04)
            }
            return currentPrice
        }
        if (mode === 'order' && existingOrder != null) {
            return Decimal(existingOrder.totalPrice)
        }
        return Decimal(rechargeTransaction?.values[0] ?? 0)
    }

    function getActualCouponValue(): Decimal {
        if (mode === 'cart') {
            return shoppingCart.getTotalPrice().minus(getRealTotal())
        }
        return Decimal(0)
    }

    function isCouponTooBig(): boolean {
        if (mode !== 'cart' || foundCoupon == null) {
            return false
        }
        return Decimal(foundCoupon.value).greaterThan(shoppingCart.getTotalPrice())
    }

    async function order() {
        setLoading(true)
        if (mode === 'cart') {
            if (shoppingCart.items.length < 1) {
                setLoading(false)
                return
            }
            const order = await createOrder(shoppingCart.items, coupon.length > 0 ? coupon : null, shoppingCart.onSiteOrderMode,
                useDelivery ? deliveryRoom : null, paymentMethod)
            if (order == null) {
                setOrderFailed(true)
                setLoading(false)
                return
            }
            storedOrder.setOrder(order.id)
            shoppingCart.clear()
            if (order.paymentStatus === PaymentStatus.paid || paymentMethod === PaymentMethod.payLater) {
                setRedirectTarget(`/order/details/${order.id}`)
                router.replace(`/order/details/${order.id}`)
            } else {
                if (paymentMethod === PaymentMethod.stripe) {
                    const redirect = await getStripeRedirectURI(order.id)
                    setRedirectTarget(redirect)
                    location.href = redirect
                } else if (paymentMethod === PaymentMethod.wxPay) {
                    setRedirectTarget(`/order/checkout/wechat/pay?id=${order.id}`)
                    router.replace(`/order/checkout/wechat/pay?id=${order.id}`)
                }
            }
            setLoading(false)
            setAwaitRedirect(true)
            return
        }

        if (mode === 'order' && existingOrder != null) {
            if (paymentMethod === PaymentMethod.balance) {
                const success = await payOrderWithBalance(existingOrder.id)
                setLoading(false)
                if (!success) {
                    setOrderFailed(true)
                    return
                }
                setRedirectTarget(`/order/details/${existingOrder.id}`)
                router.replace(`/order/details/${existingOrder.id}`)
                setAwaitRedirect(true)
                return
            }

            await setOrderPaymentMethod(existingOrder.id, paymentMethod)
            if (paymentMethod === PaymentMethod.stripe) {
                const redirect = await getStripeRedirectURI(existingOrder.id)
                setRedirectTarget(redirect)
                location.href = redirect
            } else if (paymentMethod === PaymentMethod.wxPay) {
                setRedirectTarget(`/order/checkout/wechat/pay?id=${existingOrder.id}`)
                router.replace(`/order/checkout/wechat/pay?id=${existingOrder.id}`)
            }
            setLoading(false)
            setAwaitRedirect(true)
            return
        }

        if (mode === 'recharge' && rechargeTransaction != null) {
            if (paymentMethod === PaymentMethod.stripe) {
                const redirect = await getStripeRedirectURI(rechargeTransaction.id, 'balance')
                setRedirectTarget(redirect)
                location.href = redirect
            } else if (paymentMethod === PaymentMethod.wxPay) {
                setRedirectTarget(`/order/checkout/wechat/pay?id=${rechargeTransaction.id}&type=balance`)
                router.replace(`/order/checkout/wechat/pay?id=${rechargeTransaction.id}&type=balance`)
            }
            setLoading(false)
            setAwaitRedirect(true)
        }
    }

    const shouldShowOnSiteNag = !shoppingCart.onSiteOrderMode && mode === 'cart'

    return <>
        <Modal show={awaitRedirect}>
            <div className="p-8 h-full lg:h-96 flex justify-center flex-col items-center">
                <Spinner className="mb-3" size="xl" color="warning"/>

                <p className="text-sm text-center mb-3">{t('checkout.loadingText')}</p>

                <a href={redirectTarget}>
                    <Button pill color="yellow" as="div">{t('checkout.loadingContinue')}</Button>
                </a>
            </div>
        </Modal>

        <Modal show={showLoginNag} onClose={() => setShowLoginNag(false)}>
            <ModalHeader>{t('checkout.loginNagModal.title')}</ModalHeader>
            <ModalBody>
                <p className="mb-5">{t('checkout.loginNagModal.message')}</p>
                <div className="w-full flex justify-center">
                    <img width={400} height={260} src="/assets/illustrations/reading-light.png"
                         className="dark:hidden w-72" alt=""/>
                    <img width={400} height={260} src="/assets/illustrations/reading-dark.png"
                         className="hidden dark:block w-72"
                         alt=""/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Link href="/login?redirect=%2Forder%2Fcheckout">
                    <Button pill color="warning">{t('login')}</Button>
                </Link>
                <Button pill color="gray" onClick={() => {
                    setShowLoginNag(false)
                    void order()
                }}>{t('checkout.loginNagModal.continue')}</Button>
            </ModalFooter>
        </Modal>

        <div className="flex flex-col lg:flex-row w-screen lg:h-[93vh]">
            <div id="primary-content" className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto"
                 aria-label={t('checkout.title')}>
                <h1 className="mb-5 font-serif">{mode === 'recharge' ? t('checkout.recharge') : t('checkout.title')}</h1>

                <If condition={deliveryEnabled && mode === 'cart'}>
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
                </If>

                <p className="mb-1">{t('checkout.orderDetails')}</p>
                <div className="mb-5 text-sm p-5 bg-amber-50 dark:bg-amber-800 rounded-3xl"
                     aria-label={t('checkout.orderDetails')}>
                    <p className="text-sm">{t('checkout.total')}</p>
                    <p className="text-lg">¥{getRealTotal().toString()}</p>
                    <If condition={mode !== 'recharge'}>
                        <p className="mt-3 text-sm">{t('checkout.wait')}</p>
                        <p className="text-lg">
                            <If condition={waitTime === -1}>
                                ...
                            </If>
                            <If condition={waitTime !== -1}>
                                <Trans t={t} i18nKey="checkout.waitTime" count={waitTime + shoppingCart.getAmount() * 2}/>
                            </If>
                        </p>
                    </If>
                    <If condition={foundCoupon != null && mode === 'cart'}>
                        <p className="text-sm mt-3" aria-hidden>{t('checkout.coupon')}</p>
                        <p className="text-lg" aria-hidden>-¥{getActualCouponValue().toString()}</p>
                        <span className="sr-only"
                              aria-live="polite">{t('a11y.coupon', { price: getActualCouponValue() })}</span>
                    </If>
                    <If condition={paymentMethod === PaymentMethod.stripe && mode === 'cart'}>
                        <p className="text-sm mt-3">{t('checkout.stripeFees')}</p>
                        <p className="text-lg">4%</p>
                    </If>
                </div>

                <p className="mb-1">{t('checkout.paymentMethod')}</p>
                <div className="mb-5" aria-label={t('checkout.paymentMethod')}>
                    <div className="flex flex-wrap gap-3 items-center mb-1">
                        <PaymentMethodButton paymentMethod={PaymentMethod.wxPay}
                                             selected={paymentMethod === PaymentMethod.wxPay}
                                             disabled={loading}
                                             select={() => setPaymentMethod(PaymentMethod.wxPay)}/>

                        <PaymentMethodButton paymentMethod={PaymentMethod.stripe}
                                             selected={paymentMethod === PaymentMethod.stripe}
                                             disabled={loading}
                                             select={() => setPaymentMethod(PaymentMethod.stripe)}/>

                        <If condition={mode === 'cart' && shoppingCart.onSiteOrderMode}>
                            <PaymentMethodButton paymentMethod={PaymentMethod.cash}
                                                 selected={paymentMethod === PaymentMethod.cash}
                                                 disabled={loading}
                                                 select={() => setPaymentMethod(PaymentMethod.cash)}/>
                        </If>

                        <If condition={me != null && !shoppingCart.onSiteOrderMode && mode !== 'recharge'}>
                            <PaymentMethodButton paymentMethod={PaymentMethod.balance}
                                                 disabled={!balanceEnabled || loading}
                                                 selected={paymentMethod === PaymentMethod.balance}
                                                 select={() => setPaymentMethod(PaymentMethod.balance)}/>
                            <If condition={showPayLater && mode === 'cart'}>
                                <PaymentMethodButton paymentMethod={PaymentMethod.payLater}
                                                     disabled={!payLaterEnabled || loading}
                                                     selected={paymentMethod === PaymentMethod.payLater}
                                                     select={() => setPaymentMethod(PaymentMethod.payLater)}/>
                            </If>
                        </If>

                        <Popover trigger="hover" aria-hidden content={<div className="p-3">
                            <If condition={shouldShowOnSiteNag}>
                                <p className="mt-1 text-sm">{t('checkout.onSiteNag')}</p>
                            </If>
                            <If condition={me == null && shouldShowOnSiteNag}>
                                <p className="text-sm">
                                    <Trans t={t} i18nKey="checkout.loginNag"
                                           components={{
                                               1: <Link key="login" href="/login?redirect=%2Forder%2Fcheckout"
                                                        className="inline"/>
                                           }}/>
                                </p>
                            </If>
                            <If condition={me != null && !balanceEnabled && mode !== 'recharge'}>
                                <p className="mt-1 text-sm">{t('checkout.balanceDisabled')}</p>
                            </If>
                            <If condition={me != null && !payLaterEnabled && mode === 'cart'}>
                                <p className="mt-1 text-sm">{t('checkout.payLaterDisabled')}</p>
                            </If>
                        </div>}>
                            <Badge color="warning" icon={HiMagnifyingGlass}/>
                        </Popover>
                    </div>

                    <div aria-label={t('a11y.paymentMethods')} className="sr-only">
                        <If condition={shouldShowOnSiteNag}>
                            <p className="mt-1 text-sm">{t('checkout.onSiteNag')}</p>
                        </If>
                        <If condition={me == null && shouldShowOnSiteNag}>
                            <p className="text-sm">
                                <Trans t={t} i18nKey="checkout.loginNag"
                                       components={{
                                           1: <Link key="login" href="/login?redirect=%2Forder%2Fcheckout"
                                                    className="inline"/>
                                       }}/>
                            </p>
                        </If>
                        <If condition={me != null && !balanceEnabled && mode !== 'recharge'}>
                            <p className="mt-1 text-sm">{t('checkout.balanceDisabled')}</p>
                        </If>
                        <If condition={me != null && !payLaterEnabled && mode === 'cart'}>
                            <p className="mt-1 text-sm">{t('checkout.payLaterDisabled')}</p>
                        </If>
                    </div>

                    <p className="secondary text-sm">{t('checkout.stripeInfo')}</p>
                </div>

                <If condition={mode === 'cart'}>
                    <p className="mb-1">{t('checkout.coupon')}</p>
                    <TextInput className="w-full" type="text" value={coupon} placeholder={t('checkout.coupon') + '...'}
                               onChange={e => setCoupon(e.currentTarget.value)}/>
                    <p className="mt-1 text-sm text-red-500" aria-live="polite">
                        <If condition={hasCartCouponIssue}>
                            {t('checkout.couponInvalid')}
                        </If>
                    </p>
                    <p className="mt-1 text-sm" aria-live="polite">
                        <If condition={foundCoupon != null && isCouponTooBig()}>
                            {t('checkout.couponTooBig', { original: foundCoupon?.value })}
                        </If>
                    </p>
                </If>

                <If condition={useDelivery && mode === 'cart'}>
                    <p className="mt-5 mb-1">{t('checkout.deliveryRoom')}</p>
                    <TextInput className="w-full" type="text" value={deliveryRoom}
                               placeholder={t('checkout.deliveryRoom') + '...'}
                               onChange={e => setDeliveryRoom(e.currentTarget.value)}/>
                </If>

                <Button fullSized className="mt-8" color="warning" onClick={() => {
                    if (mode === 'cart' && me == null && !shoppingCart.onSiteOrderMode) {
                        setShowLoginNag(true)
                        return
                    }
                    void order()
                }}
                        disabled={(mode === 'cart' && ((coupon.length > 0 && foundCoupon == null) || (useDelivery && deliveryRoom.length < 3))) || loading}>
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
                <If condition={mode === 'cart'}>
                    {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate key={index} item={item} index={-1}
                                                                                uploadPrefix={uploadPrefix}/>)}
                </If>
                <If condition={mode === 'order' && existingOrder != null}>
                    {existingOrder?.items.map((item, index) =>
                        <UIOrderedItemTemplate key={index} item={{
                            item: item.itemType,
                            amount: item.amount,
                            options: item.appliedOptions
                        }} index={-1} uploadPrefix={uploadPrefix} price={item.price}/>)}
                </If>
            </div>
        </div>
    </>
}
