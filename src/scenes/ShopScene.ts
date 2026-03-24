import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { starterCards, getCardDef } from '@data/cards/index'
import type { CardDef } from '@t/card.types'
import { addDeckButton } from '@ui/DeckButton'

const CARD_PRICE: Record<string, number> = {
  COMMON: 75, UNCOMMON: 150, RARE: 250,
}
const REMOVAL_COST = 75

const CARD_COLORS: Record<string, number> = {
  ATTACK: 0x7a1e1e, SKILL: 0x1a3a7a, POWER: 0x4a1a6a,
}

export class ShopScene extends Phaser.Scene {
  private shopView!: Phaser.GameObjects.Container
  private removeView!: Phaser.GameObjects.Container
  private goldText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'ShopScene' })
  }

  create(): void {
    if (!RunState.hasInstance()) {
      this.scene.start('MainMenuScene')
      return
    }
    const run = RunState.getInstance()
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0a05)

    this.add.text(width / 2, 38, '상점', {
      fontSize: '30px', color: '#ffcc44', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.goldText = this.add.text(width / 2, 74, `골드: ${run.gold}`, {
      fontSize: '18px', color: '#ffcc44',
    }).setOrigin(0.5)

    this.shopView = this.add.container(0, 0)
    this.removeView = this.add.container(0, 0)

    this.buildShopView(run)
    this.buildRemoveView(run)
    this.removeView.setVisible(false)

    addDeckButton(this)

    // 나가기 버튼 (항상 표시)
    const leaveBtn = this.add.text(width / 2, height - 38, '상점 나가기', {
      fontSize: '17px', color: '#777777',
      backgroundColor: '#1a1a1a', padding: { x: 22, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    leaveBtn.on('pointerover', () => leaveBtn.setStyle({ color: '#ffffff' }))
    leaveBtn.on('pointerout', () => leaveBtn.setStyle({ color: '#777777' }))
    leaveBtn.on('pointerdown', () => this.scene.start('MapScene'))
  }

  // ── 상점 뷰 ─────────────────────────────────
  private buildShopView(run: RunState): void {
    const { width } = this.scale
    const lootRng = run.rngManager.get('LootRNG')

    // 판매 카드 4장 (STARTER 제외)
    const pool = starterCards.filter(c => c.rarity !== 'STARTER').map(c => c.id)
    const picks: string[] = []
    for (let i = 0; i < 4 && pool.length > 0; i++) {
      const idx = lootRng.nextInt(0, pool.length - 1)
      picks.push(pool.splice(idx, 1)[0])
    }

    this.shopView.add(
      this.add.text(width / 2, 108, '── 카드 ──', { fontSize: '13px', color: '#777777' }).setOrigin(0.5)
    )

    const cardW = 128
    const gap = 16
    const totalW = picks.length * cardW + (picks.length - 1) * gap
    const startX = width / 2 - totalW / 2 + cardW / 2
    picks.forEach((defId, i) => {
      const def = getCardDef(defId)
      const price = CARD_PRICE[def.rarity] ?? 100
      this.buildShopCard(def, startX + i * (cardW + gap), 270, price, run)
    })

    // 카드 제거 서비스
    this.shopView.add(
      this.add.text(width / 2, 432, '── 서비스 ──', { fontSize: '13px', color: '#777777' }).setOrigin(0.5)
    )

    const canRemove = run.gold >= REMOVAL_COST && run.deck.length > 1
    const removeBtn = this.add.text(width / 2, 480, `카드 제거  ${REMOVAL_COST}G`, {
      fontSize: '17px',
      color: canRemove ? '#ffaaaa' : '#443333',
      backgroundColor: '#2a1a1a', padding: { x: 18, y: 8 },
    }).setOrigin(0.5)
    this.shopView.add(removeBtn)

    if (canRemove) {
      removeBtn.setInteractive({ useHandCursor: true })
      removeBtn.on('pointerover', () => removeBtn.setStyle({ color: '#ffffff' }))
      removeBtn.on('pointerout', () => removeBtn.setStyle({ color: '#ffaaaa' }))
      removeBtn.on('pointerdown', () => {
        this.shopView.setVisible(false)
        this.removeView.setVisible(true)
      })
    }

    this.shopView.add(
      this.add.text(width / 2, 516, '덱에서 카드 1장을 영구 제거합니다', {
        fontSize: '11px', color: '#555555',
      }).setOrigin(0.5)
    )
  }

  private buildShopCard(def: CardDef, x: number, y: number, price: number, run: RunState): void {
    const cardW = 128
    const cardH = 165
    const canAfford = run.gold >= price

    const c = this.add.container(x, y)
    const bg = this.add.rectangle(0, 0, cardW, cardH, CARD_COLORS[def.type] ?? 0x333333)
      .setStrokeStyle(2, canAfford ? 0x666666 : 0x2a2a2a)
      .setAlpha(canAfford ? 1 : 0.5)
    c.add(bg)

    if (canAfford) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerover', () => { bg.setStrokeStyle(3, 0xffdd44); c.setY(y - 8) })
      bg.on('pointerout', () => { bg.setStrokeStyle(2, 0x666666); c.setY(y) })
      bg.on('pointerdown', () => {
        run.gold -= price
        run.addCardToDeck(def.id)
        this.goldText.setText(`골드: ${run.gold}`)
        bg.removeInteractive()
        bg.setAlpha(0.25).setStrokeStyle(1, 0x333333)
        c.setY(y)
      })
    }

    c.add(this.add.circle(-cardW / 2 + 13, -cardH / 2 + 13, 11, 0x111133))
    c.add(this.add.text(-cardW / 2 + 13, -cardH / 2 + 13, String(def.cost), {
      fontSize: '11px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5))
    c.add(this.add.text(0, -cardH / 2 + 30, def.name, {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
      wordWrap: { width: cardW - 10 }, align: 'center',
    }).setOrigin(0.5, 0))
    c.add(this.add.text(0, -cardH / 2 + 54, def.type, {
      fontSize: '9px', color: '#aaaaaa',
    }).setOrigin(0.5, 0))
    c.add(this.add.text(0, -cardH / 2 + 68, def.description, {
      fontSize: '9px', color: '#dddddd',
      wordWrap: { width: cardW - 12 }, align: 'center',
    }).setOrigin(0.5, 0))
    c.add(this.add.text(0, cardH / 2 + 13, `${price}G`, {
      fontSize: '14px',
      color: canAfford ? '#ffcc44' : '#665522',
      fontStyle: 'bold',
    }).setOrigin(0.5))

    this.shopView.add(c)
  }

  // ── 카드 제거 뷰 ──────────────────────────────
  private buildRemoveView(run: RunState): void {
    const { width, height } = this.scale

    // 배경 오버레이 (상점 클릭 방지)
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.82)
      .setInteractive()
    this.removeView.add(overlay)

    this.removeView.add(
      this.add.text(width / 2, 80, '제거할 카드 선택', {
        fontSize: '22px', color: '#ffaaaa', fontStyle: 'bold',
      }).setOrigin(0.5)
    )
    this.removeView.add(
      this.add.text(width / 2, 114, `비용: ${REMOVAL_COST}G  |  현재 덱: ${run.deck.length}장`, {
        fontSize: '13px', color: '#888888',
      }).setOrigin(0.5)
    )

    // 덱의 고유 카드 목록 (defId 기준 그룹화)
    const uniqueMap = new Map<string, number>()
    for (const inst of run.deck) uniqueMap.set(inst.defId, (uniqueMap.get(inst.defId) ?? 0) + 1)
    const uniqueCards = [...uniqueMap.entries()]

    const cardW = 100
    const cardH = 136
    const gap = 10
    const cols = Math.min(uniqueCards.length, 9)
    const totalW = cols * (cardW + gap) - gap
    const startX = width / 2 - totalW / 2 + cardW / 2

    uniqueCards.forEach(([defId, count], i) => {
      const def = getCardDef(defId)
      const col = i % 9
      const row = Math.floor(i / 9)
      const x = startX + col * (cardW + gap)
      const y = 300 + row * (cardH + gap + 28)

      const c = this.add.container(x, y)
      const bg = this.add.rectangle(0, 0, cardW, cardH, CARD_COLORS[def.type] ?? 0x333333)
        .setStrokeStyle(2, 0x886666)
        .setInteractive({ useHandCursor: true })
      c.add(bg)

      c.add(this.add.text(0, -cardH / 2 + 16, def.name, {
        fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
        wordWrap: { width: cardW - 8 }, align: 'center',
      }).setOrigin(0.5, 0))
      c.add(this.add.text(0, -cardH / 2 + 38, def.type, {
        fontSize: '9px', color: '#aaaaaa',
      }).setOrigin(0.5, 0))
      c.add(this.add.text(0, -cardH / 2 + 52, def.description, {
        fontSize: '9px', color: '#cccccc',
        wordWrap: { width: cardW - 8 }, align: 'center',
      }).setOrigin(0.5, 0))

      if (count > 1) {
        c.add(this.add.text(cardW / 2 - 4, -cardH / 2 + 4, `x${count}`, {
          fontSize: '10px', color: '#88ff88',
        }).setOrigin(1, 0))
      }

      bg.on('pointerover', () => { bg.setStrokeStyle(3, 0xff4444); c.setY(y - 8) })
      bg.on('pointerout', () => { bg.setStrokeStyle(2, 0x886666); c.setY(y) })
      bg.on('pointerdown', () => {
        const idx = run.deck.findIndex(d => d.defId === defId)
        if (idx !== -1) run.deck.splice(idx, 1)
        run.gold -= REMOVAL_COST
        this.scene.restart()
      })
      this.removeView.add(c)
    })

    // 취소 버튼
    const cancelBtn = this.add.text(width / 2, height - 90, '취소', {
      fontSize: '17px', color: '#888888',
      backgroundColor: '#222222', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cancelBtn.on('pointerover', () => cancelBtn.setStyle({ color: '#ffffff' }))
    cancelBtn.on('pointerout', () => cancelBtn.setStyle({ color: '#888888' }))
    cancelBtn.on('pointerdown', () => {
      this.removeView.setVisible(false)
      this.shopView.setVisible(true)
    })
    this.removeView.add(cancelBtn)
  }
}
