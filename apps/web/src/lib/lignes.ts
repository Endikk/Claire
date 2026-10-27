import type { PrescriptionLine } from '@claire/engine'
import type { DraftLine } from '../state/analyse'

/** Les champs vides ne sont pas transmis au moteur : une posologie absente reste absente. */
export function toPrescriptionLines(lines: DraftLine[]): PrescriptionLine[] {
  return lines.map(({ id, productId, label, posologie, duree }) => ({
    id,
    productId,
    label,
    ...(posologie.trim() ? { posologie: posologie.trim() } : {}),
    ...(duree.trim() ? { duree: duree.trim() } : {}),
  }))
}
