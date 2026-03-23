import { listHydratedWaitingOrders } from '@/app/lib/waiting-orders'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getProvidedApiKey(request: NextRequest): string | null {
    const authorization = request.headers.get('authorization')
    if (authorization != null && authorization.startsWith('Bearer ')) {
        return authorization.slice('Bearer '.length).trim()
    }

    return request.headers.get('x-api-key')
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    const expectedApiKey = process.env.WAITING_ORDERS_API_KEY?.trim()

    if (expectedApiKey == null || expectedApiKey === '') {
        return NextResponse.json({
            error: 'WAITING_ORDERS_API_KEY is not configured.'
        }, {
            status: 500
        })
    }

    if (getProvidedApiKey(request) !== expectedApiKey) {
        return NextResponse.json({
            error: 'Unauthorized'
        }, {
            status: 401
        })
    }

    return NextResponse.json(await listHydratedWaitingOrders())
}
