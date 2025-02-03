'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { Button, Spinner } from 'flowbite-react'
import { useEffect, useState } from 'react'
import {
    getExternalPaymentRedirect,
    getOAPaymentPackage,
    getPaymentQRCode,
    getWeChatOAuthRedirect,
    isTransactionFinished
} from '@/app/lib/balance-actions'
import { UserAuditLog } from '@prisma/client'
import QRCode from 'react-qr-code'
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

// If using "payForMe" or desktop device (not iPad) or on site order, show QR code
// If using (mobile device or iPad) AND inside WeChat, use official account payment
// If using (mobile device or iPad) AND outside WeChat, use external payment
export default function BalancePayClient({ trans }: { trans: UserAuditLog }) {
    const { t } = useTranslationClient('order')
    const searchParams = useSearchParams()
    const [ canRestart, setCanRestart ] = useState(false)
    const [ error, setError ] = useState(false)
    const [ qrCode, setQRCode ] = useState<string | null>(null)
    const [ qrCodeShowProcessing, setQRCodeShowProcessing ] = useState(false)

    useEffect(() => {
        if (!searchParams.has('oaready')) { // Do not launch again if user already paid
            if (isMobileOriPad()) {
                void launchWeChat()
            }
            if (isDesktop()) {
                (async () => {
                    const qr = await getPaymentQRCode(trans.id)
                    if (qr == null) {
                        setError(true)
                        return
                    }
                    setQRCode(qr)
                    setTimeout(() => {
                        setQRCodeShowProcessing(true) // We don't actually know if the user finished paying or not, but we pretend we do
                    }, 10000)
                })()
            }
        }
        setTimeout(() => {
            setCanRestart(true) // Make sure the user don't restart right away
        }, 10000)

        setInterval(() => {
            void pollPaymentStatus()
        }, 3000)
        // We don't want any more dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function pollPaymentStatus() {
        if (await isTransactionFinished(trans.id)) {
            location.href = `/user`
        }
    }

    async function launchWeChat() {
        if (!isMobileOriPad()) {
            return
        }
        if (isWeChat()) {
            // Use WeChat official account payment method
            if (searchParams.has('openid')) {
                if (searchParams.get('openid') === 'error') {
                    setError(true)
                    return
                }
                // We have authorized with WeChat, can continue
                const paymentPackage = await getOAPaymentPackage(trans.id, searchParams.get('openid')!)
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
                        if (document.attachEvent) { // Legacy support
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
                // We haven't authorized with WeChat yet, redirect to authorize
                const redir = await getWeChatOAuthRedirect(trans.id)
                if (redir == null) {
                    setError(true)
                    return
                }
                location.href = redir
            }
        } else {
            // Use WAP payment
            const redir = await getExternalPaymentRedirect(trans.id)
            if (redir == null) {
                setError(true)
                return
            }
            location.href = redir
        }
    }

    return <div id="primary-content" className="container">
        <h1 className="mb-5">{t('wechatPay.title')}</h1>
        <p className="mb-3 text-lg">{t('checkout.total')} ¥{trans.values[0]}</p>
        <If condition={error}>
            <p className="mb-3"><Trans t={t} i18nKey="wechatPay.error"
                                       components={{ 1: <span className="font-bold" key="bold"/> }}/></p>
            <Button onClick={() => location.reload()} pill color="warning">{t('wechatPay.restart')}</Button>
        </If>
        <If condition={!error}>
            <If condition={isDesktop()}>
                <If condition={qrCode == null}>
                    <Spinner color="warning"/>
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
                    <div aria-label={t('a11y.qrCode')} className="rounded-3xl border-white border-[2rem] mb-3"
                         style={{ width: 'calc(200px + 4rem)', height: 'calc(200px + 4rem)' }}>
                        <QRCode value={qrCode ?? 'Please wait...'} size={200} className="aspect-square"/>
                    </div>
                    <If condition={qrCodeShowProcessing}>
                        <p className="mb-3">{t('wechatPay.processing')}</p>
                        <Button disabled={!canRestart} onClick={() => location.reload()} pill
                                color="warning">{t('wechatPay.restart')}</Button>
                    </If>
                </If>
            </If>
            <If condition={isMobileOriPad()}>
                <p className="mb-3">{t('wechatPay.processing')}</p>
                <Button disabled={!canRestart} onClick={launchWeChat} pill
                        color="warning">{t('wechatPay.restart')}</Button>
            </If>
        </If>
    </div>
}
