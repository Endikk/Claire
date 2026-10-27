import type { BdpmSource } from '@claire/bdpm'
import { PrivacyShield } from './components/PrivacyShield'
import { Accueil } from './screens/Accueil'
import { Ordonnance } from './screens/Ordonnance'
import { Profil } from './screens/Profil'
import { Resultats } from './screens/Resultats'
import type { AnalyseStore } from './state/analyse'
import { DependenciesProvider, useAnalyse } from './state/context'

type Props = {
  source: BdpmSource
  store: AnalyseStore
}

function CurrentStep() {
  const step = useAnalyse((state) => state.step)
  switch (step) {
    case 'accueil':
      return <Accueil />
    case 'ordonnance':
      return <Ordonnance />
    case 'profil':
      return <Profil />
    case 'resultats':
      return <Resultats />
  }
}

export function App({ source, store }: Props) {
  return (
    <DependenciesProvider source={source} store={store}>
      <PrivacyShield>
        <CurrentStep />
      </PrivacyShield>
    </DependenciesProvider>
  )
}
