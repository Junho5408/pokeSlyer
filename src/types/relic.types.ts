import type { TriggerEvent } from './trigger.types'

export type RelicRarity = 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'BOSS' | 'EVENT'

export interface RelicDef {
  id: string
  name: string
  rarity: RelicRarity
  description: string
  triggers: TriggerEvent[]
  counterTarget?: number
}

export interface RelicInstance {
  defId: string
  counter: number
}
