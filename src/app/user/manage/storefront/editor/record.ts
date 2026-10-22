import 'server-only'
import { notFound } from 'next/navigation'
import { recordId } from '@/app/lib/item-editor'

export async function editorRecord<T>(rawId: unknown, find: (id: number) => Promise<T | null>): Promise<T | null> {
    if (rawId == null) return null
    const id = recordId(rawId)
    if (id == null) notFound()
    const record = await find(id)
    if (record == null) notFound()
    return record
}
