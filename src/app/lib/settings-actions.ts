'use server'

import { requireUserPermission } from '@/app/login/login-actions'
import { prisma } from '@/app/lib/prisma'

void initialize()

async function initialize() {
    const defaults: { [key: string]: string } = {
        initialized: new Date().getTime().toString(),
        'enable-scheduled-availability': 'true',
        'weekdays-only': 'true',
        'open-time': '10:00',
        'close-time': '15:00',
        'pre-order-start-time': '10:00',
        'store-open': 'true',
        'maximum-cups-per-order': '2',
        'maximum-cups-per-day': '14',
        'maximum-pre-order-cups-per-day': '0',
        'maximum-balance': '500',
        'balance-recharge-minimum': '20',
        'allow-pay-later': 'true',
        'allow-delivery': 'true',
        'availability-override-date': '0000-00-00',
        'availability-override-value': 'false'
    }

    for (const [ key, value ] of Object.entries(defaults)) {
        const existing = await prisma.settingsItem.findUnique({
            where: {
                key
            }
        })
        if (existing != null) {
            continue
        }
        await setConfigValueInternal(key, value)
    }
}

export async function getConfigValues(): Promise<{ [key: string]: string }> {
    await initialize()
    const items = await prisma.settingsItem.findMany()
    const result: { [key: string]: string } = {}
    for (const item of items) {
        result[item.key] = item.value
    }
    return result
}

export async function getConfigValue(key: string): Promise<string> {
    if (key !== 'initialized') {
        await initialize()
    }
    return (await prisma.settingsItem.findUnique({
        where: {
            key
        }
    }))!.value
}

export async function getConfigValueAsBoolean(key: string): Promise<boolean> {
    return (await getConfigValue(key)) === 'true'
}

export async function getConfigValueAsNumber(key: string): Promise<number> {
    return parseFloat(await getConfigValue(key))
}

export async function setConfigValue(key: string, value: string | null): Promise<void> {
    await requireUserPermission('admin.manage')
    await setConfigValueInternal(key, value)
}

async function setConfigValueInternal(key: string, value: string | null): Promise<void> {
    if (value == null) {
        await prisma.settingsItem.delete({
            where: {
                key
            }
        })
    } else {
        await prisma.settingsItem.upsert({
            where: {
                key
            },
            update: {
                value
            },
            create: {
                key,
                value
            }
        })
    }
}
