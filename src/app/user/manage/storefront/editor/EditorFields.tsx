'use client'

import { Checkbox, Label, Textarea, TextInput } from 'flowbite-react'

interface TextFieldProps {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    error?: string | null
    multiline?: boolean
    disabled?: boolean
    type?: 'text' | 'number'
    min?: number
}

export function EditorTextField({ id, label, value, onChange, error, multiline, ...rest }: TextFieldProps) {
    const shared = {
        id, required: true, placeholder: `${label}...`, value,
        color: error ? 'failure' : undefined, helperText: error ?? null,
        'aria-invalid': !!error,
        onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value)
    }
    return <div className="w-full">
        <div className="mb-2"><Label htmlFor={id} value={label}/></div>
        {multiline
            ? <Textarea {...shared} disabled={rest.disabled}/>
            : <TextInput {...shared} {...rest}/>}
    </div>
}

export function EditorChoices({ id, label, choices, selected, onChange, disabled }: {
    id: string
    label: string
    choices: { id: number, name: string }[]
    selected: number[]
    onChange: (ids: number[]) => void
    disabled?: boolean
}) {
    return <div className="w-full" role="group" aria-label={label}>
        <div className="mb-2"><Label value={label}/></div>
        <div className="flex flex-col gap-1">
            {choices.map(choice => <div key={choice.id} className="flex items-center gap-2">
                <Checkbox id={`${id}-${choice.id}`} color="warning" disabled={disabled}
                          checked={selected.includes(choice.id)} onChange={event => onChange(event.currentTarget.checked
                    ? [...selected, choice.id] : selected.filter(value => value !== choice.id))}/>
                <Label htmlFor={`${id}-${choice.id}`} value={choice.name}/>
            </div>)}
        </div>
    </div>
}
