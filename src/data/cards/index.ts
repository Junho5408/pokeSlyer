import type { CardDef } from '@t/card.types'
import { starterCards } from './starterCards'

const registry = new Map<string, CardDef>()

for (const card of starterCards) {
  registry.set(card.id, card)
}

export function getCardDef(id: string): CardDef {
  const def = registry.get(id)
  if (!def) throw new Error(`CardDef not found: ${id}`)
  return def
}

export { starterCards }
