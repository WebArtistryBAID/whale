import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE, verifyJwt } from '@/app/login/jwt'

/**
 * Returns the ID of the logged in user, based on the access token cookie.
 * Permissions and other attributes must always be read from the database, never from the token.
 */
export async function me(): Promise<number | null> {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
    if (token == null) {
        return null
    }
    const payload = await verifyJwt(token)
    if (payload == null || payload.type !== 'internal' || typeof payload.id !== 'number') {
        return null
    }
    return payload.id
}
