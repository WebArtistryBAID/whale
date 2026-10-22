import { jwtVerify } from 'jose'

export async function verifySession(token: string | undefined): Promise<number | null> {
    const secret = process.env.JWT_SECRET
    if (!token || !secret) return null
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
            algorithms: ['HS256'],
            issuer: 'https://beijing.academy',
            audience: 'https://beijing.academy'
        })
        return payload.type === 'internal' && typeof payload.id === 'number' && Number.isSafeInteger(payload.id) && payload.id > 0 && typeof payload.exp === 'number'
            ? payload.id : null
    } catch {
        return null
    }
}
