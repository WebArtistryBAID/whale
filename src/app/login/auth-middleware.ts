import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_TOKEN_COOKIE, sensitiveCookieOptions, verifyJwt } from '@/app/login/jwt'
import { buildLoginUrl, LOGIN_STATE_COOKIE, LOGIN_STATE_MAX_AGE_SECONDS } from '@/app/login/redirect'

const protectedRoutes = [
    '/login',
    '/today-quick'
]

const protectedRoutesPartial = [
    '/user'
]

function isProtected(pathname: string): boolean {
    return protectedRoutes.includes(pathname) ||
        protectedRoutesPartial.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

export default async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
    if (!isProtected(req.nextUrl.pathname)) {
        return null
    }
    const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
    if (token != null && await verifyJwt(token) != null) {
        return null
    }

    const nonce = crypto.randomUUID()
    const response = NextResponse.redirect(buildLoginUrl(req.nextUrl.pathname + req.nextUrl.search, nonce))
    response.cookies.set(LOGIN_STATE_COOKIE, nonce, sensitiveCookieOptions(LOGIN_STATE_MAX_AGE_SECONDS))
    return response
}
