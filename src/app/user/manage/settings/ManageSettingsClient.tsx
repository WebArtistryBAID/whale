'use client'

import { useState } from 'react'
import { getConfigValues, setConfigValue } from '@/app/lib/settings-actions'
import Decimal from 'decimal.js'
import { Breadcrumb, BreadcrumbItem, Button, TextInput, ToggleSwitch } from 'flowbite-react'
import { HiBeaker, HiCash, HiClock, HiCollection } from 'react-icons/hi'
import Panel from '@/app/user/components/Panel'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { formatDateKey, formatLegacyDateKey } from '@/app/lib/ordering-schedule'

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
        try {
            for (const key in tmpValues) {
                if (values[key] !== tmpValues[key]) {
                    await setConfigValue(key, tmpValues[key])
                }
            }
        } finally {
            const newV = await getConfigValues()
            setValues(newV)
            setTmpValues(newV)
            setHasErrors([])
            setLoading(false)
        }
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

    function isNumericValue(value: string) {
        return value.trim() !== '' && !Number.isNaN(Number(value))
    }

    function isTimeValue(value: string) {
        return /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim())
    }

    function BooleanValue(key: string) {
        return <div aria-label={t(`manage.settings.types.${key}`)}>
            <ToggleSwitch checked={tmpValues[key] === 'true'} onChange={v => setBooleanValue(key, v)}
                          label={t(`manage.settings.types.${key}`)} color="yellow"/>
            <p className="text-sm mt-1 secondary">{t(`manage.settings.descriptions.${key}`)}</p>
        </div>
    }

    function NumberValue(key: string, min: Decimal | undefined = undefined, max: Decimal | undefined = undefined) {
        return <div aria-label={t(`manage.settings.types.${key}`)}>
            <p className="mb-1.5 font-toon">{t(`manage.settings.types.${key}`)}</p>
            <TextInput value={tmpValues[key]} type="number" placeholder={t(`manage.settings.types.${key}`) + '...'}
                       onChange={e => {
                           setValue(key, e.currentTarget.value)
                           setHasErrors(p => p.filter(v => v !== key))
                           if (e.currentTarget.value === '' ||
                               !isNumericValue(e.currentTarget.value) || (min != null && Decimal(e.currentTarget.value).lt(min))
                               || (max != null && Decimal(e.currentTarget.value).gt(max))) {
                               setHasErrors(p => [ ...p, key ])
                           }
                       }}/>
            <If condition={tmpValues[key] !== ''}>
                <If condition={isNumericValue(tmpValues[key] === '' ? '0' : tmpValues[key])}>
                    <If condition={min != null && Decimal(tmpValues[key] === '' ? '0' : tmpValues[key]).lt(min)}>
                        <p className="text-tomato mt-1 text-sm">{t('manage.settings.minValue', { min })}</p>
                    </If>
                    <If condition={max != null && Decimal(tmpValues[key] === '' ? '0' : tmpValues[key]).gt(max)}>
                        <p className="text-tomato mt-1 text-sm">{t('manage.settings.maxValue', { max })}</p>
                    </If>
                </If>
                <If condition={!isNumericValue(tmpValues[key] === '' ? '0' : tmpValues[key])}>
                    <p className="text-tomato mt-1 text-sm">{t('manage.settings.invalidNumber')}</p>
                </If>
            </If>
            <p className="text-sm mt-1 secondary">{t(`manage.settings.descriptions.${key}`)}</p>
        </div>
    }

    function TimeValue(key: string) {
        return <div aria-label={t(`manage.settings.types.${key}`)}>
            <p className="mb-1.5 font-toon">{t(`manage.settings.types.${key}`)}</p>
            <TextInput value={tmpValues[key]} type="text" placeholder={t(`manage.settings.types.${key}`) + '...'}
                       onChange={e => {
                           setValue(key, e.currentTarget.value)
                           setHasErrors(p => p.filter(v => v !== key))
                           if (!isTimeValue(e.currentTarget.value)) {
                               setHasErrors(p => [ ...p, key ])
                           }
                       }}/>
            <If condition={!isTimeValue(tmpValues[key] ?? '')}>
                <p className="text-tomato mt-1 text-sm">{t('manage.settings.invalidTime')}</p>
            </If>
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

    const date = new Date()

    return <div className="container relative pb-28">
        <header className="mb-6">
            <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-2">
                <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
                <BreadcrumbItem>{t('manage.settings.title')}</BreadcrumbItem>
            </Breadcrumb>
            <h1>{t('manage.settings.title')}</h1>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <Panel title={t('manage.settings.groups.hours')} icon={HiClock}>
                <div className="flex flex-col gap-5">
                    <div aria-label={t(`manage.settings.types.override`)}
                         className="rounded-2xl border-2 border-dashed border-ink/30 bg-butter/20 p-3">
                        <ToggleSwitch
                            checked={[ formatDateKey(date), formatLegacyDateKey(date) ].includes(tmpValues['availability-override-date'])}
                            onChange={v => {
                                if (!v) {
                                    setValue('availability-override-date', '0000-00-00')
                                }
                            }}
                            label={t(`manage.settings.types.override`)} color="yellow"/>
                        <p className="text-sm mt-1 secondary">{t(`manage.settings.descriptions.override`)}</p>
                    </div>

                    {BooleanValue('enable-scheduled-availability')}
                    <If condition={tmpValues['enable-scheduled-availability'] === 'true'}>
                        {BooleanValue('weekdays-only')}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {TimeValue('open-time')}
                            {TimeValue('close-time')}
                            {TimeValue('pre-order-start-time')}
                        </div>
                    </If>
                    <If condition={tmpValues['enable-scheduled-availability'] !== 'true'}>
                        {BooleanValue('store-open')}
                    </If>
                </div>
            </Panel>

            <div className="flex flex-col gap-6">
                <Panel title={t('manage.settings.groups.limits')} icon={HiBeaker}>
                    <div className="flex flex-col gap-5">
                        {NumberValue('maximum-cups-per-order', Decimal(1))}
                        {NumberValue('maximum-cups-per-day', Decimal(0))}
                        {NumberValue('maximum-pre-order-cups-per-day', Decimal(0))}
                    </div>
                </Panel>

                <Panel title={t('manage.settings.groups.payment')} icon={HiCash}>
                    <div className="flex flex-col gap-5">
                        {NumberValue('maximum-balance', Decimal(0))}
                        {NumberValue('balance-recharge-minimum', Decimal(0))}
                        {BooleanValue('allow-pay-later')}
                        {BooleanValue('allow-delivery')}
                    </div>
                </Panel>
            </div>
        </div>

        <If condition={hasChanges()}>
            <div aria-hidden className="fixed bottom-4 left-4 right-4 lg:left-80 lg:right-8 z-30 toon pop-in bg-butter/90
            p-3 pl-5 flex flex-col sm:flex-row items-center gap-3">
                <p className="sm:flex-grow font-toon">{hasErrors.length > 0 ? t('manage.settings.hasErrors') : t('manage.settings.unsaved')}</p>
                <div className="flex gap-3">
                    <button className="toon-btn-ghost h-10 text-base px-5"
                            onClick={() => setTmpValues({ ...values })}>{t('manage.settings.revert')}</button>
                    <button className="toon-btn h-10 text-base px-5 bg-paper disabled:opacity-50 disabled:pointer-events-none" onClick={commit}
                            disabled={loading || hasErrors.length > 0}>{loading ? '...' : t('manage.settings.save')}</button>
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
