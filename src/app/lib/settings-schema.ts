// Known settings, their defaults, and how their values are validated. See README.md for descriptions.

export const CONFIG_DEFAULTS: { [key: string]: string } = {
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

type ConfigType = 'boolean' | 'time' | 'integer' | 'money' | 'date'

const CONFIG_TYPES: { [key: string]: ConfigType } = {
    'enable-scheduled-availability': 'boolean',
    'weekdays-only': 'boolean',
    'open-time': 'time',
    'close-time': 'time',
    'pre-order-start-time': 'time',
    'store-open': 'boolean',
    'maximum-cups-per-order': 'integer',
    'maximum-cups-per-day': 'integer',
    'maximum-pre-order-cups-per-day': 'integer',
    'maximum-balance': 'money',
    'balance-recharge-minimum': 'money',
    'allow-pay-later': 'boolean',
    'allow-delivery': 'boolean',
    'availability-override-date': 'date',
    'availability-override-value': 'boolean'
}

export function isValidConfigValue(key: string, value: string): boolean {
    const trimmed = value.trim()
    switch (CONFIG_TYPES[key]) {
        case 'boolean':
            return trimmed === 'true' || trimmed === 'false'
        case 'time':
            return /^([01]?\d|2[0-3]):[0-5]\d$/.test(trimmed)
        case 'integer':
            return /^\d{1,6}$/.test(trimmed)
        case 'money':
            return /^\d{1,7}(\.\d{1,2})?$/.test(trimmed)
        case 'date':
            return /^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)
        default:
            return false
    }
}
