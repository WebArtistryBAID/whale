import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/app/login/session'
import { prisma } from '@/app/lib/prisma'

export function redirectToLogin(): string {
    return '/login/start'
}

export async function me(): Promise<number | null> {
    return verifySession((await cookies()).get('access_token')?.value)
}

export async function isLoggedIn(): Promise<boolean> {
    const id = await me()
    if (id == null) return false
    const user = await prisma.user.findUnique({ where: { id } })
    return user != null && !user.blocked
}

export async function isLoggedInWithPermission(permission: string): Promise<boolean> {
    const id = await me()
    if (id == null) return false
    const user = await prisma.user.findUnique({ where: { id } })
    return user != null && !user.blocked && user.permissions.includes(permission)
}

export async function requireLogin(): Promise<void> {
    if (!await isLoggedIn()) redirect(redirectToLogin())
}

export async function requirePermission(permission: string): Promise<void> {
    if (!await isLoggedInWithPermission(permission)) throw new Error('Unauthorized')
}
