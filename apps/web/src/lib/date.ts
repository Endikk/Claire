/** « 2026-09-29 » devient « 29/09/2026 ». */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}
