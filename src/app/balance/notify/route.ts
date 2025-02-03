import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'
import signData from '@/app/lib/wx-pay-sign'

const prisma = new PrismaClient()

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json()
    if (signData({
        code: body.code,
        orderNo: body.orderNo,
        outTradeNo: body.outTradeNo,
        payNo: body.payNo,
        money: body.money,
        mchId: body.mchId
    }) !== body.sign) {
        return new NextResponse('FAILURE')
    }

    const id = parseInt(body.outTradeNo.split('-BALANCE')[0])
    const trans = await prisma.userAuditLog.findUnique({
        where: {
            id
        },
        include: {
            user: true
        }
    })
    if (trans == null || trans.time.getTime().toString() !== body.outTradeNo.split('-BALANCE')[1]) {
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
            values: [ trans.values[0], body.payNo ]
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
