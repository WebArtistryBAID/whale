import { NextRequest, NextResponse } from 'next/server'
import { UserAuditLogType } from '@/generated/prisma/client'
import { SignJWT } from 'jose'
import { prisma } from '@/app/lib/prisma'
import {
    ACCESS_TOKEN_COOKIE,
    ACCESS_TOKEN_MAX_AGE_SECONDS,
    getJwtSecret,
    JWT_AUDIENCE,
    JWT_ISSUER,
    sensitiveCookieOptions
} from '@/app/login/jwt'
import { decodeLoginState, LOGIN_STATE_COOKIE } from '@/app/login/redirect'
import { exchangeOneLoginCode } from '@/app/login/onelogin'
import { getClientIp } from '@/app/lib/rate-limit'

function redirectTo(path: string): NextResponse {
    const response = NextResponse.redirect(`${process.env.HOST}${path}`)
    response.cookies.delete(LOGIN_STATE_COOKIE)
    return response
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    const search = request.nextUrl.searchParams
    if (search.has('error')) {
        if (search.get('error') === 'access_denied') {
            return redirectTo('/')
        }
        return redirectTo('/login/error')
    }

    // Protect against login CSRF: the state must carry the nonce we stored in this browser before redirecting
    const state = decodeLoginState(search.get('state'))
    const expectedNonce = request.cookies.get(LOGIN_STATE_COOKIE)?.value
    if (state == null || expectedNonce == null || state.nonce !== expectedNonce) {
        return redirectTo('/login/error')
    }

    const code = search.get('code')
    if (code == null || code.length < 1) {
        return redirectTo('/login/error')
    }
    const tokens = await exchangeOneLoginCode(code, `${process.env.HOST}/login/authorize`)
    if (tokens == null) {
        return redirectTo('/login/error')
    }

    let meJson
    try {
        const me = await fetch(`${process.env.ONELOGIN_HOST}/api/v1/me`, {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`
            },
            signal: AbortSignal.timeout(30000)
        })
        meJson = await me.json()
        if (!me.ok || typeof meJson['seiueId'] !== 'number' || typeof meJson['name'] !== 'string') {
            return redirectTo('/login/error')
        }
    } catch {
        return redirectTo('/login/error')
    }

    const profile = {
        name: meJson['name'],
        pinyin: meJson['pinyin'] ?? '',
        phone: meJson['phone'] ?? null,
        type: meJson['type'],
        gender: meJson['gender']
    }
    const user = await prisma.user.upsert({
        where: {
            id: meJson['seiueId']
        },
        update: profile,
        create: {
            id: meJson['seiueId'],
            ...profile
        }
    })

    await prisma.oATokens.upsert({
        where: {
            userId: user.id
        },
        update: tokens,
        create: {
            userId: user.id,
            ...tokens
        }
    })

    await prisma.userAuditLog.create({
        data: {
            userId: user.id,
            type: UserAuditLogType.login,
            values: [ request.headers.get('User-Agent') ?? '', await getClientIp() ]
        }
    })

    // The token only identifies the user. Everything else (permissions, balance, blocked status...)
    // is always read from the database so that changes take effect immediately.
    const token = await new SignJWT({
        id: user.id,
        type: 'internal'
    })
        .setIssuedAt()
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE_SECONDS}s`)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(getJwtSecret())
    const response = redirectTo(state.redirect)
    response.cookies.set(ACCESS_TOKEN_COOKIE, token, sensitiveCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS))
    return response
}
