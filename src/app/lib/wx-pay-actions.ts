'use server'

import { getOrder, HydratedOrder } from '@/app/lib/ordering-actions'
import { PaymentStatus } from '@prisma/client'
import signData from '@/app/lib/wx-pay-sign'

const userAgent = 'Whale Cafe (Weixin Pay Client)'
const orderBody = '白鲸咖啡订单 Whale Cafe Order'

async function requireUnpaidOrder(order: number): Promise<HydratedOrder> {
    const o = await getOrder(order)
    if (o == null || o.paymentStatus !== PaymentStatus.notPaid) {
        throw 'Bad request'
    }
    return o
}

function getOrderTransactionNo(order: HydratedOrder): string {
    return `${order.id}-ORDER${order.createdAt.getTime()}`
}

export async function getOrderPaymentStatus(id: number): Promise<PaymentStatus> {
    const order = await getOrder(id)
    if (order == null) {
        return PaymentStatus.notPaid
    }
    return order.paymentStatus
}

export async function getPaymentQRCode(id: number): Promise<string | null> {
    const order = await requireUnpaidOrder(id)
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'https://example.com' // Development
    }
    const data = {
        out_trade_no: getOrderTransactionNo(order),
        total_fee: order.totalPrice,
        mch_id: process.env.WX_PAY_MCH_ID,
        body: orderBody
    }
    const r = await fetch('https://api.pay.yungouos.com/api/pay/wxpay/nativePay', {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            ...data,
            notify_url: `${process.env.HOST}/order/checkout/wechat/notify`,
            sign: signData(data)
        })
    })
    const resp = await r.json()
    if (resp.code === 0) {
        return resp.data
    } else {
        console.error('An error occurred when requesting Weixin Pay:', resp)
    }
    return null
}

export async function getWeChatOAuthRedirect(id: number): Promise<string | null> {
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'https://example.com' // Development
    }
    const data = {
        mch_id: process.env.WX_PAY_MCH_ID,
        callback_url: `${process.env.HOST}/order/checkout/wechat/${id}/authorize`
    }
    const r = await fetch('https://api.pay.yungouos.com/api/wx/getOauthUrl', {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            ...data,
            sign: signData(data)
        })
    })
    const resp = await r.json()
    if (resp.code === 0) {
        return resp.data
    } else {
        console.error('An error occurred when requesting Weixin Pay:', resp)
    }
    return null
}

export async function getOAPaymentPackage(id: number, openid: string): Promise<string | null> {
    const order = await requireUnpaidOrder(id)
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'development' // Development
    }
    const data = {
        out_trade_no: getOrderTransactionNo(order),
        total_fee: order.totalPrice,
        mch_id: process.env.WX_PAY_MCH_ID,
        body: orderBody,
        openId: openid
    }
    const r = await fetch('https://api.pay.yungouos.com/api/pay/wxpay/jsapi', {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            ...data,
            notify_url: `${process.env.HOST}/order/checkout/wechat/notify`,
            return_url: `${process.env.HOST}/order/checkout/wechat/pay?id=${id}&oaready=true`,
            sign: signData(data)
        })
    })
    const resp = await r.json()
    if (resp.code === 0) {
        return resp.data
    } else {
        console.error('An error occurred when requesting Weixin Pay:', resp)
    }
    return null
}

export async function getExternalPaymentRedirect(id: number): Promise<string | null> {
    const order = await requireUnpaidOrder(id)
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'development' // Development
    }
    const data = {
        out_trade_no: getOrderTransactionNo(order),
        total_fee: order.totalPrice,
        mch_id: process.env.WX_PAY_MCH_ID,
        body: orderBody
    }
    const r = await fetch('https://api.pay.yungouos.com/api/pay/wxpay/wapPay', {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            ...data,
            notify_url: `${process.env.HOST}/order/checkout/wechat/notify`,
            sign: signData(data)
        })
    })
    const resp = await r.json()
    if (resp.code === 0) {
        return resp.data
    } else {
        console.error('An error occurred when requesting Weixin Pay:', resp)
    }
    return null
}
