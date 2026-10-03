import { UserAuditLogType } from '@/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { isAuthorizedCron } from '@/app/lib/api-auth'

// Remove all balance transactions that are older than 1 hour and aren't paid
export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ success: false }, { status: 401 })
    }
    await prisma.userAuditLog.deleteMany({
        where: {
            type: UserAuditLogType.balanceTransaction,
            values: {
                has: 'await'
            },
            time: {
                lt: new Date(Date.now() - 60 * 60 * 1000)
            }
        }
    })
    return NextResponse.json({ success: true })
}
