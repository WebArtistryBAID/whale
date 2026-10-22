import { NextRequest, NextResponse } from 'next/server'
import { UserAuditLogType } from '@/generated/prisma/client'
import { createSecretKey } from 'node:crypto'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'
import { localRedirect } from '@/app/lib/security'

const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

export async function GET(request: NextRequest): Promise<NextResponse> {
    const search = request.nextUrl.searchParams
    const ip = request.headers.get('X-Forwarded-For') ?? request.headers.get('X-Real-IP') ?? 'localhost'
    const cookieStore = await cookies()
    let state: { state?: string, target?: string } = {}
    try { state = JSON.parse(cookieStore.get('oauth_state')?.value ?? '{}') } catch { /* Invalid state is rejected below. */ }
    cookieStore.set('oauth_state', '', { path: '/login/authorize', maxAge: 0 })
    if (!state || typeof state.state !== 'string' || !state.state || search.get('state') !== state.state) {
        return new NextResponse('Invalid OAuth state', { status: 400 })
    }
    const redirectTarget = localRedirect(state.target)
    if (search.has('error') || !search.get('code')) {
        return NextResponse.redirect(new URL('/login/error', process.env.HOST!))
    }
    const r = await fetch(`${process.env.ONELOGIN_HOST}/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${process.env.ONELOGIN_CLIENT_ID}:${process.env.ONELOGIN_CLIENT_SECRET}`).toString('base64')}`
        },
        signal: AbortSignal.timeout(30000),
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: search.get('code')!,
            redirect_uri: `${process.env.HOST}/login/authorize`
        }).toString()
    })
    const json = await r.json()
    if (!r.ok || 'error' in json || typeof json.access_token !== 'string' || typeof json.refresh_token !== 'string') {
        return NextResponse.redirect(`${process.env.HOST}/login/error`)
    }
    const accessToken = json['access_token']
    const refreshToken = json['refresh_token']

    const me = await fetch(`${process.env.ONELOGIN_HOST}/api/v1/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        signal: AbortSignal.timeout(30000)
    })
    const meJson = await me.json()
    if (!me.ok || !Number.isSafeInteger(meJson.seiueId) || meJson.seiueId <= 0 || typeof meJson.name !== 'string') {
        return new NextResponse('Invalid identity response', { status: 502 })
    }
    const user = await prisma.user.upsert({
        where: {
            id: meJson['seiueId']
        },
        update: {
            name: meJson['name'],
            pinyin: meJson['pinyin'],
            phone: meJson['phone'],
            type: meJson['type'],
            gender: meJson['gender']
        },
        create: {
            id: meJson['seiueId'],
            name: meJson['name'],
            pinyin: meJson['pinyin'],
            phone: meJson['phone'],
            type: meJson['type'],
            gender: meJson['gender']
        }
    })

    if (user.blocked) return new NextResponse('Forbidden', { status: 403 })

    await prisma.oATokens.upsert({
        where: {
            userId: user.id
        },
        update: {
            accessToken,
            refreshToken
        },
        create: {
            userId: user.id,
            accessToken,
            refreshToken
        }
    })

    await prisma.userAuditLog.create({
        data: {
            userId: user.id,
            type: UserAuditLogType.login,
            values: [ request.headers.get('User-Agent') ?? '', ip ]
        }
    })
    const token = await new SignJWT({
        id: user.id,
        type: 'internal'
    })
        .setIssuedAt()
        .setIssuer('https://beijing.academy')
        .setAudience('https://beijing.academy')
        .setExpirationTime('30 days')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
    (await cookies()).set('access_token', token, {
        expires: new Date(Date.now() + 86400000 * 30),
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/'
    })
    return NextResponse.redirect(process.env.HOST! + redirectTarget)
}
