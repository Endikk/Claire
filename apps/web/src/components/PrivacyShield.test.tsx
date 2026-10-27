import { buildDataset, createBdpmSource } from '@claire/bdpm'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createAnalyseStore } from '../state/analyse'
import { DependenciesProvider } from '../state/context'
import { BACKGROUND_RESET_MS, PrivacyShield } from './PrivacyShield'

const source = createBdpmSource(
  buildDataset([], [], { updatedAt: '2026-09-29', generatedAt: '2026-10-27T10:00:00.000Z' }),
)

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

function renderShield() {
  const store = createAnalyseStore()
  store.getState().start()
  store.getState().addLine('1', 'DOLIPRANE')
  render(
    <DependenciesProvider source={source} store={store}>
      <PrivacyShield>
        <p>Ordonnance en cours</p>
      </PrivacyShield>
    </DependenciesProvider>,
  )
  return store
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  setVisibility('visible')
})

describe('PrivacyShield', () => {
  test('masque le contenu quand l’application passe en arrière-plan', () => {
    renderShield()

    setVisibility('hidden')

    expect(screen.queryByText('Ordonnance en cours')?.closest('[aria-hidden="true"]')).toBeTruthy()
  })

  test('garde l’analyse après une courte absence', () => {
    const store = renderShield()

    setVisibility('hidden')
    vi.advanceTimersByTime(BACKGROUND_RESET_MS - 1000)
    setVisibility('visible')

    expect(store.getState().lines).toHaveLength(1)
  })

  test('efface l’analyse après une longue absence', () => {
    const store = renderShield()

    setVisibility('hidden')
    vi.advanceTimersByTime(BACKGROUND_RESET_MS + 1000)
    setVisibility('visible')

    expect(store.getState().lines).toEqual([])
    expect(store.getState().step).toBe('accueil')
  })
})
