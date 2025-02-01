'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Badge, Breadcrumb, BreadcrumbItem, Datepicker, Select, Spinner } from 'flowbite-react'
import { HiArrowDown, HiArrowUp, HiCollection } from 'react-icons/hi'
import { getStats, StatsAggregates } from '@/app/lib/stats-actions'
import { ReactNode, useEffect, useState } from 'react'
import If from '@/app/lib/If'
import Decimal from 'decimal.js'
import ReactApexChart from 'react-apexcharts'

function Block({ title, hideTitle, center, children }: {
    title: string,
    hideTitle: boolean,
    center: boolean,
    children: ReactNode
}) {
    return <div aria-label={title} className="rounded-3xl p-5 bg-gray-50 dark:bg-amber-900">
        <h3 aria-hidden style={{ display: hideTitle ? 'none' : 'block' }}
            className="text-sm secondary font-normal mb-2">{title}</h3>
        <div className={center ? 'flex flex-col justify-center items-center w-full' : 'w-full'}>
            {children}
        </div>
    </div>
}

Block.defaultProps = {
    hideTitle: false,
    center: false
}

function daysInMonths(year: number): number[] {
    if ((year & 3) == 0 && ((year % 25) != 0 || (year & 15) == 0)) {
        return [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]
    }
    return [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]
}

