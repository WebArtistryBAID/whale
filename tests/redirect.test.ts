import { describe, expect, it } from 'vitest'
import { decodeLoginState, encodeLoginState, sanitizeRedirect } from '@/app/login/redirect'

describe('sanitizeRedirect', () => {
    it.each([ '/', '/order', '/order/checkout?x=1', '/login?redirect=%2Forder' ])('keeps same-site path %s', path => {
        expect(sanitizeRedirect(path)).toBe(path)
    })

    it.each([
        '//evil.com',
        '/\\evil.com',
        'https://evil.com',
        '@evil.com',
        '.evil.com',
        'javascript:alert(1)',
        '/\tevil',
        '',
        null,
        undefined
    ])('rejects %s', path => {
        expect(sanitizeRedirect(path)).toBe('/')
    })
})

describe('login state', () => {
    it('round-trips nonce and redirect', () => {
        const state = encodeLoginState({ nonce: '0123456789abcdef', redirect: '/order' })
        expect(decodeLoginState(state)).toEqual({ nonce: '0123456789abcdef', redirect: '/order' })
    })

    it('sanitizes the redirect inside a forged state', () => {
        const forged = Buffer.from(JSON.stringify({ n: '0123456789abcdef', r: '//evil.com' })).toString('base64url')
        expect(decodeLoginState(forged)?.redirect).toBe('/')
    })

    it('rejects malformed states', () => {
        expect(decodeLoginState('not-base64-json')).toBeNull()
        expect(decodeLoginState(null)).toBeNull()
        expect(decodeLoginState(Buffer.from(JSON.stringify({ n: 'short', r: '/' })).toString('base64url'))).toBeNull()
    })
})
