import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, UserAuditLogType } from '@prisma/client'
import { createSecretKey } from 'node:crypto'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()
const secret = createSecretKey(process.env.JWT_SECRET!, 'utf-8')

export async function GET(request: NextRequest): Promise<NextResponse> {
    const search = request.nextUrl.searchParams
    const ip = request.headers.get('X-Forwarded-For') ?? request.headers.get('X-Real-IP') ?? 'localhost'
    let redirectTarget = '/'
    if (search.has('state')) {
        redirectTarget = search.get('state')!
    }
    if (search.has('error')) {
        if (search.get('error') === 'access_denied') {
            return NextResponse.redirect('/')
        }
        return NextResponse.redirect(`${process.env.HOST}/login/error`)
    }
    const r = await fetch(`${process.env.ONELOGIN_HOST}/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${process.env.ONELOGIN_CLIENT_ID}:${process.env.ONELOGIN_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: search.get('code')!,
            redirect_uri: `${process.env.HOST}/login/authorize`
        }).toString()
    })
    const json = await r.json()
    if ('error' in json) {
        return NextResponse.redirect(`${process.env.HOST}/login/error`)
    }
    const accessToken = json['access_token']
    const refreshToken = json['refresh_token']

    const me = await fetch(`${process.env.ONELOGIN_HOST}/api/v1/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    const meJson = await me.json()
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
        name: user.name,
        phone: user.phone,
        pinyin: user.pinyin,
        permissions: user.permissions,
        userType: user.type,
        gender: user.gender,
        blocked: user.blocked,
        balance: user.balance,
        points: user.points,
        type: 'internal'
    })
        .setIssuedAt()
        .setIssuer('https://beijing.academy')
        .setAudience('https://beijing.academy')
        .setExpirationTime('30 days')
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
    (await cookies()).set('access_token', token, {
        expires: new Date(Date.now() + 86400000 * 30)
    })
    return NextResponse.redirect(process.env.HOST! + redirectTarget)
}
