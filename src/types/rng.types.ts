export type RNGStreamId = 'MapRNG' | 'CombatRNG' | 'LootRNG'

export interface RNGState {
  globalSeed: number
  streams: Record<RNGStreamId, number>
}

export interface PityState {
  commonCardStreak: number
  recentRelicIds: string[]
}
