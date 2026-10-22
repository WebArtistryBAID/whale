import * as fs from 'fs/promises'
import path from 'node:path'
import { requireUserPermission } from '@/app/login/login-actions'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import crypto from 'crypto'
import { limitedFormData } from '@/app/lib/security'

export async function POST(req: NextRequest): Promise<Response> {
    try { await requireUserPermission('admin.manage') } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!process.env.UPLOAD_PATH) return NextResponse.json({ error: 'Uploads unavailable' }, { status: 503 })
    let formData: FormData
    try { formData = await limitedFormData(req, 10 * 1024 * 1024 + 65536) } catch {
        return NextResponse.json({ error: 'Invalid or oversized upload' }, { status: 413 })
    }
    const file = formData.get('file')
    if (!(file instanceof File) || !file.type.startsWith('image/') || file.size === 0 || file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }
    let webpBuffer: Buffer
    try {
        webpBuffer = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25000000, animated: false }).rotate().webp().toBuffer()
    } catch {
        return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }
    const hash = crypto.createHash('sha256').update(webpBuffer).digest('hex')
    await fs.mkdir(process.env.UPLOAD_PATH, { recursive: true })
    await fs.writeFile(path.join(process.env.UPLOAD_PATH, hash + '.webp'), webpBuffer)
    return NextResponse.json({ path: hash + '.webp' })
}
