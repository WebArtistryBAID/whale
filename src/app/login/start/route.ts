import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { localRedirect } from '@/app/lib/security'

export async function GET(request: NextRequest): Promise<NextResponse> {
    const state = randomBytes(32).toString('hex')
    const target = localRedirect(request.nextUrl.searchParams.get('redirect'))
    const url = new URL('/oauth2/authorize', process.env.ONELOGIN_HOST!)
    url.search = new URLSearchParams({
        client_id: process.env.ONELOGIN_CLIENT_ID!,
        redirect_uri: `${process.env.HOST}/login/authorize`,
        scope: 'basic phone sms', response_type: 'code', state
    }).toString()
    const response = NextResponse.redirect(url)
    response.cookies.set('oauth_state', JSON.stringify({ state, target }), {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        path: '/login/authorize', maxAge: 600
    })
    return response
}
