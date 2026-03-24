import type { TriggerHandler } from '@t/trigger.types'
import type { CombatManager } from '@game/combat/CombatManager'
import { TriggerPriority } from '@t/trigger.types'

type HandlerFactory = (combat: CombatManager) => TriggerHandler | TriggerHandler[]

/**
 * 유물 ID → TriggerHandler 팩토리 맵.
 * CombatManager를 주입받아 클로저로 핸들러를 생성한다.
 */
export const relicHandlerFactories: Record<string, HandlerFactory> = {
  burning_blood: (combat) => ({
    sourceId: 'relic:burning_blood',
    priority: TriggerPriority.RELIC,
    event: 'OnCombatEnd',
    handle: () => {
      const p = combat.state.player
      p.resource.hp = Math.min(p.resource.hp + 6, p.resource.maxHp)
    },
  }),

  ring_of_the_snake: (combat) => ({
    sourceId: 'relic:ring_of_the_snake',
    priority: TriggerPriority.RELIC,
    event: 'OnCombatStart',
    handle: () => {
      const drawn = combat.deckManager.draw(2, combat.rngManager.get('CombatRNG'))
      combat.deckManager.addToHand(drawn)
    },
  }),

  anchor: (combat) => ({
    sourceId: 'relic:anchor',
    priority: TriggerPriority.RELIC,
    event: 'OnCombatStart',
    handle: () => {
      combat.state.player.resource.block += 10
    },
  }),

  odd_mushroom: (combat) => ({
    sourceId: 'relic:odd_mushroom',
    priority: TriggerPriority.RELIC,
    event: 'OnKill',
    handle: () => {
      combat.statusManager.apply(combat.state.player, {
        id: 'STRENGTH',
        name: 'STRENGTH',
        stacks: 1,
        isStackable: true,
        durationType: 'STACKS',
        decreaseOn: 'OnCombatEnd',
        isRemovable: false,
      })
    },
  }),
}
