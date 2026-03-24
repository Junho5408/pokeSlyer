import type { RunState } from '@game/RunState'
import { starterCards, getCardDef } from '@data/cards/index'

type SimpleRNG = { nextInt: (min: number, max: number) => number }

export interface EventChoice {
  label: string
  detail: string
  isDisabled: (run: RunState) => boolean
  apply: (run: RunState, rng: SimpleRNG) => string
}

export interface EventDef {
  id: string
  title: string
  flavor: string
  choices: EventChoice[]
}

const nonStarterPool = starterCards.filter(c => c.rarity !== 'STARTER').map(c => c.id)

export const starterEvents: EventDef[] = [
  {
    id: 'mysterious_box',
    title: '수상한 상자',
    flavor: '먼지 쌓인 나무 상자가 길 한가운데 놓여 있다.\n그 안에서 무언가 빛나는 것이 보인다.',
    choices: [
      {
        label: '열다  (-8 HP, +100 골드)',
        detail: '상자를 열어 내용물을 취한다.',
        isDisabled: (run) => run.hp <= 8,
        apply: (run) => {
          run.hp -= 8
          run.gold += 100
          return '상자 안에는 금화가 가득했다!\n(-8 HP, +100 골드)'
        },
      },
      {
        label: '무시하다',
        detail: '그냥 지나친다.',
        isDisabled: () => false,
        apply: () => '그냥 지나쳤다.',
      },
    ],
  },
  {
    id: 'injured_swordsman',
    title: '부상당한 검사',
    flavor: '길가에 쓰러진 검사가 신음하고 있다.\n"제발... 도와주세요..."',
    choices: [
      {
        label: '도움을 주다  (-30 골드, +12 HP)',
        detail: '가진 물건을 나눠준다.',
        isDisabled: (run) => run.gold < 30,
        apply: (run) => {
          run.gold -= 30
          run.hp = Math.min(run.maxHp, run.hp + 12)
          return '검사가 감사히 받았다. 몸에 활기가 돌았다.\n(-30 골드, +12 HP)'
        },
      },
      {
        label: '지나치다',
        detail: '모른 척 걸어간다.',
        isDisabled: () => false,
        apply: () => '검사의 원망스러운 눈빛을 뒤로 하고 걸어갔다.',
      },
    ],
  },
  {
    id: 'ancient_altar',
    title: '고대 제단',
    flavor: '불가사의한 에너지가 흐르는 돌 제단이 서 있다.\n제물을 바치면 보상을 받을 수 있다는 소문이 있다.',
    choices: [
      {
        label: '피를 바치다  (-20% 최대 HP, +150 골드)',
        detail: '자신의 혈액으로 제단을 적신다.',
        isDisabled: (run) => run.maxHp <= 20,
        apply: (run) => {
          const sacrifice = Math.floor(run.maxHp * 0.2)
          run.maxHp -= sacrifice
          run.hp = Math.min(run.hp, run.maxHp)
          run.gold += 150
          return `제단이 빛나며 금화를 내뿜었다.\n(-${sacrifice} 최대 HP, +150 골드)`
        },
      },
      {
        label: '무시하다',
        detail: '위험해 보여서 그냥 지나친다.',
        isDisabled: () => false,
        apply: () => '제단은 조용히 빛을 잃었다.',
      },
    ],
  },
  {
    id: 'ancient_tome',
    title: '낡은 서적',
    flavor: '먼지 쌓인 서적이 흥미로운 기술을 담고 있다.\n읽는다면 새 기술을 익힐 수 있을 것 같다.',
    choices: [
      {
        label: '연구하다  (랜덤 카드 1장 획득)',
        detail: '새로운 전투 기술을 익힌다.',
        isDisabled: () => false,
        apply: (run, rng) => {
          const idx = rng.nextInt(0, nonStarterPool.length - 1)
          const defId = nonStarterPool[idx]
          run.addCardToDeck(defId)
          const def = getCardDef(defId)
          return `[${def.name}] 카드를 덱에 추가했다!`
        },
      },
      {
        label: '무시하다',
        detail: '읽을 시간이 없다.',
        isDisabled: () => false,
        apply: () => '서적을 덮고 지나쳤다.',
      },
    ],
  },
  {
    id: 'cursed_spring',
    title: '저주받은 샘',
    flavor: '이상한 빛을 발하는 샘이 있다.\n마실지 말지 갈등이 생긴다.',
    choices: [
      {
        label: '마시다  (50%: +20 HP / 50%: -15 HP)',
        detail: '운에 맡기고 물을 마신다.',
        isDisabled: () => false,
        apply: (run, rng) => {
          if (rng.nextInt(0, 1) === 0) {
            run.hp = Math.min(run.maxHp, run.hp + 20)
            return '신선한 물기운이 몸에 퍼졌다!\n(+20 HP)'
          } else {
            run.hp = Math.max(1, run.hp - 15)
            return '독이 든 물이었다!\n(-15 HP)'
          }
        },
      },
      {
        label: '지나치다',
        detail: '수상해 보여서 그냥 간다.',
        isDisabled: () => false,
        apply: () => '그냥 지나쳤다.',
      },
    ],
  },
  {
    id: 'abandoned_weapon',
    title: '버려진 무기',
    flavor: '길바닥에 녹슨 무기가 하나 버려져 있다.\n여전히 쓸 만해 보인다.',
    choices: [
      {
        label: '집다  (랜덤 카드 1장 획득)',
        detail: '무기를 들고 기술을 익힌다.',
        isDisabled: () => false,
        apply: (run, rng) => {
          const idx = rng.nextInt(0, nonStarterPool.length - 1)
          const defId = nonStarterPool[idx]
          run.addCardToDeck(defId)
          const def = getCardDef(defId)
          return `오래된 무기로 [${def.name}] 기술을 익혔다!`
        },
      },
      {
        label: '무시하다',
        detail: '필요 없다.',
        isDisabled: () => false,
        apply: () => '그냥 지나쳤다.',
      },
    ],
  },
  {
    id: 'golden_idol',
    title: '황금 조각상',
    flavor: '반짝이는 황금 조각상이 받침대 위에 놓여 있다.\n가져가면 함정이 발동할지도 모른다.',
    choices: [
      {
        label: '집다  (+75 골드, -10 HP)',
        detail: '재빠르게 조각상을 집는다.',
        isDisabled: (run) => run.hp <= 10,
        apply: (run) => {
          run.hp -= 10
          run.gold += 75
          return '함정이 발동했지만 조각상을 챙겼다!\n(-10 HP, +75 골드)'
        },
      },
      {
        label: '무시하다',
        detail: '위험을 감수하지 않는다.',
        isDisabled: () => false,
        apply: () => '함정을 피해 그냥 지나쳤다.',
      },
    ],
  },
]
