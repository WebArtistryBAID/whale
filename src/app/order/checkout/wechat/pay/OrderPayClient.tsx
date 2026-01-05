'use client'

import { cancelUnpaidOrder, HydratedOrder } from '@/app/lib/ordering-actions'
import { useSearchParams } from 'next/navigation'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { Button, Spinner } from 'flowbite-react'
import { useEffect, useMemo, useState } from 'react'
import {
    getExternalPaymentRedirect,
    getOAPaymentPackage,
    getOrderPaymentStatus,
    getPaymentQRCode,
    getWeChatOAuthRedirect
} from '@/app/lib/wx-pay-actions'
import {
    getExternalPaymentRedirect as getBalanceExternalPaymentRedirect,
    getOAPaymentPackage as getBalanceOAPaymentPackage,
    getPaymentQRCode as getBalancePaymentQRCode,
    getWeChatOAuthRedirect as getBalanceWeChatOAuthRedirect,
    isTransactionFinished
} from '@/app/lib/balance-actions'
import { PaymentMethod, PaymentStatus, UserAuditLog } from '@/generated/prisma/browser'
import QRCode from 'react-qr-code'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { Trans } from 'react-i18next/TransWithoutContext'

function isDesktop(): boolean {
    return !isMobileOriPad()
}

