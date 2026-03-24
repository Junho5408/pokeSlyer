import type { ActionDef } from '@t/card.types'
import type { EffectContext } from './EffectContext'
import type { ActionQueue } from './ActionQueue'

/**
 * ActionDef[] 배열을 받아 ActionQueue에 등록하는 엔진.
 * 실제 실행 로직은 CombatManager에서 executor 함수로 주입.
 */
export class ActionEngine {
  constructor(private readonly queue: ActionQueue) {}

  enqueue(actions: ActionDef[], context: EffectContext): void {
    for (const action of actions) {
      this.queue.push(action, context)
    }
  }

  enqueueInterrupt(action: ActionDef, context: EffectContext): void {
    this.queue.insertAfterCurrent(action, context)
  }
}
