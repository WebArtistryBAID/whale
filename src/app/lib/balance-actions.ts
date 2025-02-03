'use server'

import { PrismaClient, UserAuditLog, UserAuditLogType } from '@prisma/client'
import { getMyUser } from '@/app/login/login-actions'
import Decimal from 'decimal.js'
import { getConfigValue } from '@/app/lib/settings-actions'
import { me } from '@/app/login/login'
import signData from '@/app/lib/wx-pay-sign'

const userAgent = 'Whale Cafe (Weixin Pay Client)'
const orderBody = '白鲸咖啡余额充值 Whale Cafe Balance Recharge'

const prisma = new PrismaClient()

function getTransactionNo(auditLog: UserAuditLog): string {
    return `${auditLog.id}-BALANCE${auditLog.time.getTime()}`
}

async function requireTransaction(id: number): Promise<UserAuditLog> {
    const transaction = await prisma.userAuditLog.findUnique({
        where: { id }
    })
    if (transaction == null) {
        throw new Error('Transaction not found')
    }
    if (transaction.values[1] !== 'await') {
        throw new Error('Transaction already completed')
    }
    return transaction
}

export async function getMyTransaction(id: number): Promise<UserAuditLog | null> {
    return prisma.userAuditLog.findFirst({
        where: {
            id,
            userId: await me() ?? -1
        }
    })
}

export async function isTransactionFinished(id: number): Promise<boolean> {
    const transaction = await getMyTransaction(id)
    return transaction != null && transaction.values[1] !== 'await'
}

export async function beginTransaction(value: string): Promise<UserAuditLog | null> {
    const me = await getMyUser()
    if (me == null) {
        return null
    }
    if (Decimal(me.balance).add(value).greaterThan(await getConfigValue('maximum-balance'))
        || Decimal(value).lessThan(await getConfigValue('balance-recharge-minimum'))) {
        return null
    }
    return prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.balanceTransaction,
            userId: me.id,
            values: [ value, 'await' ]
        }
    })
}

export async function getPaymentQRCode(id: number): Promise<string | null> {
    const trans = await requireTransaction(id)
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'https://example.com' // Development
    }
    const data = {
        out_trade_no: getTransactionNo(trans),
        total_fee: trans.values[0],
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
            notify_url: `${process.env.HOST}/balance/notify`,
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
        callback_url: `${process.env.HOST}/balance/${id}/authorize`
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
    const trans = await requireTransaction(id)
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'development' // Development
    }
    const data = {
        out_trade_no: getTransactionNo(trans),
        total_fee: trans.values[0],
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
            notify_url: `${process.env.HOST}/balance/notify`,
            return_url: `${process.env.HOST}/balance/pay?id=${id}&oaready=true`,
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
    const trans = await requireTransaction(id)
    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return 'development' // Development
    }
    const data = {
        out_trade_no: getTransactionNo(trans),
        total_fee: trans.values[0],
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
            notify_url: `${process.env.HOST}/balance/notify`,
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
