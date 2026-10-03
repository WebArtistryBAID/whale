import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { User } from '@/generated/prisma/client'
import { getJwtSecret, JWT_AUDIENCE, JWT_ISSUER, sensitiveCookieOptions, verifyJwt } from '@/app/login/jwt'

const GUEST_ORDERS_COOKIE = 'guest_orders'
const GUEST_ORDERS_MAX_AGE_SECONDS = 2 * 24 * 60 * 60
const GUEST_ORDERS_LIMIT = 20

/**
 * Orders placed without logging in are only accessible from the browser that created them.
 * Their IDs are stored in a signed, HTTP-only cookie.
 */
export async function getGuestOrderIds(): Promise<number[]> {
    const token = (await cookies()).get(GUEST_ORDERS_COOKIE)?.value
    if (token == null) {
        return []
    }
    const payload = await verifyJwt(token)
    if (payload == null || payload.type !== 'guest-orders' || !Array.isArray(payload.orders)) {
        return []
    }
    return payload.orders.filter((id): id is number => typeof id === 'number')
}

export async function rememberGuestOrder(orderId: number): Promise<void> {
    const orders = [ ...(await getGuestOrderIds()).filter(id => id !== orderId), orderId ].slice(-GUEST_ORDERS_LIMIT)
    const token = await new SignJWT({ type: 'guest-orders', orders })
        .setIssuedAt()
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime(`${GUEST_ORDERS_MAX_AGE_SECONDS}s`)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(getJwtSecret());
    (await cookies()).set(GUEST_ORDERS_COOKIE, token, sensitiveCookieOptions(GUEST_ORDERS_MAX_AGE_SECONDS))
}

export function isAdmin(user: Pick<User, 'permissions'> | null): boolean {
    return user != null && user.permissions.includes('admin.manage')
}

/**
 * Whether `viewer` may view or act on an order owned by `orderUserId`.
 */
export async function canAccessOrder(order: { id: number, userId: number | null },
                                     viewer: Pick<User, 'id' | 'permissions'> | null): Promise<boolean> {
    if (isAdmin(viewer)) {
        return true
    }
    if (order.userId != null) {
        return viewer != null && viewer.id === order.userId
    }
    return (await getGuestOrderIds()).includes(order.id)
}
