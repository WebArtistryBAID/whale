import { redirect } from 'next/navigation'
import { getMyUser } from '@/app/login/login-actions'
import { getMyTransaction } from '@/app/lib/balance-actions'
import BalancePayClient from '@/app/balance/[id]/BalancePayClient'

export default async function BalancePayBase({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id
    const me = await getMyUser()
    const trans = await getMyTransaction(parseInt(id))
    if (trans == null || me == null || trans.values[1] !== 'await' || trans.userId !== me.id) {
        redirect('/')
    }
    return <BalancePayClient trans={trans}/>
}
