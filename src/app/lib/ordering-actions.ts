'use server'

import { CouponCode, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function couponQuickValidate(code: string): Promise<CouponCode | null> {
    return prisma.couponCode.findUnique({
        where: {
            id: code,
            remainingUses: {
                gt: 0
            }
        }
    })
}
