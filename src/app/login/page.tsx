import { redirect } from 'next/navigation'
import { sanitizeRedirect } from '@/app/login/redirect'

export default async function LoginPage({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    // This is protected by proxy, so we can assume that the user is logged in
    redirect(sanitizeRedirect(typeof p?.redirect === 'string' ? p.redirect : '/'))
}
