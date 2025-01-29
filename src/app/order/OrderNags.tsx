'use client'

import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from 'flowbite-react'
import {useEffect, useState} from 'react'
import {useCookies} from 'react-cookie'
import {useTranslationClient} from '@/app/i18n/client'
import Link from 'next/link'
import Image from 'next/image'

export default function OrderNags() {
    const {t} = useTranslationClient('order')

    const [loginModal, setLoginModal] = useState(false)
    const [updateModal, setUpdateModal] = useState(false)
    const [cookies] = useCookies()

    useEffect(() => {
        if (localStorage.getItem('update-nag') !== '1') {
            setUpdateModal(true)
            localStorage.setItem('update-nag', '1') // With a new update modal, we change this value.
        }

        if (!cookies.access_token) {
            // Sorry, we nag users every 16 hours
            const lastShown = localStorage.getItem('login-nag')
            localStorage.setItem('login-nag', new Date().toISOString())
            if (lastShown == null) {
                setLoginModal(true)
            } else if (new Date().getTime() - new Date(lastShown).getTime() > 16 * 60 * 60 * 1000) {
                setLoginModal(true)
            }
        }
    }, [cookies.access_token])

    return <>
        <Modal show={loginModal && !updateModal} onClose={() => setLoginModal(false)}>
            <ModalHeader>{t('loginCta.title')}</ModalHeader>
            <ModalBody>
                <p className="mb-5">{t('loginCta.message')}</p>
                <div className="w-full flex justify-center">
                    <Image src="/assets/illustrations/login-nag.svg" alt="" width={943} height={796} className="w-72"/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning" as={Link} href="/user">{t('login')}</Button>
                <Button pill color="gray" onClick={() => setLoginModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <Modal show={updateModal} onClose={() => setUpdateModal(false)}>
            <ModalHeader>{t('updateCta.title')}</ModalHeader>
            <ModalBody>
                <ul className="list-disc list-inside">
                    <li>{t('updateCta.point1')}</li>
                    <li>{t('updateCta.point2')}</li>
                    <li>{t('updateCta.point3')}</li>
                    <li>{t('updateCta.point4')}</li>
                </ul>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning" onClick={() => setUpdateModal(false)}>{t('confirm')}</Button>
            </ModalFooter>
        </Modal>
    </>
}
