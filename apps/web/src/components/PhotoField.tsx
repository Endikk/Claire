import { useState } from 'react'
import { useAnalyse } from '../state/context'

export function PhotoField() {
  const photoUrl = useAnalyse((state) => state.photoUrl)
  const setPhoto = useAnalyse((state) => state.setPhoto)
  const [isEnlarged, setIsEnlarged] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Le champ est vidé pour que le fichier ne reste pas attaché au formulaire.
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Ce fichier n’est pas une image. Choisissez une photo de l’ordonnance.')
      return
    }
    setError(null)
    setPhoto(file)
  }

  return (
    <section className="photo-field" aria-labelledby="photo-title">
      <h2 id="photo-title" className="visually-hidden">
        Photo de l’ordonnance
      </h2>
      {photoUrl ? (
        <button
          type="button"
          className={isEnlarged ? 'photo is-enlarged' : 'photo'}
          onClick={() => setIsEnlarged((value) => !value)}
        >
          <img src={photoUrl} alt="Ordonnance photographiée" />
          <span className="photo-hint">{isEnlarged ? 'Réduire la photo' : 'Agrandir la photo'}</span>
        </button>
      ) : (
        <p className="photo-empty">Aucune photo. Elle aide à relire, elle n’est jamais envoyée.</p>
      )}
      <div className="photo-actions">
        <label className="button-secondary">
          {photoUrl ? 'Reprendre la photo' : 'Prendre une photo'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={handleFile}
          />
        </label>
        <label className="button-quiet">
          Importer
          <input type="file" accept="image/*" className="visually-hidden" onChange={handleFile} />
        </label>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <p className="hint">
        La lecture automatique n’est pas encore disponible : saisissez les médicaments en vous aidant de la
        photo.
      </p>
    </section>
  )
}
