'use server'

import { requireUserPermission } from '@/app/login/login-actions'
import { prisma } from '@/app/lib/prisma'

void initialize()

async function initialize() {
    if (await prisma.settingsItem.findUnique({
        where: {
            key: 'initialized'
        }
    })) {
        return
    }

    // Set default values for settings
    await setConfigValueInternal('initialized', new Date().getTime().toString())
    await setConfigValueInternal('enable-scheduled-availability', 'true')
    await setConfigValueInternal('weekdays-only', 'true')
    await setConfigValueInternal('open-time', '10:00')
    await setConfigValueInternal('close-time', '15:00')
    await setConfigValueInternal('store-open', 'true')
    await setConfigValueInternal('maximum-cups-per-order', '2')
    await setConfigValueInternal('maximum-cups-per-day', '14')
    await setConfigValueInternal('maximum-balance', '500')
    await setConfigValueInternal('balance-recharge-minimum', '20')
    await setConfigValueInternal('allow-pay-later', 'true')
    await setConfigValueInternal('allow-delivery', 'true')
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
