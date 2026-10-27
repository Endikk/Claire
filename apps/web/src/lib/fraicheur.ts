/** La BDPM est mise à jour chaque mois : au-delà, l'appli tourne sur un cache ancien ou un build oublié. */
export const STALE_AFTER_DAYS = 45

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function isStale(updatedAt: string, now: Date): boolean {
  const ageInDays = (now.getTime() - new Date(`${updatedAt}T00:00:00Z`).getTime()) / MS_PER_DAY
  return ageInDays > STALE_AFTER_DAYS
}