export default function ManageStatsClient({ stats }: { stats: StatsAggregates }) {
    const { t } = useTranslationClient('user')
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    const [ start, setStart ] = useState(current)
    const [ range, setRange ] = useState<'week' | 'month' | 'day'>('week')
    const [ data, setData ] = useState(stats)
    const [ loading, setLoading ] = useState(false)

    const [ days, setDays ] = useState<string[]>([])
    const [ actualStartDate, setActualStartDate ] = useState<Date>(new Date())
    const [ actualEndDate, setActualEndDate ] = useState<Date>(new Date())

    useEffect(() => {
        (async () => {
            setLoading(true)
            setData(await getStats(range, start))
            setLoading(false)
        })()

        const newDays = []
        for (let i = 0; i < {
            day: 1,
            week: 7,
            month: daysInMonths(start.getFullYear())[start.getMonth()]
        }[range]; i++) {
            newDays.push(new Date(start.getTime() + i * 86400000).toISOString())
        }
        setDays(newDays)

        const actualStart = new Date(start)
        actualStart.setHours(0, 0, 0, 0)
        if (range === 'week') {
            actualStart.setDate(actualStart.getDate() - actualStart.getDay() + 1)
        }
        if (range === 'month') {
            actualStart.setDate(1)
        }

        const end = new Date(start.getTime() + {
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: daysInMonths(start.getFullYear())[start.getMonth()] * 24 * 60 * 60 * 1000
        }[range])
        end.setHours(23, 59, 59, 999)
        setActualStartDate(actualStart)
        setActualEndDate(end)
    }, [ start, range ])

    return <div className="container" id="export-target">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem>{t('manage.stats.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-3">{t('manage.stats.title')}</h1>
        <div className="mb-5" aria-label={t('manage.stats.viewOptions')}>
            <p className="mb-3">{t('manage.stats.showing', {
                start: actualStartDate.toLocaleDateString(),
                end: actualEndDate.toLocaleDateString(),
                interpolation: { escapeValue: false }
            })}</p>

            <Datepicker aria-label={t('manage.stats.date')} value={start} onChange={e => {
                if (e != null) {
                    setStart(e)
                }
            }} className="lg:max-w-sm mb-3" weekStart={1} autoHide/>

            <Select aria-label={t('manage.stats.range')} value={range} className="lg:max-w-sm"
                    onChange={e => setRange(e.currentTarget.value as 'week' | 'month' | 'day')}>
                <option value="day">{t('manage.stats.day')}</option>
                <option value="week">{t('manage.stats.week')}</option>
                <option value="month">{t('manage.stats.month')}</option>
            </Select>
        </div>
        {loading ?
            <div className="w-full h-[60dvh] flex flex-col justify-center items-center">
                <Spinner color="warning"/>
            </div>
            : <>
                <div aria-label={t('manage.stats.basic')} className="mb-8 grid gap-3 grid-cols-1 lg:grid-cols-3">
                    <Block title={t('manage.stats.totalRevenue')}>
                        <p className="text-2xl mb-1">¥{data.totalRevenue}</p>
                        <If condition={data.lastTotalRevenue != null}>
                            <If condition={Decimal(data.lastTotalRevenue ?? 0).gt(data.totalRevenue)}>
                                <Badge color="failure" className="inline-flex" icon={HiArrowDown}>
                                    {Decimal(data.totalRevenue).minus(data.lastTotalRevenue ?? 0).div(data.lastTotalRevenue ?? 1).times(100).round().toString()}%
                                    <span className="sr-only">{t(`manage.stats.compared_${range}`)}</span>
                                </Badge>
                            </If>
                            <If condition={Decimal(data.lastTotalRevenue ?? 0).lt(data.totalRevenue)}>
                                <Badge color="success" className="inline-flex" icon={HiArrowUp}>
                                    +{Decimal(data.totalRevenue).minus(data.lastTotalRevenue ?? 0).div(data.lastTotalRevenue ?? 1).times(100).round().toString()}%
                                    <span className="sr-only">{t(`manage.stats.compared_${range}`)}</span>
                                </Badge>
                            </If>
                        </If>
                    </Block>
                    <Block title={t('manage.stats.totalOrders')}>
                        <p className="text-2xl mb-1">{data.totalOrders}</p>
                        <If condition={data.lastTotalOrders != null}>
                            <If condition={(data.lastTotalOrders ?? 0) > data.totalOrders}>
                                <Badge color="failure" className="inline-flex" icon={HiArrowDown}>
                                    {((data.totalOrders - (data.lastTotalOrders ?? 0)) / (data.lastTotalOrders ?? 1) * 100).toFixed(0)}%
                                    <span className="sr-only">{t(`manage.stats.compared_${range}`)}</span>
                                </Badge>
                            </If>
                            <If condition={(data.lastTotalOrders ?? 0) < data.totalOrders}>
                                <Badge color="success" className="inline-flex" icon={HiArrowUp}>
                                    +{((data.totalOrders - (data.lastTotalOrders ?? 0)) / (data.lastTotalOrders ?? 1) * 100).toFixed(0)}%
                                    <span className="sr-only">{t(`manage.stats.compared_${range}`)}</span>
                                </Badge>
                            </If>
                        </If>
                    </Block>
                    <Block title={t('manage.stats.totalCups')}>
                        <p className="text-2xl mb-1">{data.totalCups}</p>
                        <If condition={data.lastTotalCups != null}>
                            <If condition={(data.lastTotalCups ?? 0) > data.totalCups}>
                                <Badge color="failure" className="inline-flex" icon={HiArrowDown}>
                                    {((data.totalCups - (data.lastTotalCups ?? 0)) / (data.lastTotalCups ?? 1) * 100).toFixed(0)}%
                                    <span className="sr-only">{t(`manage.stats.compared_${range}`)}</span>
                                </Badge>
                            </If>
                            <If condition={(data.lastTotalCups ?? 0) < data.totalCups}>
                                <Badge color="success" className="inline-flex" icon={HiArrowUp}>
                                    +{((data.totalCups - (data.lastTotalCups ?? 0)) / (data.lastTotalCups ?? 1) * 100).toFixed(0)}%
                                    <span className="sr-only">{t(`manage.stats.compared_${range}`)}</span>
                                </Badge>
                            </If>
                        </If>
                    </Block>
                </div>

                <If condition={data.newItems.length > 0}>
                    <div aria-label={t('manage.stats.newItems')} className="mb-8">
                        <h2 aria-hidden className="mb-3">{t('manage.stats.newItems')}</h2>
                        {data.newItems.map(item => <div key={item.id} className="mb-5"
                                                        aria-label={data.mentionedItems[item.id]}>
                            <h3 aria-hidden className="mb-1">{data.mentionedItems[item.id]}</h3>
                            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                                <Block title={t('manage.stats.totalRevenue')}>
                                    <p className="text-2xl">¥{item.revenue}</p>
                                </Block>
                                <Block title={t('manage.stats.totalCups')}>
                                    <p className="text-2xl">{item.cups}</p>
                                </Block>
                                <Block title={t('manage.stats.revenueByGender')} center aria-hidden>
                                    <ReactApexChart width={380} type="pie" options={{
                                        labels: [ t('manage.stats.male'), t('manage.stats.female'), t('manage.stats.others'), t('manage.stats.anonymous') ]
                                    }} series={[
                                        parseFloat(item.revenueGenderDistribution['male']),
                                        parseFloat(item.revenueGenderDistribution['female']),
                                        parseFloat(item.revenueGenderDistribution['others']),
                                        parseFloat(item.revenueGenderDistribution['anonymous']) ]}/>
                                </Block>
                                <Block title={t('manage.stats.cupsByGender')} center aria-hidden>
                                    <ReactApexChart width={380} type="pie" options={{
                                        labels: [ t('manage.stats.male'), t('manage.stats.female'), t('manage.stats.others'), t('manage.stats.anonymous') ]
                                    }} series={[
                                        item.cupsGenderDistribution['male'],
                                        item.cupsGenderDistribution['female'],
                                        item.cupsGenderDistribution['others'],
                                        item.cupsGenderDistribution['anonymous'] ]}/>
                                </Block>
                            </div>
                        </div>)}
                    </div>
                </If>

                <div aria-label={t('manage.stats.perDay')} className="mb-8">
                    <h2 aria-hidden className="mb-3">{t('manage.stats.perDay')}</h2>
                    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                        <Block title={t('manage.stats.ordersCupsPerDay')} center aria-hidden>
                            <ReactApexChart width={500} type="area" options={{
                                dataLabels: {
                                    enabled: false
                                },
                                stroke: {
                                    curve: 'smooth'
                                },
                                xaxis: {
                                    type: 'datetime',
                                    categories: days
                                },
                                tooltip: {
                                    x: {
                                        format: 'dd/MM/yy'
                                    }
                                }
                            }} series={[
                                {
                                    name: t('manage.stats.orders'),
                                    data: data.ordersPerUnit
                                },
                                {
                                    name: t('manage.stats.cups'),
                                    data: data.cupsPerUnit
                                }
                            ]}/>
                        </Block>

                        <Block title={t('manage.stats.revenuePerDay')} center aria-hidden>
                            <ReactApexChart width={500} type="area" options={{
                                dataLabels: {
                                    enabled: false
                                },
                                stroke: {
                                    curve: 'smooth'
                                },
                                xaxis: {
                                    type: 'datetime',
                                    categories: days
                                },
                                tooltip: {
                                    x: {
                                        format: 'dd/MM/yy'
                                    }
                                }
                            }} series={[
                                {
                                    name: t('manage.stats.revenue'),
                                    data: data.revenuePerUnit.map(u => parseFloat(u))
                                }
                            ]}/>
                        </Block>
                    </div>
                </div>

                <div aria-label={t('manage.stats.perOrder')} className="mb-8">
                    <h2 aria-hidden className="mb-3">{t('manage.stats.perOrder')}</h2>
                    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                        <Block title={t('manage.stats.averageRevenue')}>
                            <p className="text-2xl">¥{data.averageOrderValue}</p>
                        </Block>
                        <Block title={t('manage.stats.averageCups')}>
                            <p className="text-2xl">{data.averageOrderCups.toFixed(2)}</p>
                        </Block>
                        <Block title={t('manage.stats.averageRevenuePerDay')} center aria-hidden>
                            <ReactApexChart options={{
                                plotOptions: {
                                    bar: {
                                        horizontal: false,
                                        isDumbbell: true,
                                        dumbbellColors: [ [ '#fde047', '#f97316' ] ]
                                    }
                                },
                                colors: [ '#fde047', '#f97316' ],
                                fill: {
                                    type: 'gradient',
                                    gradient: {
                                        gradientToColors: [ '#f97316' ],
                                        inverseColors: false,
                                        stops: [ 0, 100 ]
                                    }
                                },
                                grid: {
                                    xaxis: {
                                        lines: {
                                            show: false
                                        }
                                    },
                                    yaxis: {
                                        lines: {
                                            show: true
                                        }
                                    }
                                },
                                annotations: {
                                    points: Array.from({ length: days.length }).map((_, i) => ({
                                        x: days[i].slice(0, 10),
                                        y: parseFloat(data.averageOrderValuePerUnit[i]),
                                        marker: {
                                            strokeColor: '#fbbf24'
                                        },
                                        label: {
                                            text: `¥${data.averageOrderValuePerUnit[i]}`
                                        }
                                    }))
                                }
                            }} series={[ {
                                data: Array.from({ length: days.length }).map((_, i) => ({
                                    x: days[i].slice(0, 10),
                                    y: [ parseFloat(data.minOrderValuePerUnit[i]), parseFloat(data.maxOrderValuePerUnit[i]) ]
                                }))
                            } ]} type="rangeBar" width={500}/>
                        </Block>
                        <Block title={t('manage.stats.averageCupsPerDay')} center aria-hidden>
                            <ReactApexChart options={{
                                plotOptions: {
                                    bar: {
                                        horizontal: false,
                                        isDumbbell: true,
                                        dumbbellColors: [ [ '#fde047', '#f97316' ] ]
                                    }
                                },
                                colors: [ '#fde047', '#f97316' ],
                                fill: {
                                    type: 'gradient',
                                    gradient: {
                                        gradientToColors: [ '#f97316' ],
                                        inverseColors: false,
                                        stops: [ 0, 100 ]
                                    }
                                },
                                grid: {
                                    xaxis: {
                                        lines: {
                                            show: false
                                        }
                                    },
                                    yaxis: {
                                        lines: {
                                            show: true
                                        }
                                    }
                                },
                                annotations: {
                                    points: Array.from({ length: days.length }).map((_, i) => ({
                                        x: days[i].slice(0, 10),
                                        y: data.averageOrderCupsPerUnit[i],
                                        marker: {
                                            strokeColor: '#fbbf24'
                                        },
                                        label: {
                                            text: data.averageOrderCupsPerUnit[i].toString()
                                        }
                                    }))
                                }
                            }} series={[ {
                                data: Array.from({ length: days.length }).map((_, i) => ({
                                    x: days[i].slice(0, 10),
                                    y: [ data.minOrderCupsPerUnit[i], data.maxOrderCupsPerUnit[i] ]
                                }))
                            } ]} type="rangeBar" width={500}/>
                        </Block>
                    </div>
                </div>

                <div aria-label={t('manage.stats.byItems')} className="mb-8">
                    <h2 aria-hidden className="mb-3">{t('manage.stats.byItems')}</h2>
                    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                        <Block title={t('manage.stats.revenueByCategories')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: Object.entries(data.categoryRevenueDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ k ]) => data.mentionedCategories[parseInt(k)])
                            }} series={
                                Object.entries(data.categoryRevenueDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ , v ]) => parseFloat(v))
                            }/>
                        </Block>
                        <Block title={t('manage.stats.cupsByCategories')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: Object.entries(data.categoryCupsDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ k ]) => data.mentionedCategories[parseInt(k)])
                            }} series={
                                Object.entries(data.categoryCupsDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ , v ]) => v)
                            }/>
                        </Block>
                        <Block title={t('manage.stats.revenueByItems')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: Object.entries(data.itemRevenueDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ k ]) => data.mentionedItems[parseInt(k)])
                            }} series={
                                Object.entries(data.itemRevenueDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ , v ]) => parseFloat(v))
                            }/>
                        </Block>
                        <Block title={t('manage.stats.cupsByItems')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: Object.entries(data.itemCupsDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ k ]) => data.mentionedItems[parseInt(k)])
                            }} series={
                                Object.entries(data.itemCupsDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ , v ]) => v)
                            }/>
                        </Block>
                    </div>
                </div>

                <div aria-label={t('manage.stats.byUsers')} className="mb-8">
                    <h2 aria-hidden className="mb-3">{t('manage.stats.byUsers')}</h2>
                    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                        <Block title={t('manage.stats.revenueByUsers')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: Object.entries(data.userRevenueDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ k ]) => k === '-1' ? t('manage.stats.anonymous') : data.mentionedUsers[parseInt(k)])
                            }} series={
                                Object.entries(data.userRevenueDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ , v ]) => parseFloat(v))
                            }/>
                        </Block>
                        <Block title={t('manage.stats.cupsByUsers')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: Object.entries(data.userCupsDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ k ]) => k === '-1' ? t('manage.stats.anonymous') : data.mentionedUsers[parseInt(k)])
                            }} series={
                                Object.entries(data.userCupsDistribution)
                                    .toSorted((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                    .map(([ , v ]) => v)
                            }/>
                        </Block>
                        <Block title={t('manage.stats.revenueByGender')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: [ t('manage.stats.male'), t('manage.stats.female'), t('manage.stats.others'), t('manage.stats.anonymous') ]
                            }} series={[
                                parseFloat(data.genderRevenueDistribution['male']),
                                parseFloat(data.genderRevenueDistribution['female']),
                                parseFloat(data.genderRevenueDistribution['others']),
                                parseFloat(data.genderRevenueDistribution['anonymous']) ]}/>
                        </Block>
                        <Block title={t('manage.stats.cupsByGender')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: [ t('manage.stats.male'), t('manage.stats.female'), t('manage.stats.others'), t('manage.stats.anonymous') ]
                            }} series={[
                                data.genderCupsDistribution['male'],
                                data.genderCupsDistribution['female'],
                                data.genderCupsDistribution['others'],
                                data.genderCupsDistribution['anonymous'] ]}/>
                        </Block>
                    </div>
                </div>

                <div aria-label={t('manage.stats.byPayment')}>
                    <h2 aria-hidden className="mb-3">{t('manage.stats.byPayment')}</h2>
                    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                        <Block title={t('manage.stats.paymentMethod')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: [ t('manage.stats.wxPay'), t('manage.stats.balance'), t('manage.stats.cash'), t('manage.stats.payLater'), t('manage.stats.payForMe') ]
                            }} series={[
                                data.paymentMethodDistribution.wxPay ?? 0,
                                data.paymentMethodDistribution.balance ?? 0,
                                data.paymentMethodDistribution.cash ?? 0,
                                data.paymentMethodDistribution.payLater ?? 0,
                                data.paymentMethodDistribution.payForMe ?? 0
                            ]}/>
                        </Block>
                        <Block title={t('manage.stats.paymentStatus')} center aria-hidden>
                            <ReactApexChart width={380} type="pie" options={{
                                labels: [ t('manage.stats.paid'), t('manage.stats.notPaid'), t('manage.stats.refunded') ]
                            }} series={[
                                data.paymentStatusDistribution.paid ?? 0,
                                data.paymentStatusDistribution.notPaid ?? 0,
                                data.paymentStatusDistribution.refunded ?? 0
                            ]}/>
                        </Block>
                    </div>
                </div>
            </>}
    </div>
}
