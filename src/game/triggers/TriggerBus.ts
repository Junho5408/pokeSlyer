import type { TriggerEvent, TriggerHandler, TriggerPayload } from '@t/trigger.types'

/**
 * 이벤트 발행/구독 버스.
 * 우선순위: System(0) > Status(10) > Relic(20) > Card(30)
 */
export class TriggerBus {
  private handlers: TriggerHandler[] = []

  register(handler: TriggerHandler): void {
    this.handlers.push(handler)
    this.handlers.sort((a, b) => a.priority - b.priority)
  }

  unregister(sourceId: string): void {
    this.handlers = this.handlers.filter(h => h.sourceId !== sourceId)
  }

  emit(event: TriggerEvent, payload: Omit<TriggerPayload, 'event'>): void {
    const fullPayload: TriggerPayload = { event, ...payload }
    for (const handler of this.handlers) {
      if (handler.event === event) {
        handler.handle(fullPayload)
      }
    }
  }

  clear(): void {
    this.handlers = []
  }
}
