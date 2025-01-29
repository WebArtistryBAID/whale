import { NextRequest, NextResponse } from 'next/server'
import md5 from 'md5'
import { redirect } from 'next/navigation'

const userAgent = 'Whale Cafe (Weixin Pay Client)'

// ONLY required parameters need to go into the signature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function signData(params: any): string {
    const key = process.env.WXPAY_MCH_KEY
    const paramsArr = Object.keys(params)
    paramsArr.sort()
    const stringArr = []
    paramsArr.map(key => {
        stringArr.push(`key=${params[key]}`)
    })
    stringArr.push(`key=${key}`)
    return md5(stringArr.join('&')).toString().toUpperCase()
}

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
    const r = await fetch('https://api.pay.yungouos.com/api/wx/getOauthInfo', {
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
        redirect(`/order/checkout/wechat/${(await params).id}?openid=${resp.data.openId}`)
    }
    redirect(`/order/checkout/wechat/${(await params).id}?openid=error`)
}
