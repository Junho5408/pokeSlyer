import type { CardInstance } from './card.types'
import type { RelicInstance } from './relic.types'
import type { MapState } from './map.types'
import type { RNGState, PityState } from './rng.types'

export interface RunSaveData {
  version: number
  timestamp: number
  characterId: string
  floor: number
  hp: number
  maxHp: number
  gold: number
  deck: CardInstance[]
  relics: RelicInstance[]
  potions: string[]
  map: MapState
  rng: RNGState
  pity: PityState
}

export interface PlayHistoryEntry {
  timestamp: number
  characterId: string
  floorsReached: number
  killCount: number
  victory: boolean
  seed: number
}

export interface MetaProgressData {
  regressPoints: number
  unlockedLegacies: string[]
  unlockedRareCards: string[]
  playHistory: PlayHistoryEntry[]
}
