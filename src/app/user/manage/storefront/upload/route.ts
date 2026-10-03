import * as fs from 'fs/promises'
import path from 'node:path'
import { requireUserPermission } from '@/app/login/login-actions'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import crypto from 'crypto'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

function getPath(relative: string): string {
    return path.join(process.env.UPLOAD_PATH!, relative)
}

export async function POST(req: NextRequest): Promise<Response> {
    try {
        await requireUserPermission('admin.manage')
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        await fs.access(process.env.UPLOAD_PATH!)
    } catch {
        await fs.mkdir(process.env.UPLOAD_PATH!, { recursive: true })
    }
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    let webpBuffer: Buffer
    try {
        // Re-encoding strips metadata and anything that is not a real image
        webpBuffer = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
            .rotate()
            .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
            .webp()
            .toBuffer()
    } catch {
        return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }
    const hash = crypto.createHash('sha1').update(webpBuffer).digest('hex')
    await fs.writeFile(getPath(hash + '.webp'), webpBuffer)

    return NextResponse.json({ path: hash + '.webp' })
}
