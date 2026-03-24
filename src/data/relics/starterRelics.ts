import type { RelicDef } from '@t/relic.types'

export const starterRelics: RelicDef[] = [
  {
    id: 'burning_blood',
    name: '불타는 피',
    rarity: 'STARTER',
    description: '전투 종료 후 HP 6을 회복한다.',
    triggers: ['OnCombatEnd'],
  },
  {
    id: 'ring_of_the_snake',
    name: '뱀의 반지',
    rarity: 'STARTER',
    description: '각 전투 시작 시 카드 2장을 추가로 뽑는다.',
    triggers: ['OnCombatStart'],
  },
  {
    id: 'anchor',
    name: '닻',
    rarity: 'COMMON',
    description: '각 전투 시작 시 방어도 10을 얻는다.',
    triggers: ['OnCombatStart'],
  },
  {
    id: 'odd_mushroom',
    name: '이상한 버섯',
    rarity: 'COMMON',
    description: '적을 처치할 때마다 힘 1을 얻는다.',
    triggers: ['OnKill'],
  },
]
