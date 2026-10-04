import 'server-only'
import { decodeJwt } from 'jose'
import { prisma } from '@/app/lib/prisma'

function getClientAuthorization(): string {
    return `Basic ${Buffer.from(`${process.env.ONELOGIN_CLIENT_ID}:${process.env.ONELOGIN_CLIENT_SECRET}`).toString('base64')}`
}

/**
 * Returns a valid OneLogin access token for the given user, refreshing it if it has expired.
 */
export async function getOneLoginAccessToken(userId: number): Promise<string | null> {
    const tokens = await prisma.oATokens.findUnique({
        where: { userId }
    })
    if (tokens == null) {
        return null
    }
    let expiresAt = 0
    try {
        expiresAt = (decodeJwt(tokens.accessToken).exp ?? 0) * 1000
    } catch {
        // Treat undecodable tokens as expired
    }
    // Refresh a minute early so the token does not expire mid-request
    if (expiresAt - 60 * 1000 > Date.now()) {
        return tokens.accessToken
    }
    try {
        const response = await fetch(`${process.env.ONELOGIN_HOST}/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: getClientAuthorization(),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: AbortSignal.timeout(15000),
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokens.refreshToken
            }).toString()
        })
        const json = await response.json()
        if (!response.ok || 'error' in json || typeof json['access_token'] !== 'string') {
            return null
        }
        await prisma.oATokens.update({
            where: { userId },
            data: {
                accessToken: json['access_token'],
                refreshToken: json['refresh_token'] ?? tokens.refreshToken
            }
        })
        return json['access_token']
    } catch (e) {
        console.error('Failed to refresh OneLogin token for user', userId, e)
        return null
    }
}

export async function exchangeOneLoginCode(code: string, redirectUri: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    try {
        const r = await fetch(`${process.env.ONELOGIN_HOST}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: getClientAuthorization()
            },
            signal: AbortSignal.timeout(30000),
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            }).toString()
        })
        const json = await r.json()
        if (!r.ok || 'error' in json || typeof json['access_token'] !== 'string') {
            return null
        }
        return {
            accessToken: json['access_token'],
            refreshToken: json['refresh_token']
        }
    } catch (e) {
        console.error('Failed to exchange OneLogin code', e)
        return null
    }
}
