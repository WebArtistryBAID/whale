'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart, useStoredOrder } from '@/app/lib/shopping-cart'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { Trans } from 'react-i18next/TransWithoutContext'
import If from '@/app/lib/If'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, TextInput } from 'flowbite-react'
import { IconType } from 'react-icons'
import { HiCash, HiClock, HiCreditCard, HiCurrencyYen, HiTicket, HiUserGroup } from 'react-icons/hi'
import { SiWechat } from 'react-icons/si'
import CartWarnings from '@/app/order/CartWarnings'
import { CouponCode, OrderType, PaymentMethod, PaymentStatus, User, UserAuditLog } from '@/generated/prisma/browser'
import type { HydratedOrder } from '@/app/lib/ordering-actions'
import {
    canPayWithBalance,
    canPayWithPayLater,
    CartValidationResponse,
    couponQuickValidate,
    createOrder,
    getEstimatedWaitTime,
    getOrderingAvailability,
    OrderingAvailabilityResponse,
    payOrderWithBalance,
    setOrderCheckoutOptions,
    validateCartItems
} from '@/app/lib/ordering-actions'
import Decimal from 'decimal.js'
import { getMyUser } from '@/app/login/login-actions'
import Link from 'next/link'
import { getConfigValueAsBoolean } from '@/app/lib/settings-actions'
import { getStripeRedirectURI } from '@/app/lib/stripe-actions'
import { getStripeChargedTotal, getStripeFeeAmount } from '@/app/lib/pricing'
import { normalizeCouponCode } from '@/app/lib/coupon-codes'
import {
    DEFAULT_PICK_UP_TIME,
    isValidPickUpTime,
    PICK_UP_TIME_OPTIONS,
    PickUpTimeOption
} from '@/app/lib/pick-up-times'

const PAYMENT_METHOD_ICONS: { [method in PaymentMethod]: IconType } = {
    wxPay: SiWechat,
    stripe: HiCreditCard,
    balance: HiCurrencyYen,
    cash: HiCash,
    payLater: HiClock,
    payForMe: HiUserGroup
}

