'use client'

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import { getUnpaidPayLaterOrder, isMaximumCupsReached, isStoreOpen } from '@/app/lib/ordering-actions'
import { getConfigValue, getConfigValueAsBoolean } from '@/app/lib/settings-actions'
import If from '@/app/lib/If'

export default function OrderNags() {
    const { t } = useTranslationClient('order')

    const [ loginModal, setLoginModal ] = useState(false)
    const [ cookies ] = useCookies()

    const [ storeClosedModal, setStoreClosedModal ] = useState(false)
    const [ atCapacityModal, setAtCapacityModal ] = useState(false)
    const [ payLaterModal, setPayLaterModal ] = useState(false)
    const [ payLaterOrder, setPayLaterOrder ] = useState(-1)
    const [ isSchedule, setIsSchedule ] = useState(false)
    const [ weekdaysOnly, setWeekdaysOnly ] = useState(false)
    const [ openTime, setOpenTime ] = useState('')

    useEffect(() => {
        (async () => {
            const open = await isStoreOpen()
            setStoreClosedModal(!open)
            setAtCapacityModal(await isMaximumCupsReached())
            setIsSchedule(await getConfigValueAsBoolean('enable-scheduled-availability'))
            setWeekdaysOnly(await getConfigValueAsBoolean('weekdays-only'))
            setOpenTime(await getConfigValue('open-time'))

            const payLater = await getUnpaidPayLaterOrder()
            if (payLater !== -1) {
                setPayLaterOrder(payLater)
                setPayLaterModal(true)
            }
        })()
    }, [])

    useEffect(() => {
        if (!cookies.access_token) {
            // Nag users every 16 hours.
            const lastShown = localStorage.getItem('login-nag')
            localStorage.setItem('login-nag', new Date().toISOString())
            if (lastShown == null) {
                setLoginModal(true)
            } else if (new Date().getTime() - new Date(lastShown).getTime() > 16 * 60 * 60 * 1000) {
                setLoginModal(true)
            }
        }
    }, [ cookies.access_token ])

    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6

    return (
        <>
            {loginModal ? (
                <Modal show={loginModal} onClose={() => setLoginModal(false)}>
                    <ModalHeader>{t('loginCta.title')}</ModalHeader>
                    <ModalBody>
                        <p className="mb-5">{t('loginCta.message')}</p>
                        <div className="w-full flex flex-col justify-center items-center">
                            <img
                                width={400}
                                height={260}
                                src="/assets/illustrations/reading-light.png"
                                className="dark:hidden w-72 mb-3"
                                alt=""
                            />
                            <img
                                width={400}
                                height={260}
                                src="/assets/illustrations/reading-dark.png"
                                className="hidden dark:block w-72 mb-3"
                                alt=""
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button pill color="warning" as={Link} href="/login?redirect=%2Forder">
                            {t('login')}
                        </Button>
                        <Button pill color="gray" onClick={() => setLoginModal(false)}>
                            {t('cancel')}
                        </Button>
                    </ModalFooter>
                </Modal>
            ) : storeClosedModal ? (
                <Modal show={storeClosedModal} onClose={() => setStoreClosedModal(false)}>
                    <ModalHeader>{t('storeClosedModal.title')}</ModalHeader>
                    <ModalBody>
                        <If condition={isSchedule}>
                            <If condition={weekdaysOnly && isWeekend}>
                                <p>{t('storeClosedModal.messageScheduledB', { time: openTime })}</p>
                            </If>
                            <If condition={!weekdaysOnly || !isWeekend}>
                                <p>{t('storeClosedModal.messageScheduledA', { time: openTime })}</p>
                            </If>
                        </If>
                        <If condition={!isSchedule}>
                            <p>{t('storeClosedModal.message')}</p>
                        </If>
                    </ModalBody>
                    <ModalFooter>
                        <Button pill color="warning" onClick={() => setStoreClosedModal(false)}>
                            {t('confirm')}
                        </Button>
                    </ModalFooter>
                </Modal>
            ) : payLaterModal ? (
                <Modal show={payLaterModal} onClose={() => setPayLaterModal(false)}>
                    <ModalHeader>{t('payLaterModal.title')}</ModalHeader>
                    <ModalBody>
                        <p>{t('payLaterModal.message')}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            pill
                            color="warning"
                            onClick={() => {
                                setPayLaterModal(false)
                                location.href = `/order/details/${payLaterOrder}`
                            }}
                        >
                            {t('payLaterModal.cta')}
                        </Button>
                    </ModalFooter>
                </Modal>
            ) : atCapacityModal ? (
                <Modal show={atCapacityModal} onClose={() => setAtCapacityModal(false)}>
                    <ModalHeader>{t('maximumCupsModal.title')}</ModalHeader>
                    <ModalBody>
                        <p>{t('maximumCupsModal.message')}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button pill color="warning" onClick={() => setAtCapacityModal(false)}>
                            {t('confirm')}
                        </Button>
                    </ModalFooter>
                </Modal>
            ) : (
                <></>
            )}
        </>
    )
}