const STEPS = ['Ordonnance', 'Profil patient', 'Résultats'] as const

type Props = { current: (typeof STEPS)[number] }

export function StepHeader({ current }: Props) {
  const index = STEPS.indexOf(current)
  return (
    <header className="step-header">
      <p className="step-count">
        Étape {index + 1} sur {STEPS.length}
      </p>
      <ol className="step-track" aria-label="Étapes de l’analyse">
        {STEPS.map((step, position) => (
          <li
            key={step}
            className={position <= index ? 'is-done' : undefined}
            aria-current={position === index ? 'step' : undefined}
          >
            <span className="visually-hidden">{step}</span>
          </li>
        ))}
      </ol>
      <h1>{current}</h1>
    </header>
  )
}
