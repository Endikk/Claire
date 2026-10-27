import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom ne fournit pas les URL d'objets : on les simule pour suivre leur révocation.
let nextObjectUrl = 0
URL.createObjectURL = vi.fn(() => `blob:test/${++nextObjectUrl}`)
URL.revokeObjectURL = vi.fn()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
