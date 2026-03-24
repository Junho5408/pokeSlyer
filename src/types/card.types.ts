export type CardType = 'ATTACK' | 'SKILL' | 'POWER' | 'STATUS' | 'CURSE'

export type CardRarity = 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'SPECIAL' | 'CURSE'

export type ActionType =
  | 'DAMAGE'
  | 'BLOCK'
  | 'DRAW'
  | 'GAIN_ENERGY'
  | 'APPLY_STATUS'
  | 'DISCARD'
  | 'EXHAUST'
  | 'ADD_CARD'
  | 'HEAL'

export type TargetType = 'SELF' | 'ENEMY_SINGLE' | 'ENEMY_ALL'

export type CardTag =
  | 'strike'
  | 'defend'
  | 'poison'
  | 'bleed'
  | 'exhaust'
  | 'draw'
  | 'retain'
  | 'summon'
  | 'combo'
  | 'burn'
  | 'block'

export interface ActionDef {
  type: ActionType
  value: number
  target: TargetType
  statusId?: string
  times?: number
}

export interface CardDef {
  id: string
  name: string
  characterId: string
  type: CardType
  rarity: CardRarity
  cost: number
  actions: ActionDef[]
  upgradedActions?: ActionDef[]
  tags: CardTag[]
  isEthereal?: true
  isRetain?: true
  isExhaust?: true
  isInnate?: true
  description: string
  upgradedDescription?: string
}

export interface CardInstance {
  instanceId: string
  defId: string
  isUpgraded: boolean
}
