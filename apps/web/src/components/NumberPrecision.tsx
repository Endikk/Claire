import { useId, useState } from 'react'
import { parseBoundedNumber } from '../lib/nombre'

type Props = {
  label: string
  unit: string
  min: number
  max: number
  value: number | undefined
  onChange: (value: number | undefined) => void
}

export function NumberPrecision({ label, unit, min, max, value, onChange }: Props) {
  const id = useId()
  const [text, setText] = useState(value === undefined ? '' : String(value).replace('.', ','))
  const isInvalid = text.trim() !== '' && parseBoundedNumber(text, min, max) === undefined

  function handleChange(next: string) {
    setText(next)
    onChange(parseBoundedNumber(next, min, max))
  }

  return (
    <div className="precision">
      <label htmlFor={id}>
        {label} <span className="unit">({unit})</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${id}-error` : undefined}
        onChange={(event) => handleChange(event.target.value)}
      />
      {isInvalid && (
        <p id={`${id}-error`} className="field-error">
          Saisissez une valeur entre {min} et {max} {unit}.
        </p>
      )}
    </div>
  )
}
