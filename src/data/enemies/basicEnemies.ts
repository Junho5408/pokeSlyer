import type { EnemyDef } from '@t/combat.types'

export const basicEnemies: EnemyDef[] = [
  // ────────────── 일반 적 ──────────────
  {
    id: 'goblin',
    name: '고블린',
    baseHp: 18,
    actionPattern: [
      {
        id: 'goblin_attack',
        intent: { type: 'ATTACK', value: 6 },
        actions: [{ type: 'DAMAGE', value: 6, target: 'ENEMY_SINGLE' }],
      },
      {
        id: 'goblin_defend',
        intent: { type: 'DEFEND' },
        actions: [{ type: 'BLOCK', value: 6, target: 'SELF' }],
      },
      {
        id: 'goblin_attack2',
        intent: { type: 'ATTACK', value: 8 },
        actions: [{ type: 'DAMAGE', value: 8, target: 'ENEMY_SINGLE' }],
      },
    ],
  },
  {
    id: 'lancer',
    name: '창병',
    baseHp: 26,
    actionPattern: [
      {
        id: 'lancer_attack',
        intent: { type: 'ATTACK', value: 7 },
        actions: [{ type: 'DAMAGE', value: 7, target: 'ENEMY_SINGLE' }],
      },
      {
        id: 'lancer_buff',
        intent: { type: 'BUFF' },
        actions: [{ type: 'APPLY_STATUS', value: 1, target: 'SELF', statusId: 'STRENGTH' }],
      },
      {
        id: 'lancer_attack2',
        intent: { type: 'ATTACK', value: 10 },
        actions: [{ type: 'DAMAGE', value: 10, target: 'ENEMY_SINGLE' }],
      },
    ],
  },
  {
    id: 'cultist',
    name: '컬티스트',
    baseHp: 32,
    onCombatStart: ['cultist_ritual'],
    actionPattern: [
      {
        id: 'cultist_charge',
        intent: { type: 'BUFF' },
        actions: [{ type: 'APPLY_STATUS', value: 3, target: 'SELF', statusId: 'STRENGTH' }],
      },
      {
        id: 'cultist_attack',
        intent: { type: 'ATTACK', value: 12 },
        actions: [{ type: 'DAMAGE', value: 12, target: 'ENEMY_SINGLE' }],
      },
    ],
  },
  {
    id: 'jaw_worm',
    name: '턱벌레',
    baseHp: 42,
    onCombatStart: ['jaw_worm_init'],
    actionPattern: [
      {
        id: 'jaw_worm_chomp',
        intent: { type: 'ATTACK', value: 11 },
        actions: [{ type: 'DAMAGE', value: 11, target: 'ENEMY_SINGLE' }],
      },
      {
        id: 'jaw_worm_thrash',
        intent: { type: 'ATTACK', value: 7 },
        actions: [
          { type: 'DAMAGE', value: 7, target: 'ENEMY_SINGLE' },
          { type: 'BLOCK', value: 5, target: 'SELF' },
        ],
      },
      {
        id: 'jaw_worm_bellow',
        intent: { type: 'BUFF' },
        actions: [
          { type: 'APPLY_STATUS', value: 3, target: 'SELF', statusId: 'STRENGTH' },
          { type: 'BLOCK', value: 6, target: 'SELF' },
        ],
      },
    ],
  },
  {
    id: 'louse',
    name: '이',
    baseHp: 14,
    actionPattern: [
      {
        id: 'louse_bite',
        intent: { type: 'ATTACK', value: 5 },
        actions: [{ type: 'DAMAGE', value: 5, target: 'ENEMY_SINGLE' }],
      },
      {
        id: 'louse_bite2',
        intent: { type: 'ATTACK', value: 7 },
        actions: [{ type: 'DAMAGE', value: 7, target: 'ENEMY_SINGLE' }],
      },
    ],
  },

  // ────────────── 엘리트 ──────────────
  {
    id: 'bandit_leader',
    name: '도적 우두머리',
    baseHp: 64,
    onCombatStart: ['bandit_leader_intro'],
    actionPattern: [
      {
        id: 'bandit_slash',
        intent: { type: 'ATTACK', value: 14 },
        actions: [
          { type: 'DAMAGE', value: 14, target: 'ENEMY_SINGLE' },
          { type: 'APPLY_STATUS', value: 2, target: 'ENEMY_SINGLE', statusId: 'WEAK' },
        ],
      },
      {
        id: 'bandit_skewer',
        intent: { type: 'ATTACK', value: 10, times: 2 },
        actions: [{ type: 'DAMAGE', value: 10, target: 'ENEMY_SINGLE', times: 2 }],
      },
      {
        id: 'bandit_rally',
        intent: { type: 'BUFF' },
        actions: [
          { type: 'APPLY_STATUS', value: 2, target: 'SELF', statusId: 'STRENGTH' },
          { type: 'BLOCK', value: 10, target: 'SELF' },
        ],
      },
    ],
  },

  // ────────────── 보스 ──────────────
  {
    id: 'guardian',
    name: '수호자',
    baseHp: 120,
    onCombatStart: ['guardian_start'],
    actionPattern: [
      {
        id: 'guardian_attack',
        intent: { type: 'ATTACK', value: 12 },
        actions: [{ type: 'DAMAGE', value: 12, target: 'ENEMY_SINGLE' }],
      },
      {
        id: 'guardian_charge',
        intent: { type: 'BUFF' },
        actions: [
          { type: 'APPLY_STATUS', value: 4, target: 'SELF', statusId: 'STRENGTH' },
          { type: 'BLOCK', value: 15, target: 'SELF' },
        ],
      },
      {
        id: 'guardian_slam',
        intent: { type: 'ATTACK', value: 20 },
        actions: [{ type: 'DAMAGE', value: 20, target: 'ENEMY_SINGLE' }],
      },
      {
        id: 'guardian_sweep',
        intent: { type: 'ATTACK', value: 9 },
        actions: [
          { type: 'DAMAGE', value: 9, target: 'ENEMY_SINGLE' },
          { type: 'APPLY_STATUS', value: 1, target: 'ENEMY_SINGLE', statusId: 'VULNERABLE' },
        ],
      },
    ],
  },
]
