import type { CombatState, EnemyActionDef } from '@t/combat.types'
import type { CardInstance, ActionDef } from '@t/card.types'
import type { EffectContext } from '@game/engine/EffectContext'
import { TriggerBus } from '@game/triggers/TriggerBus'
import { ActionQueue } from '@game/engine/ActionQueue'
import { ActionEngine } from '@game/engine/ActionEngine'
import { ValueCalculator } from '@game/engine/ValueCalculator'
import { RNGManager } from '@game/rng/RNGManager'
import { TurnManager } from './TurnManager'
import { DeckManager } from './DeckManager'
import { EnergyManager } from './EnergyManager'
import { StatusManager } from './StatusManager'
import { getCardDef } from '@data/cards/index'
import { getEnemyDef } from '@data/enemies/index'

/**
 * 전투 흐름 총괄. Phaser/UI와 직접 통신하지 않음.
 * UI는 onUpdate 콜백으로 상태 변화를 전달받는다.
 */
export class CombatManager {
  readonly state: CombatState
  readonly triggerBus: TriggerBus
  readonly actionQueue: ActionQueue
  readonly actionEngine: ActionEngine
  readonly valueCalc: ValueCalculator
  readonly rngManager: RNGManager
  readonly turnManager: TurnManager
  readonly deckManager: DeckManager
  readonly energyManager: EnergyManager
  readonly statusManager: StatusManager

  /** UI 갱신 콜백. CombatScene에서 주입. */
  onUpdate: (() => void) | null = null

  /** 처리 중 여부 (사용자 입력 차단용) */
  isProcessing = false

  /** 에너지 per turn */
  energyPerTurn = 3

  private enemyDefIds = new Map<string, string>()
  private enemyActionIndices = new Map<string, number>()

  constructor(initialState: CombatState, rngManager: RNGManager) {
    this.state = initialState
    this.rngManager = rngManager
    this.triggerBus = new TriggerBus()
    this.actionQueue = new ActionQueue()
    this.actionEngine = new ActionEngine(this.actionQueue)
    this.valueCalc = new ValueCalculator()
    this.deckManager = new DeckManager(this.state.piles)
    this.energyManager = new EnergyManager()
    this.statusManager = new StatusManager()
    this.turnManager = new TurnManager(this)
  }

  registerEnemy(unitId: string, defId: string): void {
    this.enemyDefIds.set(unitId, defId)
    this.enemyActionIndices.set(unitId, 0)
  }

  getEnemyDefId(unitId: string): string {
    return this.enemyDefIds.get(unitId) ?? unitId
  }

  getNextEnemyIntent(unitId: string): EnemyActionDef | null {
    const defId = this.getEnemyDefId(unitId)
    const def = getEnemyDef(defId)
    const idx = this.enemyActionIndices.get(unitId) ?? 0
    return def.actionPattern[idx] ?? null
  }

  advanceEnemyAction(unitId: string): void {
    const defId = this.getEnemyDefId(unitId)
    const def = getEnemyDef(defId)
    const current = this.enemyActionIndices.get(unitId) ?? 0
    this.enemyActionIndices.set(unitId, (current + 1) % def.actionPattern.length)
  }

  startCombat(): void {
    this.triggerBus.emit('OnCombatStart', {})
    this.turnManager.startPlayerTurn()
    this.onUpdate?.()
  }

  async playCard(instance: CardInstance, targetEnemyId?: string): Promise<boolean> {
    const def = getCardDef(instance.defId)
    if (!this.energyManager.canAfford(this.state.player, def.cost)) return false
    if (!this.state.isPlayerTurn || this.isProcessing) return false

    this.isProcessing = true

    this.deckManager.removeFromHand(instance.instanceId)
    this.energyManager.spend(this.state.player, def.cost)

    this.triggerBus.emit('OnCardPlay', {
      cardDefId: def.id,
      sourceUnitId: this.state.player.id,
    })

    const targetEnemy = targetEnemyId
      ? (this.state.enemies.find(e => e.id === targetEnemyId) ?? null)
      : (this.state.enemies.find(e => e.isAlive) ?? null)

    const context: EffectContext = {
      caster: this.state.player,
      target: targetEnemy,
      allEnemies: this.state.enemies.filter(e => e.isAlive),
      piles: this.state.piles,
    }

    const actions = instance.isUpgraded && def.upgradedActions ? def.upgradedActions : def.actions
    this.actionEngine.enqueue(actions, context)
    await this.flushQueue()

    if (def.isExhaust) {
      this.deckManager.exhaust(instance)
    } else {
      this.deckManager.discard([instance])
    }

    this.isProcessing = false
    this.onUpdate?.()
    this.checkAndHandleVictory()
    return true
  }

