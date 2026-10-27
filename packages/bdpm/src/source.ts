import type { DrugKnowledgeSource, SourceRef } from '@claire/engine'
import type { BdpmDataset, BdpmProduct } from './dataset'

export interface BdpmSource extends DrugKnowledgeSource {
  search(query: string, limit?: number): BdpmProduct[]
  product(cis: string): BdpmProduct | undefined
}

const DEFAULT_SEARCH_LIMIT = 12

interface IndexedProduct {
  product: BdpmProduct
  words: string[]
}

function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)
}

function matches(indexed: IndexedProduct, queryWords: string[]): boolean {
  return queryWords.every((queryWord) => indexed.words.some((word) => word.startsWith(queryWord)))
}

export function createBdpmSource(dataset: BdpmDataset): BdpmSource {
  const sourceRef: SourceRef = { name: dataset.meta.source, updatedAt: dataset.meta.updatedAt }
  const index: IndexedProduct[] = dataset.products.map((product) => ({ product, words: words(product.name) }))
  const byCis = new Map(dataset.products.map((product) => [product.cis, product]))

  return {
    versions: () => [sourceRef],

    composition: async (productId) => {
      if (!Object.hasOwn(dataset.ingredients, productId)) return undefined
      return { ingredients: dataset.ingredients[productId]!, source: sourceRef }
    },

    product: (cis) => byCis.get(cis),

    search: (query, limit = DEFAULT_SEARCH_LIMIT) => {
      const queryWords = words(query)
      if (queryWords.length === 0) return []
      const found = index.filter((indexed) => matches(indexed, queryWords)).map((indexed) => indexed.product)
      return [...found.filter((p) => p.commercialisee), ...found.filter((p) => !p.commercialisee)].slice(
        0,
        limit,
      )
    },
  }
}
