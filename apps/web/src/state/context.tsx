import type { BdpmSource } from '@claire/bdpm'
import { createContext, type ReactNode, useContext } from 'react'
import { useStore } from 'zustand'
import type { AnalyseState, AnalyseStore } from './analyse'

type Dependencies = { store: AnalyseStore; source: BdpmSource }

const DependenciesContext = createContext<Dependencies | null>(null)

type Props = Dependencies & { children: ReactNode }

export function DependenciesProvider({ store, source, children }: Props) {
  return <DependenciesContext.Provider value={{ store, source }}>{children}</DependenciesContext.Provider>
}

function useDependencies(): Dependencies {
  const dependencies = useContext(DependenciesContext)
  if (!dependencies) throw new Error('DependenciesProvider manquant autour de l’application.')
  return dependencies
}

export function useAnalyse<T>(selector: (state: AnalyseState) => T): T {
  return useStore(useDependencies().store, selector)
}

export function useAnalyseStore(): AnalyseStore {
  return useDependencies().store
}

export function useSource(): BdpmSource {
  return useDependencies().source
}
