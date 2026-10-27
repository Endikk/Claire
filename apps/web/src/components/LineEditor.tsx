import { useId } from 'react'
import type { DraftLine } from '../state/analyse'
import { useAnalyse } from '../state/context'

const MAX_FIELD_LENGTH = 200

type Props = { line: DraftLine }

export function LineEditor({ line }: Props) {
  const updateLine = useAnalyse((state) => state.updateLine)
  const removeLine = useAnalyse((state) => state.removeLine)
  const id = useId()
  const isRecognized = line.productId !== null

  return (
    <li className={isRecognized ? 'line' : 'line is-unrecognized'}>
      <div className="line-head">
        <p className="line-label">{line.label}</p>
        <button
          type="button"
          className="button-quiet"
          aria-label={`Retirer ${line.label}`}
          onClick={() => removeLine(line.id)}
        >
          Retirer
        </button>
      </div>
      {!isRecognized && <p className="line-warning">Non reconnu dans les données</p>}
      <div className="line-fields">
        <label htmlFor={`${id}-posologie`}>Posologie</label>
        <input
          id={`${id}-posologie`}
          value={line.posologie}
          maxLength={MAX_FIELD_LENGTH}
          autoComplete="off"
          onChange={(event) => updateLine(line.id, { posologie: event.target.value })}
        />
        <label htmlFor={`${id}-duree`}>Durée</label>
        <input
          id={`${id}-duree`}
          value={line.duree}
          maxLength={MAX_FIELD_LENGTH}
          autoComplete="off"
          onChange={(event) => updateLine(line.id, { duree: event.target.value })}
        />
      </div>
    </li>
  )
}
