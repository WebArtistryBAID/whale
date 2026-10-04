import { headers } from 'next/headers'

// Server-only helpers. Do NOT add 'use server' to this file.
// A simple in-memory fixed-window rate limiter. It is per process, which is enough to slow down brute force attempts.

const buckets = new Map<string, { count: number, resetAt: number }>()
const MAX_BUCKETS = 10000

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    const bucket = buckets.get(key)
    if (bucket == null || bucket.resetAt <= now) {
        if (buckets.size >= MAX_BUCKETS) {
            for (const [ k, b ] of buckets) {
                if (b.resetAt <= now) {
                    buckets.delete(k)
                }
            }
            if (buckets.size >= MAX_BUCKETS) {
                buckets.clear()
            }
        }
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return true
    }
    if (bucket.count >= limit) {
        return false
    }
    bucket.count++
    return true
}

export function resetRateLimits(): void {
    buckets.clear()
}

export async function getClientIp(): Promise<string> {
    const h = await headers()
    return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/**
 * Returns false if the current client has exceeded `limit` calls of `action` within `windowMs`.
 * Logged in users are limited individually. Guests are limited by IP address; many guests can share one address
 * (e.g. a school network), so guest limits should be generous.
 */
export async function checkRateLimit(action: string, limit: number, windowMs: number, userId?: number | null): Promise<boolean> {
    const key = userId != null ? `${action}:user:${userId}` : `${action}:ip:${await getClientIp()}`
    return consumeRateLimit(key, limit, windowMs)
}
