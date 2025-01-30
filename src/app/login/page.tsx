import { redirect } from 'next/navigation'

export default async function LoginPage({ searchParams }: {
    searchParams?: { [_: string]: string | string[] | undefined }
}) {
    // This is protected by middleware, so we can assume that the user is logged in
    if (searchParams?.redirect == null) {
        redirect('/')
    }
    redirect(searchParams.redirect as string)
}
