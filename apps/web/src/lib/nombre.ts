/** Lit un nombre saisi à la française (« 12,5 »). Hors des bornes ou illisible : `undefined`, jamais une valeur devinée. */
export function parseBoundedNumber(value: string, min: number, max: number): number | undefined {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(normalized)) return undefined
  const parsed = Number(normalized)
  return parsed >= min && parsed <= max ? parsed : undefined
}
