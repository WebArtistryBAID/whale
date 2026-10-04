// Dates rendered on both the server and in the browser must format identically, or React reports a hydration
// mismatch. `toLocaleString()` depends on the runtime's locale and time zone, so pin both to the store's.

const STORE_TIME_ZONE = 'Asia/Shanghai'

// sv-SE gives an ISO-like "2026-10-04 09:30", which reads the same in Chinese and English.
const dateTimeFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: STORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
})

const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: STORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

export function formatDateTime(date: Date): string {
    return dateTimeFormat.format(date)
}

export function formatDate(date: Date): string {
    return dateFormat.format(date)
}
