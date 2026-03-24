import type { RelicInstance } from '@t/relic.types'
import type { TriggerBus } from '@game/triggers/TriggerBus'
import type { CombatManager } from '@game/combat/CombatManager'
import { relicHandlerFactories } from './RelicEffects'

export class RelicManager {
  private relics: RelicInstance[] = []

  constructor(private readonly triggerBus: TriggerBus) {}

  add(relic: RelicInstance): void {
    this.relics.push(relic)
  }

  /** 유물 효과를 TriggerBus에 핸들러로 등록한다. */
  registerEffect(defId: string, combat: CombatManager): void {
    const factory = relicHandlerFactories[defId]
    if (!factory) return
    const result = factory(combat)
    const handlers = Array.isArray(result) ? result : [result]
    for (const h of handlers) this.triggerBus.register(h)
  }

  remove(defId: string): void {
    this.relics = this.relics.filter(r => r.defId !== defId)
    this.triggerBus.unregister(`relic:${defId}`)
  }

  getAll(): RelicInstance[] {
    return [...this.relics]
  }

  incrementCounter(defId: string): void {
    const relic = this.relics.find(r => r.defId === defId)
    if (relic) relic.counter++
  }
}
