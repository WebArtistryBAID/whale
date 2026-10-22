'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useTranslationClient } from '@/app/i18n/client'

export function useStorefrontMutation(operation: 'save' | 'delete') {
    const [loading, setLoading] = useState(false)
    const busy = useRef(false)
    const mounted = useRef(true)
    const router = useRouter()
    const { t } = useTranslationClient('user')

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    async function run(action: () => Promise<string | void>) {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        try {
            const destination = await action()
            if (mounted.current && destination) {
                router.replace(destination)
            }
        } catch {
            if (mounted.current) toast.error(t(`manage.storefront.${operation}Error`))
        } finally {
            busy.current = false
            if (mounted.current) setLoading(false)
        }
    }

    return { loading, run }
}
