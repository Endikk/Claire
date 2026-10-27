import { buildDataset, createBdpmSource, type Specialite } from '@claire/bdpm'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { App } from './App'
import { createAnalyseStore } from './state/analyse'

function specialite(cis: string, denomination: string): Specialite {
  return {
    cis,
    denomination,
    forme: 'comprimé',
    voies: ['orale'],
    commercialisee: true,
    dateAmm: '2002-07-09',
    titulaire: 'LABO',
  }
}

const source = createBdpmSource(
  buildDataset(
    [
      specialite('1', 'DOLIPRANE 1000 mg, comprimé'),
      specialite('3', 'PARACÉTAMOL BIOGARAN 500 mg, comprimé'),
    ],
    [
      {
        cis: '1',
        element: 'comprimé',
        substanceCode: '02202',
        substance: 'PARACÉTAMOL',
        nature: 'SA',
        liaison: '1',
      },
      {
        cis: '3',
        element: 'comprimé',
        substanceCode: '02202',
        substance: 'PARACÉTAMOL',
        nature: 'SA',
        liaison: '1',
      },
    ],
    { updatedAt: '2026-09-29', generatedAt: '2026-10-27T10:00:00.000Z' },
  ),
)

function renderApp(appSource = source) {
  const store = createAnalyseStore()
  render(<App source={appSource} store={store} />)
  return { store, user: userEvent.setup({ applyAccept: false }) }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function addMedicament(user: ReturnType<typeof userEvent.setup>, query: string, name: string) {
  await user.clear(screen.getByLabelText('Rechercher un médicament'))
  await user.type(screen.getByLabelText('Rechercher un médicament'), query)
  await user.click(screen.getByRole('button', { name: new RegExp(`^Ajouter ${escapeRegExp(name)}`) }))
}

describe('parcours d’analyse', () => {
  test('mène de l’ordonnance aux alertes, puis efface tout', async () => {
    const { store, user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await addMedicament(user, 'dolip', 'DOLIPRANE 1000 mg, comprimé')
    await addMedicament(user, 'paracetamol', 'PARACÉTAMOL BIOGARAN 500 mg, comprimé')
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('checkbox', { name: 'Enceinte' }))
    await user.click(screen.getByRole('button', { name: 'Lancer l’analyse' }))

    expect(await screen.findByRole('heading', { name: 'Résultats' })).toBeTruthy()
    expect(screen.getByText('Principe actif en double : PARACÉTAMOL.')).toBeTruthy()
    expect(screen.getByText('Profil : enceinte.')).toBeTruthy()
    expect(screen.getAllByText(/BDPM \(ANSM\), mise à jour du 29\/09\/2026/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Terminer' }))

    expect(screen.getByRole('button', { name: 'Nouvelle analyse' })).toBeTruthy()
    expect(store.getState().lines).toEqual([])
  })

  test('n’autorise pas à continuer sans médicament', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))

    expect(screen.getByRole('button', { name: 'Continuer' }).hasAttribute('disabled')).toBe(true)
  })

  test('permet d’ajouter un médicament introuvable, signalé comme non identifié', async () => {
    const { store, user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await user.type(screen.getByLabelText('Rechercher un médicament'), 'xyzoline')
    await user.click(screen.getByRole('button', { name: 'Ajouter « xyzoline » manuellement' }))

    expect(store.getState().lines).toMatchObject([{ productId: null, label: 'xyzoline' }])
    expect(screen.getByText('Non identifié : non inclus dans l’analyse')).toBeTruthy()
  })

  test('indique un profil non renseigné quand aucune case n’est cochée', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await addMedicament(user, 'dolip', 'DOLIPRANE 1000 mg, comprimé')
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: 'Lancer l’analyse' }))

    expect(await screen.findByText('Profil : non renseigné.')).toBeTruthy()
  })

  test('distingue les contrôles réalisés de ceux qui ne le sont pas', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await addMedicament(user, 'dolip', 'DOLIPRANE 1000 mg, comprimé')
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: 'Lancer l’analyse' }))

    expect(await screen.findByText('Aucune alerte sur les contrôles réalisés.')).toBeTruthy()
    expect(screen.getByText('Doublons de principe actif : aucune alerte')).toBeTruthy()
    expect(screen.getByText('Interactions médicamenteuses')).toBeTruthy()
  })

  test('donne accès à la notice officielle de chaque médicament identifié', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await addMedicament(user, 'dolip', 'DOLIPRANE 1000 mg, comprimé')
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await user.click(screen.getByRole('button', { name: 'Lancer l’analyse' }))

    const link = await screen.findByRole('link', { name: 'DOLIPRANE 1000 mg, comprimé' })
    expect(link.getAttribute('href')).toContain('/medicament/1/')
  })
})

describe('saisie des médicaments', () => {
  test('annonce l’ajout et rend la main au champ de recherche', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await addMedicament(user, 'dolip', 'DOLIPRANE 1000 mg, comprimé')

    expect(screen.getByRole('status').textContent).toContain('DOLIPRANE 1000 mg, comprimé ajouté')
    expect(document.activeElement).toBe(screen.getByLabelText('Rechercher un médicament'))
  })

  test('annonce l’absence de résultat', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await user.type(screen.getByLabelText('Rechercher un médicament'), 'xyzoline')

    expect(screen.getByRole('status').textContent).toBe('Aucun résultat.')
  })

  test('prévient quand tous les résultats ne sont pas affichés', async () => {
    const many = Array.from({ length: 20 }, (_, index) => specialite(String(index), `DOLIPRANE ${index} mg`))
    const { user } = renderApp(
      createBdpmSource(
        buildDataset(many, [], { updatedAt: '2026-09-29', generatedAt: '2026-10-27T10:00:00.000Z' }),
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await user.type(screen.getByLabelText('Rechercher un médicament'), 'doliprane')

    expect(screen.getByText('Résultats limités à 12 : précisez la recherche.')).toBeTruthy()
  })

  test('refuse un fichier qui n’est pas une image, avec un message', async () => {
    const { store, user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Nouvelle analyse' }))
    await user.upload(screen.getByLabelText('Importer'), new File(['x'], 'notes.txt', { type: 'text/plain' }))

    expect(store.getState().photoUrl).toBeNull()
    expect(screen.getByText(/Ce fichier n’est pas une image/)).toBeTruthy()
  })
})
