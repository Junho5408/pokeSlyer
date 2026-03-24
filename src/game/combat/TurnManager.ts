import type { CombatManager } from './CombatManager'
import type { EffectContext } from '@game/engine/EffectContext'
import { getEnemyDef } from '@data/enemies/index'

const DRAW_PER_TURN = 5

export class TurnManager {
  constructor(private readonly combat: CombatManager) {}

  startPlayerTurn(): void {
    const { state, triggerBus, deckManager, energyManager, rngManager, statusManager } = this.combat
    state.isPlayerTurn = true
    state.turnCount++

    // 방어도 초기화 → 에너지 회복 → 드로우
    state.player.resource.block = 0
    state.player.resource.energy = this.combat.energyPerTurn
    energyManager.restore(state.player)

    const drawn = deckManager.draw(DRAW_PER_TURN, rngManager.get('CombatRNG'))
    deckManager.addToHand(drawn)

    triggerBus.emit('OnTurnStart', { sourceUnitId: state.player.id })
    // 플레이어 상태이상 감소 (OnTurnStart 기준)
    statusManager.tick(state.player, 'OnTurnStart')
  }

  async endPlayerTurn(): Promise<void> {
    const { state, triggerBus, deckManager, statusManager } = this.combat
    triggerBus.emit('OnTurnEnd', { sourceUnitId: state.player.id })
    statusManager.tick(state.player, 'OnTurnEnd')
    deckManager.discardHand()
    state.isPlayerTurn = false

    await this.runEnemyTurns()
    this.startPlayerTurn()
  }

  private async runEnemyTurns(): Promise<void> {
    const { state, triggerBus, statusManager } = this.combat

    for (const enemy of state.enemies.filter(e => e.isAlive)) {
      enemy.resource.block = 0
      triggerBus.emit('OnEnemyTurnStart', { sourceUnitId: enemy.id })
      // 적 상태이상 감소 (decreaseOn: 'OnTurnStart' 공용 이벤트 사용)
      statusManager.tick(enemy, 'OnTurnStart')

      const actionDef = this.combat.getNextEnemyIntent(enemy.id)
      if (actionDef) {
        const def = getEnemyDef(this.combat.getEnemyDefId(enemy.id))

        // 조건부 행동 확인
        let canExecute = true
        const condition = actionDef.condition
        if (condition) {
          if (condition.hpBelowPercent !== undefined) {
            const hpPct = enemy.resource.hp / enemy.resource.maxHp
            if (hpPct > condition.hpBelowPercent / 100) canExecute = false
          }
          if (condition.turnCountMin !== undefined) {
            if (state.turnCount < condition.turnCountMin) canExecute = false
          }
        }

        if (canExecute) {
          // 적은 플레이어를 공격 대상으로 사용
          const context: EffectContext = {
            caster: enemy,
            target: state.player,
            allEnemies: [state.player], // 적 입장에서 "enemy"는 플레이어
            piles: state.piles,
          }

          this.combat.actionEngine.enqueue(actionDef.actions, context)
          await this.combat.flushQueue()
        }

        // 보스 페이즈 확인
        const phase = def.phase?.find(
          p => enemy.resource.hp / enemy.resource.maxHp <= p.triggerHpPercent / 100
        )
        if (phase) {
          // 페이즈 전환 (actionPattern 교체는 별도 구현 예정)
        }

        this.combat.advanceEnemyAction(enemy.id)
      }

      triggerBus.emit('OnEnemyTurnEnd', { sourceUnitId: enemy.id })

      // 적 사망 시 다음 적으로 넘어감
      if (!state.player.isAlive) break
    }
  }
}
