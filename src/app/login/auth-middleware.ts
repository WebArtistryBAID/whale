import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getLoginTarget } from '@/app/login/login-actions'

const protectedRoutes = [
    'TODO'
]

const protectedRoutesPartial = [
    'TODO'
]

export default async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const path = req.nextUrl.pathname
    let isProtected = false
    for (const path of protectedRoutesPartial) {
        if (req.nextUrl.pathname.startsWith(path)) {
            isProtected = true
            break
        }
    }
    if (!protectedRoutes.includes(path) && !isProtected) {
        return null
    }
    const cookie = (await cookies()).get('access_token')?.value
    if (cookie == null) {
        return NextResponse.redirect(new URL(await getLoginTarget(req.nextUrl.pathname + req.nextUrl.search), req.nextUrl))
    }
    try {
        await jwtVerify(cookie, new TextEncoder().encode(process.env.JWT_SECRET!))
    } catch {
        return NextResponse.redirect(new URL(await getLoginTarget(req.nextUrl.pathname + req.nextUrl.search), req.nextUrl))
    }

    return null
}
