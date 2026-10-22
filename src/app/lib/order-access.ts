import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { getMyUser } from '@/app/login/login-actions'

async function guestOrders(): Promise<number[]> {
    const token = (await cookies()).get('guest_orders')?.value
    if (!token || !process.env.JWT_SECRET) return []
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), {
            algorithms: ['HS256'], audience: 'guest-orders'
        })
        return Array.isArray(payload.orders) ? payload.orders.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0) : []
    } catch { return [] }
}

export async function grantGuestOrder(id: number): Promise<void> {
    if (!process.env.JWT_SECRET) throw new Error('Session signing key is not configured')
    const orders = [...await guestOrders(), id].slice(-40)
    const token = await new SignJWT({ orders }).setProtectedHeader({ alg: 'HS256' })
        .setAudience('guest-orders').setExpirationTime('30 days')
        .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    ;(await cookies()).set('guest_orders', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 * 30
    })
}

export async function canAccessOrder(order: { id: number, userId: number | null, paymentMethod: string }, allowShared = false): Promise<boolean> {
    const user = await getMyUser()
    if (user && (user.id === order.userId || user.permissions.includes('admin.manage'))) return true
    if ((order.userId == null || allowShared) && (await guestOrders()).includes(order.id)) return true
    return allowShared && order.paymentMethod === 'payForMe'
}
