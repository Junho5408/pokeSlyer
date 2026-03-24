export type TriggerEvent =
  | 'OnTurnStart'
  | 'OnCardPlay'
  | 'OnAttack'
  | 'OnDamageTaken'
  | 'OnKill'
  | 'OnTurnEnd'
  | 'OnCombatStart'
  | 'OnCombatEnd'
  | 'OnEnemyTurnStart'
  | 'OnEnemyTurnEnd'

export enum TriggerPriority {
  SYSTEM = 0,
  STATUS = 10,
  RELIC = 20,
  CARD = 30,
}

export interface TriggerHandler {
  sourceId: string
  priority: TriggerPriority
  event: TriggerEvent
  handle(payload: TriggerPayload): void
}

export interface TriggerPayload {
  event: TriggerEvent
  sourceUnitId?: string
  targetUnitId?: string
  value?: number
  cardDefId?: string
  cancelled?: boolean
}

export interface StatusEffect {
  id: string
  name: string
  stacks: number
  isStackable: boolean
  durationType: 'STACKS' | 'TURNS'
  decreaseOn: TriggerEvent
  isRemovable: boolean
}
