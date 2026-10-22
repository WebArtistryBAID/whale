import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/app/login/session'

const protectedRoutes = [
    '/login',
    '/today-quick'
]

const protectedRoutesPartial = [
    '/user'
]

export default async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
    let isProtected = protectedRoutes.includes(req.nextUrl.pathname)
    for (const path of protectedRoutesPartial) {
        if (req.nextUrl.pathname.startsWith(path)) {
            isProtected = true
            break
        }
    }
    if (!isProtected) {
        return null
    }
    const cookie = (await cookies()).get('access_token')?.value
    if (cookie == null) {
        return NextResponse.redirect(new URL(`/login/start?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, req.nextUrl))
    }
    if (await verifySession(cookie) == null) {
        return NextResponse.redirect(new URL(`/login/start?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, req.nextUrl))
    }

    return null
}
