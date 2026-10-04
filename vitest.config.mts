import { defineConfig } from 'vitest/config'
import path from 'node:path'

process.env.TZ = 'Asia/Shanghai'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'server-only': path.resolve(__dirname, 'tests/server-only-stub.ts')
        }
    },
    test: {
        include: [ 'tests/**/*.test.ts' ],
        environment: 'node'
    }
})
