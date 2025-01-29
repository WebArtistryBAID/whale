'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { Trans } from 'react-i18next/TransWithoutContext'
import If from '@/app/lib/If'
import { Button, TextInput } from 'flowbite-react'
import { CouponCode, PaymentMethod, User } from '@prisma/client'
import { couponQuickValidate } from '@/app/lib/ordering-actions'
import Decimal from 'decimal.js'
import { getMyUser } from '@/app/login/login-actions'
import Link from 'next/link'

function isiPad(): boolean {
    return /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1
}

function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function isInWeChat(): boolean {
    return /MicroMessenger/i.test(navigator.userAgent)
}

function PaymentMethodButton({ paymentMethod, selected, select }: {
    paymentMethod: PaymentMethod,
    selected: boolean,
    select: () => void
}) {
    const { t } = useTranslationClient('order')
    return <Button color={selected ? 'warning' : 'gray'} pill size="xs"
                   onClick={select}>
        {t(`checkout.${paymentMethod}`)}
        <If condition={selected}>
            <span className="sr-only">{t('a11y.selected')}</span>
        </If>
    </Button>
}

export default function CheckoutClient({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>(PaymentMethod.wxPay)
    const [ coupon, setCoupon ] = useState('')
    const [ foundCoupon, setFoundCoupon ] = useState<CouponCode | null>(null)
    const [ me, setMe ] = useState<User | null>(null)

    useEffect(() => {
        if (shoppingCart.items.length < 1) {
            router.push('/order')
        }
    }, [ shoppingCart.items, router ])

    useEffect(() => {
        (async () => {
            if (coupon.length < 1) {
                setFoundCoupon(null)
            } else {
                setFoundCoupon(await couponQuickValidate(coupon))
            }
        })()
    }, [ coupon ])

    useEffect(() => {
        (async () => {
            setMe(await getMyUser())
        })()
    }, [])

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

    return <div className="flex flex-col lg:flex-row w-screen lg:h-[93vh]">
        <div className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto" aria-label={t('checkout.title')}>
            <h1 aria-hidden className="mb-5">{t('checkout.title')}</h1>

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
            <div className="mb-1 flex gap-3 flex-wrap" aria-label={t('checkout.paymentMethod')}>
                <PaymentMethodButton paymentMethod={PaymentMethod.wxPay}
                                     selected={paymentMethod === PaymentMethod.wxPay}
                                     select={() => setPaymentMethod(PaymentMethod.wxPay)}/>

                <If condition={shoppingCart.onSiteOrderMode}>
                    <PaymentMethodButton paymentMethod={PaymentMethod.cash}
                                         selected={paymentMethod === PaymentMethod.cash}
                                         select={() => setPaymentMethod(PaymentMethod.cash)}/>
                </If>

                <If condition={me != null}>
                    <PaymentMethodButton paymentMethod={PaymentMethod.balance}
                                         selected={paymentMethod === PaymentMethod.balance}
                                         select={() => setPaymentMethod(PaymentMethod.balance)}/>
                    <PaymentMethodButton paymentMethod={PaymentMethod.payLater}
                                         selected={paymentMethod === PaymentMethod.payLater}
                                         select={() => setPaymentMethod(PaymentMethod.payLater)}/>
                </If>

                <If condition={isiPad() || isMobile()}>
                    <PaymentMethodButton paymentMethod={PaymentMethod.payForMe}
                                         selected={paymentMethod === PaymentMethod.payForMe}
                                         select={() => setPaymentMethod(PaymentMethod.payForMe)}/>
                </If>
            </div>
            <If condition={!shoppingCart.onSiteOrderMode}>
                <p className="text-sm">{t('checkout.onSiteNag')}</p>
            </If>
            <If condition={me == null && !shoppingCart.onSiteOrderMode}>
                <p className="text-sm">
                    <Trans t={t} i18nKey="checkout.loginNag"
                           components={{ 1: <Link key="login" href="/user" className="inline"/> }}/>
                </p>
            </If>

            <p aria-hidden className="mt-4 mb-1">{t('checkout.coupon')}</p>
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

            <Button fullSized className="mt-8" color="warning"
                    disabled={(coupon.length > 0 && foundCoupon == null)}>{t('checkout.pay')}</Button>
        </div>
        <div
            className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto border-l border-yellow-100 dark:border-yellow-800 flex flex-col gap-5"
            aria-label={t('a11y.orderedItems')}>
            {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate key={index} item={item} index={-1}
                                                                            uploadPrefix={uploadPrefix}/>)}
        </div>
    </div>
}
