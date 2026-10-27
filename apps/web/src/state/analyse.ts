import type { AnalysisResult, PatientProfile, Situation } from '@claire/engine'
import { createStore } from 'zustand/vanilla'

export type Step = 'accueil' | 'ordonnance' | 'profil' | 'resultats'

export interface DraftLine {
  id: string
  productId: string | null
  label: string
  posologie: string
  duree: string
}

export type PrecisionKey = 'trimestre' | 'ageAns' | 'poidsKg' | 'clairanceMlMin' | 'allergies'
/** `undefined` retire la précision : un champ vidé ou invalide ne laisse aucune valeur derrière lui. */
export type PrecisionsPatch = { [K in PrecisionKey]?: PatientProfile[K] | undefined }

/** Précisions demandées par le cahier des charges (§6) après certaines cases. */
export const PRECISIONS_BY_SITUATION: Partial<Record<Situation, PrecisionKey[]>> = {
  enceinte: ['trimestre'],
  enfant: ['ageAns', 'poidsKg'],
  nourrisson: ['ageAns', 'poidsKg'],
  'insuffisance-renale': ['clairanceMlMin'],
  allergies: ['allergies'],
}

export interface AnalyseState {
  step: Step
  photoUrl: string | null
  lines: DraftLine[]
  profile: PatientProfile
  result: AnalysisResult | null
  start(): void
  goTo(step: Step): void
  setPhoto(file: File): void
  addLine(productId: string | null, label: string): void
  updateLine(id: string, patch: Partial<Pick<DraftLine, 'posologie' | 'duree'>>): void
  removeLine(id: string): void
  toggleSituation(situation: Situation): void
  setPrecisions(patch: PrecisionsPatch): void
  setResult(result: AnalysisResult): void
  reset(): void
}

const EMPTY = {
  step: 'accueil',
  photoUrl: null,
  lines: [],
  profile: { situations: [] },
  result: null,
} satisfies Pick<AnalyseState, 'step' | 'photoUrl' | 'lines' | 'profile' | 'result'>

function withoutPrecisions(profile: PatientProfile, keys: PrecisionKey[]): PatientProfile {
  return Object.fromEntries(
    Object.entries(profile).filter(([key]) => !keys.includes(key as PrecisionKey)),
  ) as PatientProfile
}

/** Toutes les données d'une analyse vivent ici, en mémoire seulement : rien n'est persisté. */
export function createAnalyseStore() {
  return createStore<AnalyseState>()((set, get) => ({
    ...EMPTY,

    start: () => {
      const previous = get().photoUrl
      if (previous) URL.revokeObjectURL(previous)
      set({ ...EMPTY, step: 'ordonnance' })
    },

    goTo: (step) => set({ step }),

    setPhoto: (file) => {
      const previous = get().photoUrl
      if (previous) URL.revokeObjectURL(previous)
      set({ photoUrl: URL.createObjectURL(file) })
    },

    addLine: (productId, label) =>
      set((state) => ({
        lines: [...state.lines, { id: crypto.randomUUID(), productId, label, posologie: '', duree: '' }],
        result: null,
      })),

    updateLine: (id, patch) =>
      set((state) => ({
        lines: state.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
        result: null,
      })),

    removeLine: (id) =>
      set((state) => ({ lines: state.lines.filter((line) => line.id !== id), result: null })),

    toggleSituation: (situation) =>
      set((state) => {
        const checked = state.profile.situations.includes(situation)
        if (!checked) {
          return {
            profile: { ...state.profile, situations: [...state.profile.situations, situation] },
            result: null,
          }
        }
        const remaining = state.profile.situations.filter((item) => item !== situation)
        const stillNeeded = new Set(remaining.flatMap((item) => PRECISIONS_BY_SITUATION[item] ?? []))
        const obsolete = (PRECISIONS_BY_SITUATION[situation] ?? []).filter((key) => !stillNeeded.has(key))
        return {
          profile: { ...withoutPrecisions(state.profile, obsolete), situations: remaining },
          result: null,
        }
      }),

    setPrecisions: (patch) =>
      set((state) => {
        const entries = Object.entries(patch) as [PrecisionKey, unknown][]
        const cleared = entries.filter(([, value]) => value === undefined).map(([key]) => key)
        const defined = Object.fromEntries(entries.filter(([, value]) => value !== undefined))
        return { profile: { ...withoutPrecisions(state.profile, cleared), ...defined }, result: null }
      }),

    setResult: (result) => set({ result, step: 'resultats' }),

    reset: () => {
      const previous = get().photoUrl
      if (previous) URL.revokeObjectURL(previous)
      set({ ...EMPTY })
    },
  }))
}

export type AnalyseStore = ReturnType<typeof createAnalyseStore>
