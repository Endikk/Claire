import { useId, useRef, useState } from 'react'
import { useSource } from '../state/context'

/** Une recherche plus courte renverrait des centaines de résultats peu utiles. */
const MIN_QUERY_LENGTH = 3
const MAX_RESULTS = 12
const MAX_LABEL_LENGTH = 200

type Props = {
  onSelect: (productId: string | null, label: string) => void
}

export function ProductSearch({ onSelect }: Props) {
  const source = useSource()
  const [query, setQuery] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const trimmed = query.trim()
  const isSearching = trimmed.length >= MIN_QUERY_LENGTH
  // Un résultat de plus que l'affichage, pour savoir si la liste est tronquée.
  const found = isSearching ? source.search(trimmed, MAX_RESULTS + 1) : []
  const results = found.slice(0, MAX_RESULTS)
  const isTruncated = found.length > MAX_RESULTS

  function handleSelect(productId: string | null, label: string) {
    onSelect(productId, label)
    setQuery('')
    setAnnouncement(`${label} ajouté à l’ordonnance.`)
    inputRef.current?.focus()
  }

  return (
    <div className="product-search">
      <label htmlFor={inputId}>Rechercher un médicament</label>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={query}
        maxLength={MAX_LABEL_LENGTH}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Nom, dosage : doliprane 1000"
        onChange={(event) => setQuery(event.target.value)}
      />
      <p role="status" className="search-status">
        {isSearching ? `${results.length} résultat${results.length > 1 ? 's' : ''}.` : announcement}
      </p>
      {isSearching && (
        <ul className="search-results">
          {results.map((product) => {
            const meta = `${product.titulaire}${product.commercialisee ? '' : ', non commercialisé'}`
            return (
              <li key={product.cis}>
                <button
                  type="button"
                  aria-label={`Ajouter ${product.name}, ${meta}`}
                  onClick={() => handleSelect(product.cis, product.name)}
                >
                  <span className="result-name">{product.name}</span>
                  <span className="result-meta">{meta}</span>
                </button>
              </li>
            )
          })}
          {isTruncated && (
            <li className="result-more">D’autres médicaments correspondent : précisez la recherche.</li>
          )}
          <li>
            <button type="button" className="result-manual" onClick={() => handleSelect(null, trimmed)}>
              Ajouter « {trimmed} » sans correspondance
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