function OptionTile({ label, icon: Icon, selected, select, disabled }: {
    label: string,
    icon?: IconType,
    selected: boolean,
    select: () => void,
    disabled: boolean
}) {
    const { t } = useTranslationClient('order')
    return <button onClick={select} disabled={disabled} aria-pressed={selected}
                   className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium
                   transition-all disabled:opacity-40 disabled:cursor-not-allowed
                   ${selected
                       ? 'border-caramel bg-caramel-50 ring-2 ring-caramel/30 dark:bg-caramel/10'
                       : 'border-cream-200 bg-white enabled:hover:border-caramel/50 dark:border-white/10 dark:bg-white/5'}`}>
        {Icon != null ? <Icon className={`text-xl flex-shrink-0 ${selected ? 'text-caramel' : 'secondary'}`}/> : null}
        <span className="flex-1">{label}</span>
        <span aria-hidden className={`h-4 w-4 rounded-full border-2 flex-shrink-0
        ${selected ? 'border-caramel bg-caramel shadow-[inset_0_0_0_2px_white] dark:shadow-[inset_0_0_0_2px_#2c1911]' : 'border-stone-300 dark:border-white/20'}`}/>
        <If condition={selected}>
            <span className="sr-only">{t('a11y.selected')}</span>
        </If>
    </button>
}

function PaymentMethodButton({ paymentMethod, selected, select, disabled }: {
    paymentMethod: PaymentMethod,
    selected: boolean,
    select: () => void,
    disabled: boolean
}) {
    const { t } = useTranslationClient('order')
    return <OptionTile label={t(`checkout.${paymentMethod}`)} icon={PAYMENT_METHOD_ICONS[paymentMethod]}
                       selected={selected} select={select} disabled={disabled}/>
}

function PickUpTimeButton({ value, selected, select, disabled }: {
    value: PickUpTimeOption,
    selected: boolean,
    select: () => void,
    disabled: boolean
}) {
    const { t } = useTranslationClient('order')
    return <OptionTile label={t(`checkout.pickUpTimeOptions.${value}`)} selected={selected} select={select}
                       disabled={disabled}/>
}

function Section({ title, children }: { title: string, children: ReactNode }) {
    return <section className="card p-5 lg:p-6" aria-label={title}>
        <h2 className="text-base font-bold mb-4">{title}</h2>
        {children}
    </section>
}

function SummaryRow({ label, value, strong }: { label: string, value: ReactNode, strong?: boolean }) {
    return <div className="flex items-baseline justify-between gap-3">
        <span className={strong ? 'font-semibold' : 'secondary text-sm'}>{label}</span>
        <span className={strong ? 'price text-2xl' : 'tabular-nums'}>{value}</span>
    </div>
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
    const [ pickUpTime, setPickUpTime ] = useState<PickUpTimeOption>(existingOrder?.type === OrderType.pickUp && isValidPickUpTime(existingOrder.pickUpTime)
        ? existingOrder.pickUpTime
        : DEFAULT_PICK_UP_TIME)
    const [ coupon, setCoupon ] = useState('')
    const [ foundCoupon, setFoundCoupon ] = useState<Pick<CouponCode, 'id' | 'value'> | null>(null)
    const [ me, setMe ] = useState<User | null>(null)
    const [ useDelivery, setUseDelivery ] = useState(false)
    const [ deliveryRoom, setDeliveryRoom ] = useState('')
    const [ orderFailed, setOrderFailed ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ awaitRedirect, setAwaitRedirect ] = useState(false)
    const [ preOrderLimitModal, setPreOrderLimitModal ] = useState(false)
    const [ preOrderLimitOpenTime, setPreOrderLimitOpenTime ] = useState('')
    const [ redirectTarget, setRedirectTarget ] = useState('#')
    const [ balanceEnabled, setBalanceEnabled ] = useState(false)
    const [ payLaterEnabled, setPayLaterEnabled ] = useState(false)
    const [ deliveryEnabled, setDeliveryEnabled ] = useState(false)
    const [ waitTime, setWaitTime ] = useState(-1)
    const [ showLoginNag, setShowLoginNag ] = useState(false)
    const [ availability, setAvailability ] = useState<OrderingAvailabilityResponse | null>(null)
    const [ cartValidation, setCartValidation ] = useState<CartValidationResponse | null>(null)

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
        const syncAvailability = async () => {
            if (mode !== 'cart') {
                setAvailability(null)
                setCartValidation(null)
                return
            }
            setAvailability(await getOrderingAvailability())
            setCartValidation(await validateCartItems(shoppingCart.items))
        }

        void syncAvailability()
        if (mode !== 'cart') {
            return
        }

        const id = setInterval(() => {
            void syncAvailability()
        }, 10000)
        return () => clearInterval(id)
    }, [ mode, shoppingCart.items ])

    useEffect(() => {
        (async () => {
            if (mode === 'cart') {
                setBalanceEnabled(await canPayWithBalance(getBaseTotal().toString()))
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
    const remainingLimit = availability == null
        ? 0
        : availability.phase === 'preorder'
            ? availability.currentDay.remainingPreOrderCups
            : availability.phase === 'live'
                ? availability.currentDay.remainingLiveCups
                : 0
    const hasInventoryIssues = mode === 'cart' && (cartValidation?.issues.length ?? 0) > 0
    const inventoryMessages = mode === 'cart'
        ? cartValidation?.issues.map(issue =>
        issue.available <= 0
            ? t('inventory.soldOut', { item: issue.itemName })
            : t('inventory.onlyLeft', { count: issue.available, item: issue.itemName })
    ) ?? []
        : []
    const hasStoreClosedIssue = mode === 'cart' && availability?.unavailableReason === 'store-closed'
    const hasPreOrderLimitIssue = mode === 'cart' && availability?.phase === 'preorder' && (cartValidation?.countedAmount ?? 0) > remainingLimit
    const hasLiveLimitIssue = mode === 'cart' && availability?.phase === 'live' && (cartValidation?.countedAmount ?? 0) > remainingLimit
    const hasCheckoutBlockingIssue = hasStoreClosedIssue || hasPreOrderLimitIssue || hasLiveLimitIssue || hasInventoryIssues

    function getBaseTotal(): Decimal {
        if (mode === 'cart') {
            let currentPrice: Decimal
            if (foundCoupon == null) {
                currentPrice = shoppingCart.getTotalPrice()
            } else {
                currentPrice = Decimal.max(0, shoppingCart.getTotalPrice().minus(Decimal(foundCoupon?.value ?? '0')))
            }
            return currentPrice
        }
        if (mode === 'order' && existingOrder != null) {
            return Decimal(existingOrder.totalPrice)
        }
        return Decimal(rechargeTransaction?.values[0] ?? 0)
    }

    function getDisplayedTotal(): Decimal {
        const baseTotal = getBaseTotal()
        if (paymentMethod === PaymentMethod.stripe && mode !== 'recharge') {
            return getStripeChargedTotal(baseTotal)
        }
        return baseTotal
    }

    function getActualCouponValue(): Decimal {
        if (mode === 'cart') {
            return shoppingCart.getTotalPrice().minus(getBaseTotal())
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
                useDelivery ? deliveryRoom : null, paymentMethod, useDelivery ? null : pickUpTime)
            if (order == null) {
                const availability = await getOrderingAvailability()
                if (availability.unavailableReason === 'preorder-limit-reached') {
                    setPreOrderLimitOpenTime(availability.openTime)
                    setPreOrderLimitModal(true)
                }
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
            await setOrderCheckoutOptions(existingOrder.id, paymentMethod, existingOrder.type === OrderType.pickUp ? pickUpTime : null)

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
                <Button pill color="yellow" onClick={() => {
                    setShowLoginNag(false)
                    void order()
                }}>{t('checkout.loginNagModal.continue')}</Button>
            </ModalFooter>
        </Modal>

        <Modal show={preOrderLimitModal} onClose={() => setPreOrderLimitModal(false)}>
            <ModalHeader>{t('preOrderLimitModal.title')}</ModalHeader>
            <ModalBody>
                <p>{t('preOrderLimitModal.message', { time: preOrderLimitOpenTime })}</p>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning" onClick={() => setPreOrderLimitModal(false)}>
                    {t('confirm')}
                </Button>
            </ModalFooter>
        </Modal>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
            <h1 className="mb-6">{mode === 'recharge' ? t('checkout.recharge') : t('checkout.title')}</h1>
            <div className="grid lg:grid-cols-[1fr_24rem] gap-6 lg:gap-8 items-start">
                <div id="primary-content" className="flex flex-col gap-5" aria-label={t('checkout.title')}>
                    <If condition={deliveryEnabled && mode === 'cart'}>
                        <div className="inline-flex self-start rounded-full bg-cream-100 dark:bg-white/5 p-1">
                            {[ false, true ].map(delivery =>
                                <button key={delivery ? 'delivery' : 'pickUp'} onClick={() => setUseDelivery(delivery)}
                                        aria-pressed={useDelivery === delivery}
                                        className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors
                                        ${useDelivery === delivery ? 'bg-white dark:bg-espresso-700 shadow-card' : 'secondary'}`}>
                                    {delivery ? t('checkout.delivery') : t('checkout.pickUp')}
                                    <If condition={useDelivery === delivery}>
                                        <span className="sr-only">{t('a11y.selected')}</span>
                                    </If>
                                </button>)}
                        </div>
                    </If>

                    <Section title={t('checkout.paymentMethod')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                        </div>

                        <div aria-label={t('a11y.paymentMethods')} className="flex flex-col gap-1 text-sm secondary">
                            <If condition={paymentMethod === PaymentMethod.stripe}>
                                <p>{t('checkout.stripeInfo')}</p>
                            </If>
                            <If condition={me == null && shouldShowOnSiteNag}>
                                <p>
                                    <Trans t={t} i18nKey="checkout.loginNag"
                                           components={{
                                               1: <Link key="login" href="/login?redirect=%2Forder%2Fcheckout"
                                                        className="inline"/>
                                           }}/>
                                </p>
                            </If>
                            <If condition={me != null && !balanceEnabled && mode !== 'recharge'}>
                                <p>{t('checkout.balanceDisabled')}</p>
                            </If>
                            <If condition={me != null && !payLaterEnabled && mode === 'cart' && showPayLater}>
                                <p>{t('checkout.payLaterDisabled')}</p>
                            </If>
                        </div>
                    </Section>

                    <If condition={mode !== 'recharge' && (mode === 'cart' ? !useDelivery : existingOrder?.type === OrderType.pickUp)}>
                        <Section title={t('checkout.pickUpTime')}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                {PICK_UP_TIME_OPTIONS.map(option => <PickUpTimeButton key={option} value={option}
                                                                                      selected={pickUpTime === option}
                                                                                      disabled={loading}
                                                                                      select={() => setPickUpTime(option)}/>)}
                            </div>
                            <p className="secondary text-sm">{t('checkout.pickUpTimeMessage')}</p>
                        </Section>
                    </If>

                    <If condition={useDelivery && mode === 'cart'}>
                        <Section title={t('checkout.deliveryRoom')}>
                            <TextInput className="w-full" type="text" value={deliveryRoom}
                                       placeholder={t('checkout.deliveryRoom') + '...'}
                                       onChange={e => setDeliveryRoom(e.currentTarget.value)}/>
                        </Section>
                    </If>

                    <If condition={mode === 'cart'}>
                        <Section title={t('checkout.coupon')}>
                            <TextInput className="w-full" type="text" value={coupon} icon={HiTicket}
                                       placeholder={t('checkout.coupon') + '...'}
                                       color={hasCartCouponIssue ? 'failure' : foundCoupon != null ? 'success' : 'gray'}
                                       onChange={e => setCoupon(normalizeCouponCode(e.currentTarget.value))}/>
                            <p className="mt-2 text-sm text-rose-600" aria-live="polite">
                                <If condition={hasCartCouponIssue}>
                                    {t('checkout.couponInvalid')}
                                </If>
                            </p>
                            <p className="text-sm secondary" aria-live="polite">
                                <If condition={foundCoupon != null && isCouponTooBig()}>
                                    {t('checkout.couponTooBig', { original: foundCoupon?.value })}
                                </If>
                            </p>
                        </Section>
                    </If>
                </div>

                <aside className="card p-5 lg:p-6 lg:sticky lg:top-24 flex flex-col gap-5"
                       aria-label={t('checkout.orderDetails')}>
                    <h2 className="text-base font-bold">{t('checkout.orderDetails')}</h2>
                    <If condition={mode !== 'recharge'}>
                        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto -mx-1 px-1 pt-2"
                             aria-label={t('a11y.orderedItems')}>
                            <If condition={mode === 'cart'}>
                                {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate key={index} item={item}
                                                                                            index={-1}
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
                    </If>

                    <div className="flex flex-col gap-2 border-t border-dashed border-cream-200 dark:border-white/10 pt-4">
                        <If condition={mode !== 'recharge'}>
                            <SummaryRow label={t('checkout.wait')} value={waitTime === -1 ? '...' :
                                <Trans t={t} i18nKey="checkout.waitTime" count={waitTime + shoppingCart.getAmount() * 2}/>}/>
                        </If>
                        <If condition={foundCoupon != null && mode === 'cart'}>
                            <div aria-hidden>
                                <SummaryRow label={t('checkout.coupon')}
                                            value={<span className="text-emerald-600">-¥{getActualCouponValue().toString()}</span>}/>
                            </div>
                            <span className="sr-only"
                                  aria-live="polite">{t('a11y.coupon', { price: getActualCouponValue() })}</span>
                        </If>
                        <If condition={paymentMethod === PaymentMethod.stripe && mode !== 'recharge'}>
                            <SummaryRow label={t('checkout.stripeFees')}
                                        value={`¥${getStripeFeeAmount(getBaseTotal()).toFixed(2)} (3.5%)`}/>
                        </If>
                        <div className="mt-2">
                            <SummaryRow strong label={t('checkout.total')} value={`¥${getDisplayedTotal().toString()}`}/>
                        </div>
                    </div>

                    <If condition={hasCheckoutBlockingIssue}>
                        <CartWarnings title={t('notice')} warnings={[
                            ...(hasStoreClosedIssue ? [ t('storeClosedModal.simple') ] : []),
                            ...(hasLiveLimitIssue ? [ t('maximumCupsModal.simple') ] : []),
                            ...(hasPreOrderLimitIssue ? [ t('preOrderLimitModal.simple') ] : []),
                            ...(hasInventoryIssues ? [ t('inventory.cartChanged') ] : []),
                            ...inventoryMessages
                        ]}/>
                    </If>

                    <Button fullSized size="lg" pill color="warning" onClick={() => {
                        if (mode === 'cart' && me == null && !shoppingCart.onSiteOrderMode) {
                            setShowLoginNag(true)
                            return
                        }
                        void order()
                    }}
                            disabled={(mode === 'cart' && (((coupon.length > 0 && foundCoupon == null) || (useDelivery && deliveryRoom.length < 3)) || hasCheckoutBlockingIssue)) || loading}>
                        <If condition={orderFailed}>
                            {t('tryAgain')}
                        </If>
                        <If condition={!orderFailed}>
                            <If condition={getDisplayedTotal().eq(0) || paymentMethod === PaymentMethod.cash}>
                                {t('continue')}
                            </If>
                            <If condition={!(getDisplayedTotal().eq(0) || paymentMethod === PaymentMethod.cash)}>
                                {t('checkout.pay')} · ¥{getDisplayedTotal().toString()}
                            </If>
                        </If>
                    </Button>
                </aside>
            </div>
        </div>
    </>
}
