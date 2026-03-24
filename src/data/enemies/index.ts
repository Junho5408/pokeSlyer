import type { EnemyDef } from '@t/combat.types'
import { basicEnemies } from './basicEnemies'

const registry = new Map<string, EnemyDef>()

for (const enemy of basicEnemies) {
  registry.set(enemy.id, enemy)
}

export function getEnemyDef(id: string): EnemyDef {
  const def = registry.get(id)
  if (!def) throw new Error(`EnemyDef not found: ${id}`)
  return def
}
