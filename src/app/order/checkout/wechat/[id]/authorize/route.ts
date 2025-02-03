import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import signData from '@/app/lib/wx-pay-sign'

const userAgent = 'Whale Cafe (Weixin Pay Client)'

export async function GET(request: NextRequest, { params }: {
    params: Promise<{ id: string }>
}): Promise<NextResponse> {
    const code = request.nextUrl.searchParams.get('code')
    if (code == null) {
        return NextResponse.json({ success: false })
    }

    if (process.env.WX_PAY_MCH_ID == null || process.env.WX_PAY_MCH_ID === '') {
        return NextResponse.json({ success: 'development' })
    }
    const data = {
        mch_id: process.env.WX_PAY_MCH_ID,
        code
    }
    const r = await fetch('https://api.pay.yungouos.com/api/wx/getOauthInfo?' + new URLSearchParams({
        ...data,
        sign: signData(data)
    }).toString(), {
        method: 'GET',
        headers: {
            'User-Agent': userAgent
        }
    })
    const resp = await r.json()
    if (resp.code === 0) {
        redirect(`/order/checkout/wechat/pay?openid=${resp.data.openId}&id=${(await params).id}`)
    } else {
        console.error('An error occurred when requesting Weixin Pay:', resp)
    }
    redirect(`/order/checkout/wechat/pay?openid=error&id=${(await params).id}`)
}
