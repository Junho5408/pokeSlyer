import type { CardInstance, ActionDef } from './card.types'
import type { StatusEffect } from './trigger.types'

export interface CombatResource {
  hp: number
  maxHp: number
  block: number
  energy: number
  maxEnergy: number
}

export interface Unit {
  id: string
  name: string
  resource: CombatResource
  statuses: StatusEffect[]
  isAlive: boolean
}

export type EnemyIntentType =
  | 'ATTACK'
  | 'DEFEND'
  | 'BUFF'
  | 'DEBUFF'
  | 'SUMMON'
  | 'UNKNOWN'

export interface EnemyIntent {
  type: EnemyIntentType
  value?: number
  times?: number
}

export interface EnemyActionCondition {
  hpBelowPercent?: number
  turnCountMin?: number
}

export interface EnemyPhaseDef {
  triggerHpPercent: number
  newActionPattern: EnemyActionDef[]
  onPhaseStart?: string[]
}

export interface EnemyActionDef {
  id: string
  intent: EnemyIntent
  actions: ActionDef[]
  condition?: EnemyActionCondition
}

export interface EnemyDef {
  id: string
  name: string
  baseHp: number
  actionPattern: EnemyActionDef[]
  phase?: EnemyPhaseDef[]
  onDeath?: string[]
  onCombatStart?: string[]
}

export interface DeckPiles {
  draw: CardInstance[]
  hand: CardInstance[]
  discard: CardInstance[]
  exhaust: CardInstance[]
}

export interface CombatState {
  player: Unit
  enemies: Unit[]
  piles: DeckPiles
  turnCount: number
  isPlayerTurn: boolean
}
