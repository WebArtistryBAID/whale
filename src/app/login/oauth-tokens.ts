import 'server-only'
import { decodeJwt } from 'jose'
import { prisma } from '@/app/lib/prisma'

export async function getAccessToken(userId: number): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        include: {
            oaTokens: true
        }
    })
    if (!user || user.blocked || !user.oaTokens) {
        return null
    }
    const access = user.oaTokens.accessToken
    const refresh = user.oaTokens.refreshToken
    // Check if token has expired, if so refresh
    let decoded
    try { decoded = decodeJwt(access) } catch { return null }
    if (typeof decoded.exp !== 'number') return null
    if (decoded.exp * 1000 < Date.now()) {
        const response = await fetch(`${process.env.ONELOGIN_HOST}/oauth2/token`, {
            method: 'POST',
            signal: AbortSignal.timeout(10000),
            headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.ONELOGIN_CLIENT_ID}:${process.env.ONELOGIN_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh
            }).toString()
        })
        const json = await response.json()
        if (!response.ok || 'error' in json || typeof json.access_token !== 'string' || typeof json.refresh_token !== 'string') {
            return null
        }
        await prisma.oATokens.update({
            where: {
                userId: user.id
            },
            data: {
                accessToken: json['access_token'],
                refreshToken: json['refresh_token']
            }
        })
        return json['access_token']
    }
    return access
}

