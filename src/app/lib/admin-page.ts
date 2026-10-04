import 'server-only'
import { redirect } from 'next/navigation'
import { getMyUser } from '@/app/login/login-actions'
import { isAdmin } from '@/app/lib/order-access'

/**
 * Sends anyone without admin permission back to their dashboard. Call at the top of every admin page.
 * The data each page loads is still checked separately by the actions it calls.
 */
export async function requireAdminPage(): Promise<void> {
    if (!isAdmin(await getMyUser())) {
        redirect('/user')
    }
}
