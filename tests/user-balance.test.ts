import 'dotenv/config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Decimal from 'decimal.js'

// Integration test against a real PostgreSQL database. Skipped unless DATABASE_URI is set.
const hasDatabase = process.env.DATABASE_URI != null && process.env.DATABASE_URI !== ''
const TEST_USER = 990001

describe.skipIf(!hasDatabase)('adjustUserBalance (database)', async () => {
    const { prisma } = await import('@/app/lib/prisma')
    const { adjustUserBalance, adjustUserPoints, InsufficientBalanceError } = await import('@/app/lib/user-balance')

    beforeAll(async () => {
        await prisma.user.deleteMany({ where: { id: TEST_USER } })
        await prisma.user.create({
            data: { id: TEST_USER, name: 'Test', pinyin: 'Test', type: 'student', gender: 'others', balance: '30', points: '0' }
        })
    })

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { id: TEST_USER } })
    })

    it('serializes concurrent debits so the balance can never be spent twice', async () => {
        const attempts = await Promise.allSettled(Array.from({ length: 10 }, () =>
            prisma.$transaction(tx => adjustUserBalance(tx, TEST_USER, '-10'))))
        expect(attempts.filter(a => a.status === 'fulfilled')).toHaveLength(3)
        for (const failure of attempts.filter(a => a.status === 'rejected')) {
            expect((failure as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientBalanceError)
        }
        const user = await prisma.user.findUniqueOrThrow({ where: { id: TEST_USER } })
        expect(user.balance).toBe('0')
    })

    it('applies concurrent credits without losing updates', async () => {
        await Promise.all(Array.from({ length: 10 }, () =>
            prisma.$transaction(tx => adjustUserPoints(tx, TEST_USER, '1.5'))))
        const user = await prisma.user.findUniqueOrThrow({ where: { id: TEST_USER } })
        expect(Decimal(user.points).toString()).toBe('15')
    })

    it('never lets points go negative', async () => {
        const points = await prisma.$transaction(tx => adjustUserPoints(tx, TEST_USER, '-1000'))
        expect(points.toString()).toBe('0')
    })
})
