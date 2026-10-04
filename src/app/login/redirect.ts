// Pure helpers for login redirects, shared by the proxy, route handlers, and server actions.

/**
 * Only allows same-site relative paths such as `/order?x=1`. Anything that could be interpreted as another host
 * (`//evil.com`, `/\evil.com`, `https://...`, `@evil.com`) falls back to `/`.
 */
export function sanitizeRedirect(target: string | null | undefined): string {
    if (typeof target !== 'string' || target.length < 1 || target.length > 2048) {
        return '/'
    }
    if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
        return '/'
    }
    // Reject control characters, which browsers strip and could turn the path into something else
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(target)) {
        return '/'
    }
    return target
}

export interface LoginState {
    nonce: string
    redirect: string
}

export function encodeLoginState(state: LoginState): string {
    return Buffer.from(JSON.stringify({ n: state.nonce, r: sanitizeRedirect(state.redirect) })).toString('base64url')
}

export function decodeLoginState(value: string | null): LoginState | null {
    if (value == null) {
        return null
    }
    try {
        const json = JSON.parse(Buffer.from(value, 'base64url').toString('utf-8'))
        if (typeof json.n !== 'string' || json.n.length < 16) {
            return null
        }
        return {
            nonce: json.n,
            redirect: sanitizeRedirect(json.r)
        }
    } catch {
        return null
    }
}

export const LOGIN_STATE_COOKIE = 'oauth_state'
export const LOGIN_STATE_MAX_AGE_SECONDS = 10 * 60

export function buildLoginUrl(redirect: string, nonce: string): string {
    const params = new URLSearchParams({
        client_id: process.env.ONELOGIN_CLIENT_ID ?? '',
        redirect_uri: `${process.env.HOST}/login/authorize`,
        scope: 'basic phone sms',
        response_type: 'code',
        state: encodeLoginState({ nonce, redirect })
    })
    return `${process.env.ONELOGIN_HOST}/oauth2/authorize?${params.toString()}`
}
