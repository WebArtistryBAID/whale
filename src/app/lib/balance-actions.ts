'use server'

import { UserAuditLog, UserAuditLogType } from '@/generated/prisma/client'
import { getMyUser } from '@/app/login/login-actions'
import Decimal from 'decimal.js'
import { getConfigValue } from '@/app/lib/settings-actions'
import { me } from '@/app/login/login'
import { prisma } from '@/app/lib/prisma'
import { parseMoneyAmount } from '@/app/lib/pricing'
import { callWeixinPay, getBalanceTransactionNo, isWeixinPayConfigured } from '@/app/lib/wx-pay-api'
import { idSchema } from '@/app/lib/validation'

const orderBody = '白鲸咖啡馆余额充值 The Whale Café Balance Recharge'

/**
 * Returns one of the current user's pending balance top-ups.
 */
async function requireMyPendingTransaction(id: number): Promise<UserAuditLog> {
    const transaction = await getMyTransaction(idSchema.parse(id))
    if (transaction == null) {
        throw new Error('Transaction not found')
    }
    if (transaction.values[1] !== 'await') {
        throw new Error('Transaction already completed')
    }
    return transaction
}

export async function getMyTransaction(id: number): Promise<UserAuditLog | null> {
    if (!Number.isSafeInteger(id)) {
        return null
    }
    return prisma.userAuditLog.findFirst({
        where: {
            id,
            type: UserAuditLogType.balanceTransaction,
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
    if (me == null || me.blocked) {
        return null
    }
    const amount = parseMoneyAmount(value)
    if (amount == null || amount.lte(0)) {
        return null
    }
    if (Decimal(me.balance).add(amount).greaterThan(await getConfigValue('maximum-balance'))
        || amount.lessThan(await getConfigValue('balance-recharge-minimum'))) {
        return null
    }
    return prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.balanceTransaction,
            userId: me.id,
            values: [ amount.toString(), 'await' ]
        }
    })
}

async function getPaymentData(id: number) {
    const trans = await requireMyPendingTransaction(id)
    return {
        out_trade_no: getBalanceTransactionNo(trans),
        total_fee: trans.values[0],
        mch_id: process.env.WX_PAY_MCH_ID!,
        body: orderBody
    }
}

export async function getPaymentQRCode(id: number): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'https://example.com' // Development
    }
    return callWeixinPay('/pay/wxpay/nativePay', await getPaymentData(id), {
        notify_url: `${process.env.HOST}/balance/notify`
    })
}

export async function getWeChatOAuthRedirect(id: number): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'https://example.com' // Development
    }
    return callWeixinPay('/wx/getOauthUrl', {
        mch_id: process.env.WX_PAY_MCH_ID!,
        callback_url: `${process.env.HOST}/balance/${idSchema.parse(id)}/authorize`
    })
}

export async function getOAPaymentPackage(id: number, openid: string): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'development' // Development
    }
    if (typeof openid !== 'string' || openid.length < 1 || openid.length > 128) {
        return null
    }
    return callWeixinPay('/pay/wxpay/jsapi', { ...await getPaymentData(id), openId: openid }, {
        notify_url: `${process.env.HOST}/balance/notify`,
        return_url: `${process.env.HOST}/user`
    })
}

export async function getExternalPaymentRedirect(id: number): Promise<string | null> {
    if (!isWeixinPayConfigured()) {
        return 'development' // Development
    }
    return callWeixinPay('/pay/wxpay/wapPay', await getPaymentData(id), {
        notify_url: `${process.env.HOST}/balance/notify`,
        return_url: `${process.env.HOST}/user`
    })
}
