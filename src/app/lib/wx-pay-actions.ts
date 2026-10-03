'use server'

import { PaymentStatus } from '@/generated/prisma/client'
import { requireUnpaidOrder } from '@/app/lib/order-queries'
import { prisma } from '@/app/lib/prisma'
import { callWeixinPay, getOrderTransactionNo, isWeixinPayConfigured } from '@/app/lib/wx-pay-api'
import { idSchema } from '@/app/lib/validation'

const orderBody = '白鲸咖啡馆订单 The Whale Café Order'

export async function getOrderPaymentStatus(id: number): Promise<PaymentStatus> {
    const parsedId = idSchema.safeParse(id)
    const order = parsedId.success ? await prisma.order.findUnique({
        where: { id: parsedId.data },
        select: { paymentStatus: true }
    }) : null
    return order?.paymentStatus ?? PaymentStatus.notPaid
}

async function getPaymentData(id: number) {
    const order = await requireUnpaidOrder(idSchema.parse(id))
    return {
        id: order.id,
        data: {
            out_trade_no: getOrderTransactionNo(order),
            total_fee: order.totalPrice,
            mch_id: process.env.WX_PAY_MCH_ID!,
            body: orderBody
        }
    }
}

export async function getPaymentQRCode(id: number): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'https://example.com' // Development
    }
    const { data } = await getPaymentData(id)
    return callWeixinPay('/pay/wxpay/nativePay', data, {
        notify_url: `${process.env.HOST}/order/checkout/wechat/notify`
    })
}

export async function getWeChatOAuthRedirect(id: number): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'https://example.com' // Development
    }
    return callWeixinPay('/wx/getOauthUrl', {
        mch_id: process.env.WX_PAY_MCH_ID!,
        callback_url: `${process.env.HOST}/order/checkout/wechat/${idSchema.parse(id)}/authorize`
    })
}

export async function getOAPaymentPackage(id: number, openid: string): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'development' // Development
    }
    if (typeof openid !== 'string' || openid.length < 1 || openid.length > 128) {
        return null
    }
    const { id: orderId, data } = await getPaymentData(id)
    return callWeixinPay('/pay/wxpay/jsapi', { ...data, openId: openid }, {
        notify_url: `${process.env.HOST}/order/checkout/wechat/notify`,
        return_url: `${process.env.HOST}/order/details/${orderId}`
    })
}

export async function getExternalPaymentRedirect(id: number): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'development' // Development
    }
    const { id: orderId, data } = await getPaymentData(id)
    return callWeixinPay('/pay/wxpay/wapPay', data, {
        notify_url: `${process.env.HOST}/order/checkout/wechat/notify`,
        return_url: `${process.env.HOST}/order/details/${orderId}`
    })
}
