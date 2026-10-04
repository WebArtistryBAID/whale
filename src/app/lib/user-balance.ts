import 'server-only'
import Decimal from 'decimal.js'
import { Prisma } from '@/generated/prisma/client'

type TransactionClient = Prisma.TransactionClient

export class InsufficientBalanceError extends Error {
    constructor() {
        super('insufficient-balance')
    }
}

interface LockedUserAmounts {
    balance: Decimal
    points: Decimal
}

/**
 * Locks the user row until the surrounding transaction ends, so concurrent updates for the same user are serialized.
 */
export async function lockUserRow(tx: TransactionClient, userId: number): Promise<void> {
    await lockUser(tx, userId)
}

async function lockUser(tx: TransactionClient, userId: number): Promise<LockedUserAmounts> {
    const rows = await tx.$queryRaw<{ balance: string, points: string }[]>`SELECT "balance", "points" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
    if (rows.length < 1) {
        throw new Error('user-not-found')
    }
    return {
        balance: Decimal(rows[0].balance),
        points: Decimal(rows[0].points)
    }
}

/**
 * Atomically changes a user's balance by `delta` and returns the new balance.
 * Throws InsufficientBalanceError if the resulting balance would be negative.
 */
export async function adjustUserBalance(tx: TransactionClient, userId: number, delta: Decimal.Value): Promise<Decimal> {
    const { balance } = await lockUser(tx, userId)
    const updated = balance.add(delta)
    if (updated.isNegative() || !updated.isFinite()) {
        throw new InsufficientBalanceError()
    }
    await tx.user.update({
        where: { id: userId },
        data: { balance: updated.toString() }
    })
    return updated
}

/**
 * Atomically changes a user's points by `delta` (never going below zero) and returns the new value.
 */
export async function adjustUserPoints(tx: TransactionClient, userId: number, delta: Decimal.Value): Promise<Decimal> {
    const { points } = await lockUser(tx, userId)
    const updated = Decimal.max(0, points.add(delta))
    await tx.user.update({
        where: { id: userId },
        data: { points: updated.toString() }
    })
    return updated
}
