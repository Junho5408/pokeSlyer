import type { RelicDef } from '@t/relic.types'
import { starterRelics } from './starterRelics'

const registry = new Map<string, RelicDef>()

for (const relic of starterRelics) {
  registry.set(relic.id, relic)
}

export function getRelicDef(id: string): RelicDef {
  const def = registry.get(id)
  if (!def) throw new Error(`RelicDef not found: ${id}`)
  return def
}