function isMobileOriPad(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

function isWeChat(): boolean {
    return /MicroMessenger/i.test(navigator.userAgent)
}

interface PaymentClientProps {
    order?: HydratedOrder | null
    transaction?: UserAuditLog | null
}

// If using "payForMe" or desktop device (not iPad) or on site order, show QR code
// If using (mobile device or iPad) AND inside WeChat, use official account payment
// If using (mobile device or iPad) AND outside WeChat, use external payment
export default function OrderPayClient({ order, transaction }: PaymentClientProps) {
    const { t } = useTranslationClient('order')
    const searchParams = useSearchParams()
    const [ canRestart, setCanRestart ] = useState(false)
    const [ error, setError ] = useState(false)
    const [ qrCode, setQRCode ] = useState<string | null>(null)
    const [ qrCodeShowProcessing, setQRCodeShowProcessing ] = useState(false)
    const shoppingCart = useShoppingCart()
    const isOrder = order != null
    const payForMe = order?.paymentMethod === PaymentMethod.payForMe
    const amount = useMemo(() => isOrder ? order!.totalPrice : transaction?.values[0] ?? '0', [ isOrder, order?.totalPrice, transaction?.values ])
    const redirectTarget = isOrder ? `/order/details/${order!.id}` : '/user'

    useEffect(() => {
        if (!searchParams.has('oaready')) {
            if (isMobileOriPad() && !payForMe && !shoppingCart.onSiteOrderMode) {
                void launchWeChat()
            }
            if (isDesktop() || payForMe || shoppingCart.onSiteOrderMode) {
                (async () => {
                    const qr = await (isOrder ? getPaymentQRCode(order!.id) : getBalancePaymentQRCode(transaction!.id))
                    if (qr == null) {
                        setError(true)
                        return
                    }
                    setQRCode(qr)
                    setTimeout(() => {
                        setQRCodeShowProcessing(true)
                    }, 10000)
                })()
            }
        }
        setTimeout(() => {
            setCanRestart(true)
        }, 10000)

        setInterval(() => {
            void pollPaymentStatus()
        }, 3000)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function cancel() {
        if (order == null) {
            location.href = redirectTarget
            return
        }
        const result = await cancelUnpaidOrder(order.id)
        if (result.length < 1) {
            location.href = '/'
        } else {
            shoppingCart.clear()
            for (const item of result) {
                shoppingCart.addItem(item)
            }
            location.href = '/order/checkout'
        }
    }

    async function pollPaymentStatus() {
        if (isOrder) {
            if (await getOrderPaymentStatus(order!.id) === PaymentStatus.paid) {
                location.href = redirectTarget
            }
        } else if (transaction != null && await isTransactionFinished(transaction.id)) {
            location.href = redirectTarget
        }
    }

    async function launchWeChat() {
        if (!isMobileOriPad()) {
            return
        }
        if (isWeChat()) {
            if (searchParams.has('openid')) {
                if (searchParams.get('openid') === 'error') {
                    setError(true)
                    return
                }
                const paymentPackage = isOrder
                    ? await getOAPaymentPackage(order!.id, searchParams.get('openid')!)
                    : await getBalanceOAPaymentPackage(transaction!.id, searchParams.get('openid')!)
                if (paymentPackage == null) {
                    setError(true)
                    return
                }

                const launchOAPayment = () => {
                    // @ts-expect-error WeChat
                    WeixinJSBridge.invoke('getBrandWCPayRequest', JSON.parse(paymentPackage), (res) => {
                        if (res.err_msg === 'get_brand_wcpay_request:ok') {
                            void pollPaymentStatus()
                        } else {
                            setError(true)
                        }
                    })
                }

                // @ts-expect-error WeChat
                if (typeof WeixinJSBridge === 'undefined') {
                    if (document.addEventListener) {
                        document.addEventListener('WeixinJSBridgeReady', launchOAPayment, false)
                    } else {
                        // @ts-expect-error legacy
                        if (document.attachEvent) {
                            // @ts-expect-error legacy
                            document.attachEvent('WeixinJSBridgeReady', launchOAPayment)
                            // @ts-expect-error legacy
                            document.attachEvent('onWeixinJSBridgeReady', launchOAPayment)
                        }
                    }
                } else {
                    launchOAPayment()
                }
            } else {
                const redir = isOrder ? await getWeChatOAuthRedirect(order!.id) : await getBalanceWeChatOAuthRedirect(transaction!.id)
                if (redir == null) {
                    setError(true)
                    return
                }
                location.href = redir
            }
        } else {
            const redir = isOrder ? await getExternalPaymentRedirect(order!.id) : await getBalanceExternalPaymentRedirect(transaction!.id)
            if (redir == null) {
                setError(true)
                return
            }
            location.href = redir
        }
    }

    return <div className="flex justify-center items-center flex-col bg-green-50 dark:bg-green-950 h-screen w-screen">
        <div
            className="lg:rounded-3xl p-4 lg:p-8 xl:p-16 bg-white dark:bg-gray-900 2xl:w-1/2 xl:w-2/3 lg:w-3/4 w-full h-full lg:h-auto">
            <div className="flex items-center mb-5">
                <h1 className="mr-auto">
                    <img src="/assets/brand/wx-pay-light.svg" alt={t('wechatPay.title')}
                         className="block dark:hidden h-8"/>
                    <img src="/assets/brand/wx-pay-dark.svg" alt={t('wechatPay.title')}
                         className="hidden dark:block h-8"/>
                </h1>
                <p className="text-2xl">CN<span className="font-bold">¥{amount}</span></p>
            </div>
            <div className="w-full flex justify-center items-center text-center flex-col">
                <If condition={error}>
                    <p className="mb-3"><Trans t={t} i18nKey="wechatPay.error"
                                               components={{ 1: <span className="font-bold" key="bold"/> }}/></p>
                    <Button onClick={() => location.reload()} pill color="success">{t('wechatPay.restart')}</Button>
                </If>
                <If condition={!error}>
                    <If condition={isDesktop() || payForMe || shoppingCart.onSiteOrderMode}>
                        <If condition={qrCode == null}>
                            <div className="lg:h-96 flex justify-center items-center">
                                <Spinner color="success"/>
                            </div>
                        </If>
                        <span className="sr-only" aria-live="polite">
                            <If condition={qrCodeShowProcessing}>
                                {t('wechatPay.processing')}
                            </If>
                        </span>

                        <If condition={qrCode != null}>
                            <If condition={!qrCodeShowProcessing}>
                                <p className="mb-3">{t('wechatPay.scan')}</p>
                            </If>
                            <If condition={qrCodeShowProcessing}>
                                <p className="mb-3">{t('wechatPay.processing')}</p>
                            </If>
                            <div aria-label={t('a11y.qrCode')} className="rounded-3xl border-white border-[2rem] mb-3"
                                 style={{ width: 'calc(200px + 4rem)', height: 'calc(200px + 4rem)' }}>
                                <QRCode value={qrCode ?? 'Please wait...'} size={200} className="aspect-square"/>
                            </div>
                            <div className="flex gap-3">
                                <If condition={qrCodeShowProcessing}>
                                    <Button disabled={!canRestart} onClick={() => location.reload()} pill
                                            color="green" className="inline-block">{t('wechatPay.restart')}</Button>
                                </If>
                            </div>
                        </If>
                    </If>

                    <If condition={isMobileOriPad() && !payForMe && !shoppingCart.onSiteOrderMode}>
                        <p className="mb-3">{t('wechatPay.mobile')}</p>
                        <div className="flex gap-3">
                            <Button disabled={!canRestart} onClick={launchWeChat} pill className="inline-block"
                                    color="green">{t('wechatPay.restart')}</Button>
                        </div>
                    </If>
                </If>
                <Button className="mt-3" pill color="red" onClick={cancel}>
                    {t('wechatPay.cancel')}
                </Button>
            </div>
        </div>
    </div>
}
