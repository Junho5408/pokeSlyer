import type { Unit } from '@t/combat.types'
import type { DeckPiles } from '@t/combat.types'

export interface EffectContext {
  caster: Unit
  target: Unit | null
  allEnemies: Unit[]
  piles: DeckPiles
}
