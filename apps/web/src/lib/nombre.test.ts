import { describe, expect, test } from 'vitest'
import { parseBoundedNumber } from './nombre'

describe('parseBoundedNumber', () => {
  test('accepte la virgule décimale française', () => {
    expect(parseBoundedNumber('12,5', 0, 250)).toBe(12.5)
  })

  test('ignore les espaces autour de la valeur', () => {
    expect(parseBoundedNumber(' 30 ', 0, 200)).toBe(30)
  })

  test('renvoie undefined pour un champ vide', () => {
    expect(parseBoundedNumber('', 0, 200)).toBeUndefined()
  })

  test('renvoie undefined pour une valeur hors limites', () => {
    expect(parseBoundedNumber('400', 0, 250)).toBeUndefined()
  })

  test('renvoie undefined pour un texte qui n’est pas un nombre', () => {
    expect(parseBoundedNumber('trente', 0, 200)).toBeUndefined()
  })
})
