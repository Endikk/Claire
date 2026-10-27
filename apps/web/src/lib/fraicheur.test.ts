import { describe, expect, test } from 'vitest'
import { isStale, STALE_AFTER_DAYS } from './fraicheur'

describe('isStale', () => {
  test('considère à jour des données de moins de STALE_AFTER_DAYS jours', () => {
    expect(isStale('2026-09-29', new Date('2026-10-27T12:00:00Z'))).toBe(false)
  })

  test('signale des données plus anciennes que STALE_AFTER_DAYS jours', () => {
    const now = new Date('2026-09-29T00:00:00Z')
    now.setUTCDate(now.getUTCDate() + STALE_AFTER_DAYS + 1)

    expect(isStale('2026-09-29', now)).toBe(true)
  })
})
