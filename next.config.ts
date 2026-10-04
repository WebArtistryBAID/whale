import type { NextConfig } from 'next'

// Store hours, daily limits and reminders are all computed in the server's local time.
// Default to China Standard Time so a server running in UTC does not shift everything by 8 hours.
process.env.TZ ??= 'Asia/Shanghai'

const nextConfig: NextConfig = {
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
                ]
            }
        ]
    }
}

export default nextConfig
