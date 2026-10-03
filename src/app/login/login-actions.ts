'use server'

import { User, UserAuditLogType } from '@/generated/prisma/client'
import { me } from '@/app/login/login'
import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE, sensitiveCookieOptions } from '@/app/login/jwt'
import { buildLoginUrl, LOGIN_STATE_COOKIE, LOGIN_STATE_MAX_AGE_SECONDS, sanitizeRedirect } from '@/app/login/redirect'
import Paginated from '@/app/lib/Paginated'
import { prisma } from '@/app/lib/prisma'

export async function getLoginTarget(redirect: string): Promise<string> {
    const nonce = crypto.randomUUID();
    (await cookies()).set(LOGIN_STATE_COOKIE, nonce, sensitiveCookieOptions(LOGIN_STATE_MAX_AGE_SECONDS))
    return buildLoginUrl(sanitizeRedirect(redirect), nonce)
}

export async function logout(): Promise<void> {
    (await cookies()).delete(ACCESS_TOKEN_COOKIE)
}

export async function requireUser(): Promise<User> {
    const user = await getMyUser()
    if (!user) {
        throw new Error('Unauthorized')
    }
    return user
}

export async function requireUserPermission(permission: string): Promise<User> {
    const user = await requireUser()
    if (!user.permissions.includes(permission)) {
        throw new Error('Unauthorized')
    }
    return user
}

export async function getMyUser(): Promise<User | null> {
    return prisma.user.findUnique({
        where: { id: await me() ?? -1 }
    })
}

export async function getUser(id: number): Promise<User | null> {
    await requireUserPermission('admin.manage')
    return prisma.user.findUnique({
        where: { id }
    })
}

export async function toggleUserPermission(id: number, permission: string): Promise<void> {
    const me = await requireUserPermission('admin.manage')
    const user = await prisma.user.findUnique({
        where: { id }
    })
    if (!user) {
        return
    }
    if (user.permissions.includes(permission)) {
        await prisma.user.update({
            where: { id },
            data: {
                permissions: {
                    set: user.permissions.filter(p => p !== permission)
                }
            }
        })
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.permissionsUpdated,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                values: [ user.id.toString(), `-${permission}` ]
            }
        })
    } else {
        await prisma.user.update({
            where: { id },
            data: {
                permissions: {
                    set: [ ...user.permissions, permission ]
                }
            }
        })
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.permissionsUpdated,
                user: {
                    connect: {
                        id: me.id
                    }
                },
                values: [ user.id.toString(), `+${permission}` ]
            }
        })
    }
}

export async function getUsers(page: number, keyword: string): Promise<Paginated<User>> {
    await requireUserPermission('admin.manage')
    const pages = Math.ceil(await prisma.user.count({
        where: {
            OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { pinyin: { contains: keyword, mode: 'insensitive' } }
            ]
        }
    }) / 10)
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { pinyin: { contains: keyword, mode: 'insensitive' } }
            ]
        },
        orderBy: {
            pinyin: 'asc'
        },
        skip: page * 10,
        take: 10
    })
    return {
        items: users,
        page,
        pages
    }
}

export async function setUserBlocked(id: number, blocked: boolean): Promise<void> {
    const me = await requireUserPermission('admin.manage')
    if (!Number.isSafeInteger(id) || typeof blocked !== 'boolean' || id === me.id) {
        return
    }
    const updated = await prisma.user.updateMany({
        where: { id },
        data: { blocked }
    })
    if (updated.count < 1) {
        return
    }
    await prisma.userAuditLog.create({
        data: {
            type: blocked ? UserAuditLogType.blocked : UserAuditLogType.unblocked,
            userId: me.id,
            values: [ id.toString() ]
        }
    })
}
