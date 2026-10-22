import Decimal from 'decimal.js'

export function localRedirect(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) {
        return '/'
    }
    return value
}

export function money(value: unknown, allowZero = true): Decimal | null {
    if (typeof value !== 'string' || !/^\d{1,10}(?:\.\d{1,2})?$/.test(value)) {
        return null
    }
    const amount = new Decimal(value)
    return amount.isFinite() && (allowZero ? amount.gte(0) : amount.gt(0)) ? amount : null
}

export function positiveId(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export async function limitedFormData(request: Request, maximumBytes: number): Promise<FormData> {
    const reader = request.body?.getReader()
    if (!reader) throw new Error('Missing request body')
    const chunks: Uint8Array[] = []
    let size = 0
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.byteLength
            if (size > maximumBytes) {
                await reader.cancel()
                throw new Error('Request body too large')
            }
            chunks.push(value)
        }
    } finally { reader.releaseLock() }
    const body = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
    return new Response(body, { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData()
}
