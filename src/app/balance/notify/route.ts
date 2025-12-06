import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'
import signData from '@/app/lib/wx-pay-sign'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.formData()
    if (signData({
        code: body.get('code'),
        orderNo: body.get('orderNo'),
        outTradeNo: body.get('outTradeNo'),
        payNo: body.get('payNo'),
        money: body.get('money'),
        mchId: body.get('mchId')
    }) !== body.get('sign')) {
        return new NextResponse('FAILURE')
    }

    const id = parseInt((body.get('outTradeNo')! as string).split('-BALANCE')[0])
    const trans = await prisma.userAuditLog.findUnique({
        where: {
            id
        },
        include: {
            user: true
        }
    })
    if (trans == null || trans.time.getTime().toString() !== (body.get('outTradeNo')! as string).split('-BALANCE')[1]) {
        return new NextResponse('FAILURE')
    }
    if (trans.values[1] !== 'await') {
        return new NextResponse('SUCCESS')
    }
    await prisma.userAuditLog.update({
        where: {
            id: trans.id
        },
        data: {
            values: [ trans.values[0], body.get('payNo')! as string ]
        }
    })

    await prisma.user.update({
        where: {
            id: trans.userId!
        },
        data: {
            balance: Decimal(trans.user!.balance).add(trans.values[0]).toString()
        }
    })
    return new NextResponse('SUCCESS')
}
