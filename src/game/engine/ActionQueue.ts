import type { ActionDef } from '@t/card.types'
import type { EffectContext } from './EffectContext'

interface QueuedAction {
  action: ActionDef
  context: EffectContext
}

/**
 * 액션 큐: FIFO 처리, Interrupt(끼어들기) 지원.
 * 유닛 사망 시 해당 유닛 타겟 액션은 자동 취소.
 */
export class ActionQueue {
  private queue: QueuedAction[] = []
  private currentIndex = 0
  private isProcessing = false

  push(action: ActionDef, context: EffectContext): void {
    this.queue.push({ action, context })
  }

  insertAfterCurrent(action: ActionDef, context: EffectContext): void {
    this.queue.splice(this.currentIndex + 1, 0, { action, context })
  }

  async flush(
    executor: (action: ActionDef, context: EffectContext) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true
    this.currentIndex = 0

    while (this.currentIndex < this.queue.length) {
      const { action, context } = this.queue[this.currentIndex]
      const targetIsDead =
        context.target !== null && !context.target.isAlive
      if (!targetIsDead) {
        await executor(action, context)
      }
      this.currentIndex++
    }

    this.queue = []
    this.currentIndex = 0
    this.isProcessing = false
  }

  clear(): void {
    this.queue = []
    this.currentIndex = 0
    this.isProcessing = false
  }
}
