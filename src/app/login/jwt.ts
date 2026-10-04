import { jwtVerify, JWTPayload } from 'jose'

// Server-only helpers. Do NOT add 'use server' to this file.

export const JWT_ISSUER = 'https://beijing.academy'
export const JWT_AUDIENCE = 'https://beijing.academy'
export const ACCESS_TOKEN_COOKIE = 'access_token'
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET
    if (secret == null || secret === '') {
        throw new Error('JWT_SECRET must be set')
    }
    return new TextEncoder().encode(secret)
}

export async function verifyJwt(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret(), {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            algorithms: [ 'HS256' ]
        })
        return payload
    } catch {
        return null
    }
}

export function isSecureDeployment(): boolean {
    return process.env.HOST?.startsWith('https://') === true
}

/**
 * Cookie options for all sensitive cookies.
 */
export function sensitiveCookieOptions(maxAgeSeconds: number) {
    return {
        httpOnly: true,
        secure: isSecureDeployment(),
        sameSite: 'lax' as const,
        path: '/',
        maxAge: maxAgeSeconds
    }
}
