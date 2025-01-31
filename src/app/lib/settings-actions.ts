'use server'

import { PrismaClient } from '@prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'

const prisma = new PrismaClient()

async function initialize() {
    if (await getConfigValue('initialized') != null) {
        return
    }

    // Set default values for settings
    await setConfigValue('initialized', new Date().getTime().toString())
    await setConfigValue('enable-scheduled-availability', 'true')
    await setConfigValue('weekdays-only', 'true')
    await setConfigValue('open-time', '10:00')
    await setConfigValue('close-time', '15:00')
    await setConfigValue('store-open', 'true')
    await setConfigValue('maximum-cups-per-order', '2')
    await setConfigValue('maximum-cups-per-day', '14')
    await setConfigValue('maximum-balance', '500')
    await setConfigValue('balance-recharge-minimum', '20')
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
