import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { getCardDef } from '@data/cards/index'

const CARD_COLORS: Record<string, number> = {
  ATTACK: 0x7a1e1e, SKILL: 0x1a3a7a, POWER: 0x4a1a6a,
}

export class DeckViewerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeckViewerScene' })
  }

  create(): void {
    this.scene.bringToTop()

    const { width, height } = this.scale
    const run = RunState.getInstance()

    // 반투명 오버레이
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.92)
      .setInteractive()

    // 제목
    this.add.text(width / 2, 34, `덱 (${run.deck.length}장)`, {
      fontSize: '22px', color: '#ffddaa', fontStyle: 'bold',
    }).setOrigin(0.5)

    // 닫기 버튼
    const closeBtn = this.add.text(width - 14, 14, '✕', {
      fontSize: '18px', color: '#aaaaaa',
      backgroundColor: '#222222', padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ffffff' }))
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#aaaaaa' }))
    closeBtn.on('pointerdown', () => this.scene.stop())
    overlay.on('pointerdown', () => this.scene.stop())

    // 카드 그룹화 (defId + isUpgraded 기준)
    const groupMap = new Map<string, { defId: string; isUpgraded: boolean; count: number }>()
    for (const inst of run.deck) {
      const key = `${inst.defId}|${inst.isUpgraded}`
      const existing = groupMap.get(key)
      if (existing) {
        existing.count++
      } else {
        groupMap.set(key, { defId: inst.defId, isUpgraded: inst.isUpgraded, count: 1 })
      }
    }
    const entries = [...groupMap.values()]

    const cardW = 98, cardH = 132, gapX = 8, gapY = 12
    const cols = 9
    const totalW = cols * (cardW + gapX) - gapX
    const startX = width / 2 - totalW / 2 + cardW / 2

    entries.forEach(({ defId, isUpgraded, count }, i) => {
      const def = getCardDef(defId)
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (cardW + gapX)
      const y = 110 + row * (cardH + gapY)

      const c = this.add.container(x, y)
      const bg = this.add.rectangle(0, 0, cardW, cardH, CARD_COLORS[def.type] ?? 0x333333)
        .setStrokeStyle(1, isUpgraded ? 0xffdd44 : 0x555555)
      c.add(bg)

      // 비용 원
      c.add(this.add.circle(-cardW / 2 + 10, -cardH / 2 + 10, 9, 0x111133))
      c.add(this.add.text(-cardW / 2 + 10, -cardH / 2 + 10, String(def.cost), {
        fontSize: '10px', color: '#ffdd44', fontStyle: 'bold',
      }).setOrigin(0.5))

      // 이름 (+강화 표시)
      const label = isUpgraded ? `${def.name}+` : def.name
      c.add(this.add.text(0, -cardH / 2 + 14, label, {
        fontSize: '10px', color: isUpgraded ? '#ffdd88' : '#ffffff', fontStyle: 'bold',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5, 0))

      // 타입
      c.add(this.add.text(0, -cardH / 2 + 35, def.type, {
        fontSize: '8px', color: '#aaaaaa',
      }).setOrigin(0.5, 0))

      // 설명
      const desc = isUpgraded ? (def.upgradedDescription ?? def.description) : def.description
      c.add(this.add.text(0, -cardH / 2 + 48, desc, {
        fontSize: '8px', color: '#dddddd',
        wordWrap: { width: cardW - 10 }, align: 'center',
      }).setOrigin(0.5, 0))

      // 수량
      if (count > 1) {
        c.add(this.add.text(cardW / 2 - 4, -cardH / 2 + 4, `x${count}`, {
          fontSize: '9px', color: '#88ff88',
        }).setOrigin(1, 0))
      }
    })

    this.add.text(width / 2, height - 22, 'ESC 또는 배경 클릭으로 닫기', {
      fontSize: '11px', color: '#333333',
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown-ESC', () => this.scene.stop())
  }
}
