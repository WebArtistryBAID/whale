'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { HiUpload } from 'react-icons/hi'
import { useRef, useState } from 'react'
import If from '@/app/lib/If'

export default function UploadAreaClient({ onDone }: { onDone: (path: string) => void }) {
    const { t } = useTranslationClient('user')
    const inputRef = useRef<HTMLInputElement>(null)
    const [ loading, setLoading ] = useState(false)
    const [ progress, setProgress ] = useState(0)
    const [ error, setError ] = useState(false)
    const [ done, setDone ] = useState(false)

    async function upload(file: File) {
        setLoading(true)
        setDone(false)
        setError(false)
        setProgress(0)
        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest() // Using this makes me feel ancient
        xhr.open('POST', '/user/manage/storefront/upload', true)
        xhr.upload.onprogress = (e: ProgressEvent) => {
            if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100))
            }
        }
        xhr.onload = () => {
            setLoading(false)
            setProgress(0)
            if (xhr.status === 200) {
                setDone(true)
                onDone(JSON.parse(xhr.responseText).path)
            } else {
                setError(true)
            }
        }
        xhr.onerror = () => {
            setError(true)
        }
        xhr.send(formData)
    }

    return <div aria-label={t('manage.storefront.upload.label')} onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault()
                    if (e.dataTransfer.files.length > 0) {
                        void upload(e.dataTransfer.files[0])
                    }
                }}
                className="bg-yellow-50 hover:bg-yellow-100 hover:dark:bg-yellow-700 dark:bg-yellow-800
        rounded-3xl flex justify-center items-center text-center p-5
        transition-colors duration-100">
        <input type="file" disabled={loading} className="hidden" ref={inputRef} onChange={e => {
            if (e.currentTarget.files != null && e.currentTarget.files.length > 0) {
                void upload(e.currentTarget.files[0])
            }
        }}/>
        <HiUpload className="text-yellow-400 dark:text-yellow-300 text-2xl mb-3"/>
        <p className="text-xl font-bold mb-1" aria-hidden>{t('manage.storefront.upload.label')}</p>
        <button aria-live="polite" disabled={loading} onClick={() => inputRef.current?.click()}>
            <If condition={loading}>
                <span className="sr-only">{t('manage.upload.uploadProgress')}</span>
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
    </div>
}
