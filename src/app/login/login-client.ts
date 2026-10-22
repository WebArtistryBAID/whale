import { User } from '@/generated/prisma/browser'
import { useEffect, useState } from 'react'
import { getMyUser } from '@/app/login/login-actions'

export function useCachedUser(): User | null {
    const [user, setUser] = useState<User | null>(null)
    useEffect(() => {
        let active = true
        getMyUser().then(value => { if (active) setUser(value) }).catch(() => { if (active) setUser(null) })
        return () => { active = false }
    }, [])
    return user
}
