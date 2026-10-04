import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import signData from '@/app/lib/wx-pay-sign'

const userAgent = 'Whale Cafe (Weixin Pay Client)'
const API_BASE = 'https://api.pay.yungouos.com/api'

export function isWeixinPayConfigured(): boolean {
    return process.env.WX_PAY_MCH_ID != null && process.env.WX_PAY_MCH_ID !== ''
}

export function getOrderTransactionNo(order: { id: number, createdAt: Date }): string {
    return `${order.id}-ORDER${order.createdAt.getTime()}`
}

export function getBalanceTransactionNo(transaction: { id: number, time: Date }): string {
    return `${transaction.id}-BALANCE${transaction.time.getTime()}`
}

/**
 * Calls a YunGouOS endpoint. `signed` are the parameters included in the signature, `extra` are sent unsigned.
 * Returns the `data` field on success, or null.
 */
export async function callWeixinPay(path: string, signed: { [key: string]: string }, extra: { [key: string]: string } = {}): Promise<string | null> {
    try {
        const r = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'User-Agent': userAgent,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: AbortSignal.timeout(15000),
            body: new URLSearchParams({
                ...signed,
                ...extra,
                sign: signData(signed)
            })
        })
        const resp = await r.json()
        if (resp.code === 0) {
            return resp.data ?? ''
        }
        console.error('An error occurred when requesting Weixin Pay:', path, resp)
    } catch (e) {
        console.error('An error occurred when requesting Weixin Pay:', path, e)
    }
    return null
}

export async function refundWeixinPay(outTradeNo: string, money: string): Promise<boolean> {
    if (!isWeixinPayConfigured()) {
        return true
    }
    return await callWeixinPay('/pay/wxpay/refundOrder', {
        out_trade_no: outTradeNo,
        mch_id: process.env.WX_PAY_MCH_ID!,
        money
    }) != null
}

export interface WeixinPayNotification {
    orderNo: string
    outTradeNo: string
    payNo: string
    money: string
}

/**
 * Verifies the signature of a payment notification and that it reports a successful payment to our merchant ID.
 */
export function parseWeixinPayNotification(body: FormData): WeixinPayNotification | null {
    if (!isWeixinPayConfigured() || process.env.WX_PAY_MCH_KEY == null || process.env.WX_PAY_MCH_KEY === '') {
        return null
    }
    const fields = [ 'code', 'orderNo', 'outTradeNo', 'payNo', 'money', 'mchId' ] as const
    const values: { [key: string]: string } = {}
    for (const field of fields) {
        const value = body.get(field)
        if (typeof value !== 'string') {
            return null
        }
        values[field] = value
    }
    const sign = body.get('sign')
    if (typeof sign !== 'string') {
        return null
    }
    const expected = Buffer.from(signData(values))
    const actual = Buffer.from(sign.toUpperCase())
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return null
    }
    // code 1 means the payment succeeded
    if (values.code !== '1' || values.mchId !== process.env.WX_PAY_MCH_ID) {
        return null
    }
    return {
        orderNo: values.orderNo,
        outTradeNo: values.outTradeNo,
        payNo: values.payNo,
        money: values.money
    }
}
