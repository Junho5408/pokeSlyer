import type { Unit } from '@t/combat.types'
import type { StatusEffect, TriggerEvent } from '@t/trigger.types'

export class StatusManager {
  apply(unit: Unit, status: StatusEffect): void {
    const existing = unit.statuses.find(s => s.id === status.id)
    if (existing && existing.isStackable) {
      existing.stacks += status.stacks
    } else if (!existing) {
      unit.statuses.push({ ...status })
    }
  }

  remove(unit: Unit, statusId: string): void {
    unit.statuses = unit.statuses.filter(s => s.id !== statusId)
  }

  tick(unit: Unit, event: TriggerEvent): void {
    for (const status of unit.statuses) {
      if (status.decreaseOn === event) {
        status.stacks -= 1
      }
    }
    unit.statuses = unit.statuses.filter(s => s.stacks > 0)
  }

  getStacks(unit: Unit, statusId: string): number {
    return unit.statuses.find(s => s.id === statusId)?.stacks ?? 0
  }
}
