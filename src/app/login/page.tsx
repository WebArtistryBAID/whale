import { redirect } from 'next/navigation'
import { localRedirect } from '@/app/lib/security'

export default async function LoginPage({ searchParams }: {
    searchParams?: Promise<{ [_: string]: string | string[] | undefined }>
}) {
    const p = await searchParams
    // This is protected by proxy, so we can assume that the user is logged in
    if (p?.redirect == null) {
        redirect('/')
    }
    redirect(localRedirect(p.redirect))
}
