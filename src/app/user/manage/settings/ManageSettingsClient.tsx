'use client'

import { useState } from 'react'
import { getConfigValues, setConfigValue } from '@/app/lib/settings-actions'
import Decimal from 'decimal.js'
import { Breadcrumb, BreadcrumbItem, Button, TextInput, ToggleSwitch } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'

export default function ManageSettingsClient({ initValues }: { initValues: { [key: string]: string } }) {
    const { t } = useTranslationClient('user')
    const [ values, setValues ] = useState(initValues)
    const [ tmpValues, setTmpValues ] = useState(initValues)
    const [ loading, setLoading ] = useState(false)
    const [ hasErrors, setHasErrors ] = useState<string[]>([])

    async function commit() {
        if (hasErrors.length > 0) {
            return
        }
        setLoading(true)
        for (const key in tmpValues) {
            if (values[key] !== tmpValues[key]) {
                await setConfigValue(key, tmpValues[key])
            }
        }
        const newV = await getConfigValues()
        setValues(newV)
        setTmpValues(newV)
        setHasErrors([])
        setLoading(false)
    }

    function setBooleanValue(key: string, value: boolean) {
        setTmpValues(p => {
            const result = { ...p }
            result[key] = value ? 'true' : 'false'
            return result
        })
    }

    function setValue(key: string, value: string) {
        setTmpValues(p => {
            const result = { ...p }
            result[key] = value
            return result
        })
    }

    function BooleanValue(key: string) {
        return <div className="2xl:w-1/2" aria-label={t(`manage.settings.types.${key}`)}>
            <ToggleSwitch checked={tmpValues[key] === 'true'} onChange={v => setBooleanValue(key, v)}
                          label={t(`manage.settings.types.${key}`)}/>
            <p className="text-sm mt-1 secondary">{t(`manage.settings.descriptions.${key}`)}</p>
        </div>
    }

    function NumberValue(key: string, min: Decimal | undefined = undefined, max: Decimal | undefined = undefined) {
        function isNumber(v: string) {
            try {
                parseFloat(v)
            } catch {
                return false
            }
            return true
        }

        return <div className="2xl:w-1/2" aria-label={t(`manage.settings.types.${key}`)}>
            <p aria-hidden className="mb-1">{t(`manage.settings.types.${key}`)}</p>
            <TextInput value={tmpValues[key]} type="number" placeholder={t(`manage.settings.types.${key}`) + '...'}
                       onChange={e => {
                           setValue(key, e.currentTarget.value)
                           setHasErrors(p => p.filter(v => v !== key))
                           if (e.currentTarget.value === '' ||
                               !isNumber(e.currentTarget.value) || (min != null && Decimal(e.currentTarget.value).lt(min))
                               || (max != null && Decimal(e.currentTarget.value).gt(max))) {
                               setHasErrors(p => [ ...p, key ])
                           }
                       }}/>
            <If condition={tmpValues[key] !== ''}>
                <If condition={isNumber(tmpValues[key] === '' ? '0' : tmpValues[key])}>
                    <If condition={min != null && Decimal(tmpValues[key] === '' ? '0' : tmpValues[key]).lt(min)}>
                        <p className="text-red-500 mt-1 text-sm">{t('manage.settings.minValue', { min })}</p>
                    </If>
                    <If condition={max != null && Decimal(tmpValues[key] === '' ? '0' : tmpValues[key]).gt(max)}>
                        <p className="text-red-500 mt-1 text-sm">{t('manage.settings.maxValue', { max })}</p>
                    </If>
                </If>
                <If condition={!isNumber(tmpValues[key] === '' ? '0' : tmpValues[key])}>
                    <p className="text-red-500 mt-1 text-sm">{t('manage.settings.invalidNumber')}</p>
                </If>
            </If>
            <p className="text-sm mt-1 secondary">{t(`manage.settings.descriptions.${key}`)}</p>
        </div>
    }

    function StringValue(key: string) {
        return <div className="2xl:w-1/2" aria-label={t(`manage.settings.types.${key}`)}>
            <p aria-hidden className="mb-1">{t(`manage.settings.types.${key}`)}</p>
            <TextInput value={tmpValues[key]} type="text" placeholder={t(`manage.settings.types.${key}`) + '...'}
                       onChange={e => setValue(key, e.currentTarget.value)}/>
            <p className="text-sm mt-1 secondary">{t(`manage.settings.descriptions.${key}`)}</p>
        </div>
    }

    function hasChanges() {
        for (const key of Object.keys(values)) {
            if (values[key] !== tmpValues[key]) {
                return true
            }
        }
        return false
    }

    return <div className="container relative">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem>{t('manage.settings.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('manage.settings.title')}</h1>
        <div className="flex flex-col gap-3">
            {BooleanValue('enable-scheduled-availability')}
            <If condition={tmpValues['enable-scheduled-availability'] === 'true'}>
                {BooleanValue('weekdays-only')}
                {StringValue('open-time')}
                {StringValue('close-time')}
            </If>
            <If condition={tmpValues['enable-scheduled-availability'] !== 'true'}>
                {BooleanValue('store-open')}
            </If>
            <div></div>
            {NumberValue('maximum-cups-per-order', Decimal(1))}
            {NumberValue('maximum-cups-per-day', Decimal(1))}
            <div></div>
            {NumberValue('maximum-balance', Decimal(0))}
            {NumberValue('balance-recharge-minimum', Decimal(0))}
        </div>

        <If condition={hasChanges()}>
            <div style={{ opacity: hasChanges() ? '1' : '0' }}
                 aria-hidden
                 className="sticky transition-opacity duration-100 bottom-3
            lg:bottom-5 shadow-lg left-0 w-full m-3 lg:m-5 bg-yellow-50 gap-3
            dark:bg-yellow-800 rounded-full p-3 flex flex-col lg:flex-row
             items-center">
                <p className="lg:flex-grow text-sm">{hasErrors.length > 0 ? t('manage.settings.hasErrors') : t('manage.settings.unsaved')}</p>
                <div className="flex gap-3 lg:ml-auto">
                    <Button size="xs" color="gray" pill
                            onClick={() => setTmpValues({ ...values })}>{t('manage.settings.revert')}</Button>
                    <Button size="xs" color="warning" pill onClick={commit}
                            disabled={loading || hasErrors.length > 0}>{loading ? '...' : t('manage.settings.save')}</Button>
                </div>
            </div>
        </If>

        <div className="sr-only">
            <span aria-live="assertive">
                <If condition={hasChanges()}>
                    {t('manage.settings.unsaved')}
                    &nbsp;
                    {t('manage.settings.unsavedAccessibility')}
                </If>
            </span>
            <If condition={hasErrors.length > 0}>
                <p>{t('manage.settings.hasErrors')}</p>
            </If>
            <Button size="xs" color="gray" pill
                    onClick={() => {
                        setTmpValues({ ...values })
                        setHasErrors([])
                    }}>{t('manage.settings.revert')}</Button>
            <Button size="xs" color="warning" pill onClick={commit}
                    disabled={loading || hasErrors.length > 0}>{loading ? '...' : t('manage.settings.save')}</Button>
        </div>
    </div>
}
