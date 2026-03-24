import type { Unit } from '@t/combat.types'

export class EnergyManager {
  restore(unit: Unit): void {
    unit.resource.energy = unit.resource.maxEnergy
  }

  spend(unit: Unit, amount: number): boolean {
    if (unit.resource.energy < amount) return false
    unit.resource.energy -= amount
    return true
  }

  gain(unit: Unit, amount: number): void {
    unit.resource.energy = Math.min(unit.resource.energy + amount, unit.resource.maxEnergy)
  }

  canAfford(unit: Unit, cost: number): boolean {
    return unit.resource.energy >= cost
  }
}
