import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'node prisma/seed.mjs'
    },
    datasource: {
        // Not required for `prisma generate`, so a missing value must not fail installs
        url: process.env.DATABASE_URI ?? ''
    }
})
