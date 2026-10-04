import { listHydratedWaitingOrders } from '@/app/lib/order-queries'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedWithKey } from '@/app/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
    const expectedApiKey = process.env.WAITING_ORDERS_API_KEY?.trim()

    if (expectedApiKey == null || expectedApiKey === '') {
        return NextResponse.json({
            error: 'WAITING_ORDERS_API_KEY is not configured.'
        }, {
            status: 500
        })
    }

    if (!isAuthorizedWithKey(request, expectedApiKey, false)) {
        return NextResponse.json({
            error: 'Unauthorized'
        }, {
            status: 401
        })
    }

    // Users only carry id, name and pinyin; see orderUserSelect
    return NextResponse.json(await listHydratedWaitingOrders())
}
