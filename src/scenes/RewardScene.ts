import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { starterCards, getCardDef } from '@data/cards/index'
import type { CardDef } from '@t/card.types'

// 보상 풀: STARTER 제외 카드
const REWARD_POOL = starterCards.filter(c => c.rarity !== 'STARTER').map(c => c.id)

const CARD_COLORS: Record<string, number> = {
  ATTACK: 0x7a1e1e, SKILL: 0x1a3a7a, POWER: 0x4a1a6a,
}

export class RewardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RewardScene' })
  }

  create(): void {
    const run = RunState.getInstance()
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a)

    this.add.text(width / 2, 55, '카드 보상', {
      fontSize: '30px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.text(width / 2, 96, '카드 1장을 선택하여 덱에 추가하세요', {
      fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0.5)

    // LootRNG로 3장 랜덤 선택 (중복 없음)
    const lootRng = run.rngManager.get('LootRNG')
    const available = [...REWARD_POOL]
    const picks: string[] = []
    for (let i = 0; i < 3 && available.length > 0; i++) {
      const idx = lootRng.nextInt(0, available.length - 1)
      picks.push(available.splice(idx, 1)[0])
    }

    const cardW = 160
    const gap = 50
    const totalW = picks.length * cardW + (picks.length - 1) * gap
    const startX = width / 2 - totalW / 2 + cardW / 2

    picks.forEach((defId, i) => {
      const x = startX + i * (cardW + gap)
      this.buildCardChoice(getCardDef(defId), x, height / 2, run)
    })

    // 스킵 버튼
    const skipBtn = this.add
      .text(width / 2, height - 70, '스킵 (Skip)', {
        fontSize: '18px', color: '#777777',
        backgroundColor: '#1a1a1a', padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    skipBtn.on('pointerover', () => skipBtn.setStyle({ color: '#cccccc' }))
    skipBtn.on('pointerout', () => skipBtn.setStyle({ color: '#777777' }))
    skipBtn.on('pointerdown', () => this.scene.start('MapScene'))
  }

  private buildCardChoice(def: CardDef, x: number, y: number, run: RunState): void {
    const cardW = 160
    const cardH = 220

    const c = this.add.container(x, y)

    const bg = this.add
      .rectangle(0, 0, cardW, cardH, CARD_COLORS[def.type] ?? 0x333333)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true })
    c.add(bg)

    bg.on('pointerover', () => { bg.setStrokeStyle(3, 0xffdd44); c.setY(y - 10) })
    bg.on('pointerout', () => { bg.setStrokeStyle(2, 0x666666); c.setY(y) })
    bg.on('pointerdown', () => {
      run.addCardToDeck(def.id)
      this.scene.start('MapScene')
    })

    // 비용 원
    c.add(this.add.circle(-cardW / 2 + 16, -cardH / 2 + 16, 14, 0x111133))
    c.add(this.add.text(-cardW / 2 + 16, -cardH / 2 + 16, String(def.cost), {
      fontSize: '14px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5))

    // 카드명
    c.add(this.add.text(0, -cardH / 2 + 36, def.name, {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      wordWrap: { width: cardW - 12 }, align: 'center',
    }).setOrigin(0.5, 0))

    // 타입
    c.add(this.add.text(0, -cardH / 2 + 64, def.type, {
      fontSize: '10px', color: '#aaaaaa',
    }).setOrigin(0.5, 0))

    // 설명
    c.add(this.add.text(0, -cardH / 2 + 82, def.description, {
      fontSize: '10px', color: '#dddddd',
      wordWrap: { width: cardW - 16 }, align: 'center',
    }).setOrigin(0.5, 0))

    // 희귀도
    const rarityColor: Record<string, string> = {
      COMMON: '#cccccc', UNCOMMON: '#44aaff', RARE: '#ffaa44',
    }
    c.add(this.add.text(0, cardH / 2 - 14, def.rarity, {
      fontSize: '10px', color: rarityColor[def.rarity] ?? '#cccccc',
    }).setOrigin(0.5))
  }
}
