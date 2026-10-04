import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextRequest } from 'next/server'

export function safeEqual(a: string, b: string): boolean {
    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}

/**
 * Reads a key from the `Authorization: Bearer` header, the `x-api-key` header, or (for backwards compatibility)
 * the `key` query parameter.
 */
export function getProvidedKey(request: NextRequest, allowQuery: boolean): string | null {
    const authorization = request.headers.get('authorization')
    if (authorization != null && authorization.startsWith('Bearer ')) {
        return authorization.slice('Bearer '.length).trim()
    }
    const header = request.headers.get('x-api-key')
    if (header != null) {
        return header.trim()
    }
    return allowQuery ? request.nextUrl.searchParams.get('key') : null
}

export function isAuthorizedWithKey(request: NextRequest, expected: string | undefined, allowQuery: boolean): boolean {
    const expectedKey = expected?.trim()
    if (expectedKey == null || expectedKey === '') {
        return false
    }
    const provided = getProvidedKey(request, allowQuery)
    return provided != null && safeEqual(provided, expectedKey)
}

export function isAuthorizedCron(request: NextRequest): boolean {
    return isAuthorizedWithKey(request, process.env.CRON_KEY, true)
}
