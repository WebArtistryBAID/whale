'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { HiUpload } from 'react-icons/hi'
import { useEffect, useRef, useState } from 'react'
import If from '@/app/lib/If'

export default function UploadAreaClient({ uploadPrefix, onDone, initialPath = '', disabled = false, onBusyChange }: {
    uploadPrefix: string
    onDone: (path: string) => void
    initialPath?: string
    disabled?: boolean
    onBusyChange?: (busy: boolean) => void
}) {
    const { t } = useTranslationClient('user')
    const inputRef = useRef<HTMLInputElement>(null)
    const requestRef = useRef<XMLHttpRequest | null>(null)
    const callbacks = useRef({ onDone, onBusyChange })
    callbacks.current = { onDone, onBusyChange }
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(false)
    const [done, setDone] = useState(!!initialPath)
    const [path, setPath] = useState(initialPath)

    useEffect(() => () => {
        const request = requestRef.current
        requestRef.current = null
        request?.abort()
    }, [])

    function openPicker() {
        if (!disabled && !requestRef.current) inputRef.current?.click()
    }

    function upload(file: File) {
        if (disabled || requestRef.current) return
        if (!file.type.startsWith('image/') || file.size === 0 || file.size > 10 * 1024 * 1024) {
            setError(true)
            setDone(false)
            return
        }
        setLoading(true)
        setDone(false)
        setError(false)
        setProgress(0)
        callbacks.current.onBusyChange?.(true)
        const formData = new FormData()
        formData.append('file', file)
        const xhr = new XMLHttpRequest()
        requestRef.current = xhr
        const finish = (uploadedPath?: string) => {
            if (requestRef.current !== xhr) return
            requestRef.current = null
            setLoading(false)
            setProgress(0)
            callbacks.current.onBusyChange?.(false)
            if (uploadedPath) {
                setDone(true)
                setPath(uploadedPath)
                callbacks.current.onDone(uploadedPath)
            } else {
                setError(true)
            }
        }
        xhr.open('POST', '/user/manage/storefront/upload', true)
        xhr.timeout = 60000
        xhr.upload.onprogress = event => {
            if (requestRef.current === xhr && event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100))
        }
        xhr.onload = () => {
            try {
                const response = JSON.parse(xhr.responseText)
                finish(xhr.status === 200 && typeof response.path === 'string' && /^[a-f0-9]{40,64}\.webp$/.test(response.path) ? response.path : undefined)
            } catch { finish() }
        }
        xhr.onerror = () => finish()
        xhr.ontimeout = () => finish()
        xhr.onabort = () => finish()
        try { xhr.send(formData) } catch { finish() }
    }

    return <div aria-label={t('manage.storefront.upload.label')}
                onClick={openPicker}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault()
                    if (e.dataTransfer.files.length > 0) {
                        void upload(e.dataTransfer.files[0])
                    }
                }}
                className="bg-yellow-50 hover:bg-yellow-100 hover:dark:bg-yellow-700 dark:bg-yellow-800
        rounded-3xl flex flex-col justify-center items-center text-center p-5
        transition-colors duration-100">
        <input type="file" accept="image/*" disabled={loading || disabled} className="hidden" ref={inputRef} onClick={event => event.stopPropagation()} onChange={e => {
            if (e.currentTarget.files != null && e.currentTarget.files.length > 0) {
                upload(e.currentTarget.files[0])
            }
            e.currentTarget.value = ''
        }}/>
        <HiUpload className="text-yellow-400 dark:text-yellow-300 text-4xl mb-3"/>
        <p className="text-xl font-bold" aria-hidden>{t('manage.storefront.upload.label')}</p>
        <button type="button" aria-live="polite" disabled={loading || disabled} className="text-sm" onClick={event => { event.stopPropagation(); openPicker() }}>
            <If condition={loading}>
                <span className="sr-only">{t('manage.storefront.upload.uploadProgress')}</span>
                {progress}%
            </If>
            <If condition={!loading}>
                <If condition={error}>
                    {t('manage.storefront.upload.error')}
                </If>
                <If condition={done}>
                    {t('manage.storefront.upload.done')}
                </If>
                <If condition={!error && !done}>
                    {t('manage.storefront.upload.cta')}
                </If>
            </If>
        </button>
        <If condition={done}>
            <img width={500} height={200} src={uploadPrefix + path} alt={t('manage.storefront.upload.alt')}
                 className="mt-3 rounded-xl w-full lg:max-w-sm object-cover"/>
        </If>
    </div>
}
