import { timingSafeEqual } from 'node:crypto'
import signData from './wx-pay-sign'
import { money } from './security'

export function readPaymentNotification(body: FormData, kind: 'ORDER' | 'BALANCE') {
    if (!process.env.WX_PAY_MCH_KEY || !process.env.WX_PAY_MCH_ID) return null
    const fields = ['code', 'orderNo', 'outTradeNo', 'payNo', 'money', 'mchId'] as const
    const data: Record<string, string> = {}
    for (const key of fields) {
        const value = body.get(key)
        if (typeof value !== 'string' || !value || value.length > 200 || body.getAll(key).length !== 1) return null
        data[key] = value
    }
    const signature = body.get('sign')
    if (typeof signature !== 'string' || !/^[A-Fa-f0-9]{32}$/.test(signature) || body.getAll('sign').length !== 1) return null
    if (!timingSafeEqual(Buffer.from(signData(data), 'hex'), Buffer.from(signature, 'hex'))) return null
    if (data.code !== '1' || data.mchId !== process.env.WX_PAY_MCH_ID || !money(data.money, false)) return null
    const match = new RegExp(`^([1-9]\\d*)-${kind}([1-9]\\d*)$`).exec(data.outTradeNo)
    if (!match || !Number.isSafeInteger(Number(match[1])) || !Number.isSafeInteger(Number(match[2]))) return null
    return { id: Number(match[1]), timestamp: Number(match[2]), payNo: data.payNo, amount: money(data.money, false)! }
}
