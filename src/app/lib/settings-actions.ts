'use server'

import { requireUserPermission } from '@/app/login/login-actions'
import { prisma } from '@/app/lib/prisma'
import { CONFIG_DEFAULTS, isValidConfigValue } from '@/app/lib/settings-schema'

// Initialization only needs to happen once per process. Keeping the promise avoids
// running ~15 queries on every settings read.
let initialization: Promise<void> | null = null

function initialize(): Promise<void> {
    if (initialization == null) {
        initialization = (async () => {
            const existing = new Set((await prisma.settingsItem.findMany({ select: { key: true } })).map(item => item.key))
            const missing = Object.entries({
                initialized: new Date().getTime().toString(),
                ...CONFIG_DEFAULTS
            }).filter(([ key ]) => !existing.has(key))
            if (missing.length > 0) {
                await prisma.settingsItem.createMany({
                    data: missing.map(([ key, value ]) => ({ key, value })),
                    skipDuplicates: true
                })
            }
        })().catch(e => {
            initialization = null
            throw e
        })
    }
    return initialization
}

export async function getConfigValues(): Promise<{ [key: string]: string }> {
    await initialize()
    const items = await prisma.settingsItem.findMany()
    const result: { [key: string]: string } = { ...CONFIG_DEFAULTS }
    for (const item of items) {
        result[item.key] = item.value
    }
    return result
}

export async function getConfigValue(key: string): Promise<string> {
    await initialize()
    const item = await prisma.settingsItem.findUnique({
        where: {
            key
        }
    })
    return item?.value ?? CONFIG_DEFAULTS[key] ?? ''
}

export async function getConfigValueAsBoolean(key: string): Promise<boolean> {
    return (await getConfigValue(key)) === 'true'
}

export async function getConfigValueAsNumber(key: string): Promise<number> {
    return parseFloat(await getConfigValue(key))
}

export async function setConfigValue(key: string, value: string | null): Promise<void> {
    await requireUserPermission('admin.manage')
    if (typeof key !== 'string' || !(key in CONFIG_DEFAULTS)) {
        throw new Error('Unknown setting')
    }
    if (value == null) {
        // Deleting a setting resets it to its default
        await prisma.settingsItem.upsert({
            where: { key },
            update: { value: CONFIG_DEFAULTS[key] },
            create: { key, value: CONFIG_DEFAULTS[key] }
        })
        return
    }
    if (typeof value !== 'string' || !isValidConfigValue(key, value)) {
        throw new Error('Invalid setting value')
    }
    await prisma.settingsItem.upsert({
        where: {
            key
        },
        update: {
            value: value.trim()
        },
        create: {
            key,
            value: value.trim()
        }
    })
}
