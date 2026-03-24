import { PRNG } from './PRNG'
import type { RNGStreamId, RNGState } from '@t/rng.types'

/**
 * MapRNG / CombatRNG / LootRNG 독립 스트림 관리.
 * 서로의 난수가 간섭하지 않도록 분리.
 */
export class RNGManager {
  private streams: Record<RNGStreamId, PRNG>

  constructor(globalSeed: number) {
    this.streams = {
      MapRNG: new PRNG(globalSeed ^ 0x12345678),
      CombatRNG: new PRNG(globalSeed ^ 0x87654321),
      LootRNG: new PRNG(globalSeed ^ 0xdeadbeef),
    }
  }

  get(streamId: RNGStreamId): PRNG {
    return this.streams[streamId]
  }

  serialize(globalSeed: number): RNGState {
    return {
      globalSeed,
      streams: {
        MapRNG: this.streams.MapRNG.getState(),
        CombatRNG: this.streams.CombatRNG.getState(),
        LootRNG: this.streams.LootRNG.getState(),
      },
    }
  }

  static fromState(state: RNGState): RNGManager {
    const manager = new RNGManager(state.globalSeed)
    ;(Object.keys(state.streams) as RNGStreamId[]).forEach(key => {
      manager.streams[key].setState(state.streams[key])
    })
    return manager
  }
}
