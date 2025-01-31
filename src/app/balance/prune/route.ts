import { PrismaClient, UserAuditLogType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Remove all balance transactions that are older than 1 hour and aren't paid
export async function GET(request: NextRequest): Promise<NextResponse> {
    if (request.nextUrl.searchParams.get('key') !== process.env.CRON_KEY) {
        return NextResponse.json({ success: false })
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
