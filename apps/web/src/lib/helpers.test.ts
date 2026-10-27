import { describe, expect, test } from 'vitest'
import { formatDate } from './date'
import { toPrescriptionLines } from './lignes'

describe('formatDate', () => {
  test('affiche une date ISO au format français', () => {
    expect(formatDate('2026-09-29')).toBe('29/09/2026')
  })
})

describe('toPrescriptionLines', () => {
  test('ne transmet pas les posologies et durées vides', () => {
    const lines = toPrescriptionLines([
      { id: 'a', productId: '1', label: 'DOLIPRANE', posologie: '  ', duree: '' },
    ])

    expect(lines).toEqual([{ id: 'a', productId: '1', label: 'DOLIPRANE' }])
  })

  test('transmet les posologies et durées saisies, sans espaces superflus', () => {
    const lines = toPrescriptionLines([
      { id: 'a', productId: null, label: 'XYZ', posologie: ' 1 cp le soir ', duree: '7 jours' },
    ])

    expect(lines).toEqual([
      { id: 'a', productId: null, label: 'XYZ', posologie: '1 cp le soir', duree: '7 jours' },
    ])
  })
})
