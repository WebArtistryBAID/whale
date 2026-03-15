'use client'

import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react'
import Link from 'next/link'
import { type DragEvent, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

type ReorderPosition = 'before' | 'after'

interface ReorderableRecord {
    id: number
    name: string
}

function getDropPosition(row: HTMLTableRowElement, clientY: number): ReorderPosition {
    const bounds = row.getBoundingClientRect()
    return clientY - bounds.top < bounds.height / 2 ? 'before' : 'after'
}

function reorderRecords<T extends ReorderableRecord>(
    records: T[],
    sourceId: number,
    targetId: number,
    position: ReorderPosition
) {
    const sourceIndex = records.findIndex(record => record.id === sourceId)
    const targetIndex = records.findIndex(record => record.id === targetId)

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return records
    }

    const next = [ ...records ]
    const [ moved ] = next.splice(sourceIndex, 1)
    let insertIndex = targetIndex

    if (sourceIndex < targetIndex) {
        insertIndex -= 1
    }
    if (position === 'after') {
        insertIndex += 1
    }

    next.splice(insertIndex, 0, moved)
    return next
}

function DragHandle({ disabled, label, onDragEnd, onDragStart }: {
    disabled: boolean
    label: string
    onDragEnd: () => void
    onDragStart: (event: DragEvent<HTMLButtonElement>) => void
}) {
    return <button
        type="button"
        aria-label={label}
        title={label}
        draggable={!disabled}
        disabled={disabled}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        className="inline-flex cursor-grab items-center justify-center rounded-full p-2 text-amber-700 transition-opacity hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-900"
    >
        <span className="grid grid-cols-2 gap-1" aria-hidden>
            {Array.from({ length: 6 }, (_, index) => <span key={index} className="h-1 w-1 rounded-full bg-current"/>)}
        </span>
    </button>
}

export default function ReorderableTable<T extends ReorderableRecord>({
                                                                          actionsLabel,
                                                                          handleLabel,
                                                                          idLabel,
                                                                          items: initialItems,
                                                                          nameLabel,
                                                                          onReorder,
                                                                          saveErrorMessage,
                                                                          viewLabel,
                                                                          viewPath
                                                                      }: {
    actionsLabel: string
    handleLabel: string
    idLabel: string
    items: T[]
    nameLabel: string
    onReorder: (items: T[]) => Promise<void>
    saveErrorMessage: string
    viewLabel: string
    viewPath: (item: T) => string
}) {
    const [ items, setItems ] = useState(initialItems)
    const [ draggingId, setDraggingId ] = useState<number | null>(null)
    const [ dropTarget, setDropTarget ] = useState<{ id: number, position: ReorderPosition } | null>(null)
    const [ saving, setSaving ] = useState(false)

    useEffect(() => {
        setItems(initialItems)
    }, [ initialItems ])

    return <Table className="mb-5">
        <TableHead>
            <TableHeadCell><span className="sr-only">{handleLabel}</span></TableHeadCell>
            <TableHeadCell>{idLabel}</TableHeadCell>
            <TableHeadCell>{nameLabel}</TableHeadCell>
            <TableHeadCell><span className="sr-only">{actionsLabel}</span></TableHeadCell>
        </TableHead>
        <TableBody className="divide-y mb-3">
            {items.map(item => {
                const isDragging = draggingId === item.id
                const isDropBefore = dropTarget?.id === item.id && dropTarget.position === 'before'
                const isDropAfter = dropTarget?.id === item.id && dropTarget.position === 'after'

                return <TableRow
                    className={`tr ${isDragging ? 'opacity-50' : ''} ${isDropBefore ? 'border-t-4 border-amber-400' : ''} ${isDropAfter ? 'border-b-4 border-amber-400' : ''}`}
                    key={item.id}
                    onDragOver={event => {
                        if (saving || draggingId == null || draggingId === item.id) {
                            return
                        }
                        event.preventDefault()
                        setDropTarget({
                            id: item.id,
                            position: getDropPosition(event.currentTarget, event.clientY)
                        })
                    }}
                    onDrop={async event => {
                        if (saving || draggingId == null || draggingId === item.id) {
                            return
                        }
                        event.preventDefault()

                        const position = getDropPosition(event.currentTarget, event.clientY)
                        const previousItems = items
                        const nextItems = reorderRecords(items, draggingId, item.id, position)

                        setDraggingId(null)
                        setDropTarget(null)

                        if (nextItems === previousItems) {
                            return
                        }

                        setItems(nextItems)
                        setSaving(true)

                        try {
                            await onReorder(nextItems)
                        } catch {
                            setItems(previousItems)
                            toast.error(saveErrorMessage)
                        } finally {
                            setSaving(false)
                        }
                    }}
                >
                    <TableCell className="w-12">
                        <DragHandle
                            disabled={saving}
                            label={handleLabel}
                            onDragEnd={() => {
                                setDraggingId(null)
                                setDropTarget(null)
                            }}
                            onDragStart={event => {
                                setDraggingId(item.id)
                                event.dataTransfer.effectAllowed = 'move'
                                event.dataTransfer.setData('text/plain', item.id.toString())
                            }}
                        />
                    </TableCell>
                    <TableCell className="th">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                        <Link href={viewPath(item)}>
                            <Button size="xs" pill color="warning" className="inline-block" disabled={saving}>
                                {viewLabel}
                            </Button>
                        </Link>
                    </TableCell>
                </TableRow>
            })}
        </TableBody>
    </Table>
}
