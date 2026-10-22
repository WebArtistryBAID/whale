'use server'

import { User, UserAuditLogType } from '@/generated/prisma/client'
import { me } from '@/app/login/login'
import { localRedirect } from '@/app/lib/security'
import Paginated from '@/app/lib/Paginated'
import { prisma } from '@/app/lib/prisma'

export async function getLoginTarget(redirect: string): Promise<string> {
    return `/login/start?redirect=${encodeURIComponent(localRedirect(redirect))}`
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
    const id = await me()
    if (id == null) return null
    return prisma.user.findUnique({ where: { id, blocked: false } })
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

export async function logOut(): Promise<void> {
    const { cookies } = await import('next/headers')
    ;(await cookies()).delete('access_token')
}
