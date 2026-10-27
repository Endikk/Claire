import { type BdpmSource, createBdpmSource, isBdpmDataset } from '@claire/bdpm'
import { useEffect, useState } from 'react'
import { App } from './App'
import { createAnalyseStore } from './state/analyse'

const DATASET_URL = '/data/bdpm.json'

type BootState = { status: 'loading' } | { status: 'ready'; source: BdpmSource } | { status: 'error' }

const store = createAnalyseStore()

/** Charge les données des médicaments, embarquées avec l'application et gardées en cache hors connexion. */
export function Boot() {
  const [state, setState] = useState<BootState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetch(DATASET_URL, { signal: controller.signal })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
      )
      .then((data: unknown) => {
        if (!isBdpmDataset(data)) throw new Error('Format de données inattendu')
        setState({ status: 'ready', source: createBdpmSource(data) })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [])

  if (state.status === 'ready') return <App source={state.source} store={store} />

  return (
    <main className="screen boot" aria-busy={state.status === 'loading'}>
      <p className="brand">Claire</p>
      {state.status === 'loading' ? (
        <>
          <p>Chargement des données des médicaments.</p>
          <div className="boot-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </>
      ) : (
        <div role="alert">
          <h1>Données des médicaments introuvables</h1>
          <p>
            Rechargez la page. Si le problème continue, l’application a été publiée sans ses données : il faut
            relancer sa construction.
          </p>
          <button type="button" className="button-primary" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      )}
    </main>
  )
}