  async endTurn(): Promise<void> {
    if (!this.state.isPlayerTurn || this.isProcessing) return
    this.isProcessing = true
    await this.turnManager.endPlayerTurn()
    this.isProcessing = false
    this.onUpdate?.()
    this.checkAndHandleVictory()
  }

  checkVictory(): 'PLAYER_WIN' | 'PLAYER_LOSE' | 'ONGOING' {
    if (!this.state.player.isAlive) return 'PLAYER_LOSE'
    if (this.state.enemies.every(e => !e.isAlive)) return 'PLAYER_WIN'
    return 'ONGOING'
  }

  async flushQueue(): Promise<void> {
    await this.actionQueue.flush(async (action, context) => {
      await this.executeAction(action, context)
      this.onUpdate?.()
    })
  }

  private async executeAction(action: ActionDef, context: EffectContext): Promise<void> {
    const targets = this.resolveTargets(action, context)

    switch (action.type) {
      case 'DAMAGE': {
        const times = action.times ?? 1
        for (const target of targets) {
          for (let i = 0; i < times; i++) {
            this.triggerBus.emit('OnAttack', {
              sourceUnitId: context.caster.id,
              targetUnitId: target.id,
            })
            const dmg = this.valueCalc.calculateDamage(action.value, context.caster, target)
            this.applyDamage(target.id, dmg)
          }
        }
        break
      }
      case 'BLOCK': {
        for (const target of targets) {
          const block = this.valueCalc.calculateBlock(action.value, context.caster)
          target.resource.block += block
        }
        break
      }
      case 'DRAW': {
        const drawn = this.deckManager.draw(action.value, this.rngManager.get('CombatRNG'))
        this.deckManager.addToHand(drawn)
        break
      }
      case 'GAIN_ENERGY': {
        this.energyManager.gain(this.state.player, action.value)
        break
      }
      case 'APPLY_STATUS': {
        if (!action.statusId) break
        for (const target of targets) {
          this.statusManager.apply(target, {
            id: action.statusId,
            name: action.statusId,
            stacks: action.value,
            isStackable: true,
            durationType: 'STACKS',
            decreaseOn: 'OnTurnStart',
            isRemovable: true,
          })
        }
        break
      }
      case 'HEAL': {
        const p = this.state.player
        p.resource.hp = Math.min(p.resource.hp + action.value, p.resource.maxHp)
        break
      }
      case 'DISCARD': {
        const toDiscard = this.state.piles.hand.splice(0, action.value)
        this.deckManager.discard(toDiscard)
        break
      }
      case 'EXHAUST': {
        const toExhaust = this.state.piles.hand.splice(0, action.value)
        for (const c of toExhaust) this.deckManager.exhaust(c)
        break
      }
      case 'ADD_CARD':
        break
    }
  }

  private resolveTargets(action: ActionDef, context: EffectContext) {
    switch (action.target) {
      case 'SELF':
        return [context.caster]
      case 'ENEMY_SINGLE':
        return context.target ? [context.target] : []
      case 'ENEMY_ALL':
        return context.allEnemies.filter(u => u.isAlive)
    }
  }

  applyDamage(targetId: string, amount: number): void {
    const target =
      this.state.player.id === targetId
        ? this.state.player
        : this.state.enemies.find(e => e.id === targetId)
    if (!target?.isAlive) return

    this.triggerBus.emit('OnDamageTaken', { targetUnitId: targetId, value: amount })

    const blockAbsorbed = Math.min(target.resource.block, amount)
    target.resource.block -= blockAbsorbed
    target.resource.hp = Math.max(0, target.resource.hp - (amount - blockAbsorbed))

    if (target.resource.hp <= 0) {
      target.isAlive = false
      this.triggerBus.emit('OnKill', { targetUnitId: targetId })
    }
  }

  private checkAndHandleVictory(): void {
    if (this.checkVictory() !== 'ONGOING') {
      this.triggerBus.emit('OnCombatEnd', {})
    }
  }
}
