import type { Unit } from '@t/combat.types'

/**
 * 수치 계산 공식:
 * 최종 수치 = (기본 수치 + 시전자 버프) * 시너지 계수 * 피격 계수
 * 소수점 버림 처리.
 */
export class ValueCalculator {
  calculateDamage(baseValue: number, attacker: Unit, defender: Unit): number {
    const strength = this.getStatusStacks(attacker, 'STRENGTH')
    const weakMultiplier = this.getStatusStacks(attacker, 'WEAK') > 0 ? 0.75 : 1
    const vulnerableMultiplier = this.getStatusStacks(defender, 'VULNERABLE') > 0 ? 1.5 : 1

    return Math.floor((baseValue + strength) * weakMultiplier * vulnerableMultiplier)
  }

  calculateBlock(baseValue: number, unit: Unit): number {
    const dexterity = this.getStatusStacks(unit, 'DEXTERITY')
    const frailMultiplier = this.getStatusStacks(unit, 'FRAIL') > 0 ? 0.75 : 1

    return Math.floor((baseValue + dexterity) * frailMultiplier)
  }

  private getStatusStacks(unit: Unit, statusId: string): number {
    return unit.statuses.find(s => s.id === statusId)?.stacks ?? 0
  }
}
