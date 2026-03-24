import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { getCardDef } from '@data/cards/index'
import { addDeckButton } from '@ui/DeckButton'

const CARD_COLORS: Record<string, number> = {
  ATTACK: 0x7a1e1e, SKILL: 0x1a3a7a, POWER: 0x4a1a6a,
}

export class RestScene extends Phaser.Scene {
  private mainView!: Phaser.GameObjects.Container
  private upgradeView!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'RestScene' })
  }

  create(): void {
    if (!RunState.hasInstance()) {
      this.scene.start('MainMenuScene')
      return
    }
    const run = RunState.getInstance()
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x080810)

    // 모닥불 그래픽
    const g = this.add.graphics()
    const cx = width / 2
    const cy = height / 2 - 50
    g.fillStyle(0x553300)
    g.fillTriangle(cx - 22, cy + 18, cx + 22, cy + 18, cx, cy + 36)
    g.fillStyle(0xcc6600)
    g.fillTriangle(cx - 16, cy, cx + 16, cy, cx, cy - 24)
    g.fillStyle(0xff9900)
    g.fillTriangle(cx - 10, cy - 14, cx + 10, cy - 14, cx, cy - 42)
    g.fillStyle(0xffdd44, 0.8)
    g.fillTriangle(cx - 5, cy - 22, cx + 5, cy - 22, cx, cy - 52)

    this.mainView = this.add.container(0, 0)
    this.upgradeView = this.add.container(0, 0)
    this.upgradeView.setVisible(false)

    this.buildMainView(run)
    this.buildUpgradeView(run)
    addDeckButton(this)
  }

  private buildMainView(run: RunState): void {
    const { width, height } = this.scale
    const healAmt = Math.floor(run.maxHp * 0.3)
    const canHeal = run.hp < run.maxHp
    const hasUpgradable = run.deck.some(c => !c.isUpgraded)

    this.mainView.add(
      this.add.text(width / 2, 72, '모닥불', {
        fontSize: '34px', color: '#ffcc44', fontStyle: 'bold',
      }).setOrigin(0.5)
    )
    this.mainView.add(
      this.add.text(width / 2, 118, `HP: ${run.hp} / ${run.maxHp}`, {
        fontSize: '18px', color: '#ff7777',
      }).setOrigin(0.5)
    )

    // 쉬어가기 버튼
    const restBtn = this.add.text(width / 2, height - 230, `쉬어가기  (+${healAmt} HP)`, {
      fontSize: '22px',
      color: canHeal ? '#88ff88' : '#444444',
      backgroundColor: '#151515', padding: { x: 26, y: 12 },
    }).setOrigin(0.5)
    this.mainView.add(restBtn)

    if (canHeal) {
      restBtn.setInteractive({ useHandCursor: true })
      restBtn.on('pointerover', () => restBtn.setStyle({ color: '#ffffff' }))
      restBtn.on('pointerout', () => restBtn.setStyle({ color: '#88ff88' }))
      restBtn.on('pointerdown', () => {
        run.hp = Math.min(run.maxHp, run.hp + healAmt)
        this.scene.start('MapScene')
      })
    } else {
      this.mainView.add(
        this.add.text(width / 2, height - 196, '(이미 최대 HP)', {
          fontSize: '11px', color: '#555555',
        }).setOrigin(0.5)
      )
    }

    // 단련 버튼
    const upgradeBtn = this.add.text(width / 2, height - 150, '단련  (카드 강화)', {
      fontSize: '22px',
      color: hasUpgradable ? '#88aaff' : '#444444',
      backgroundColor: '#151515', padding: { x: 26, y: 12 },
    }).setOrigin(0.5)
    this.mainView.add(upgradeBtn)

    if (hasUpgradable) {
      upgradeBtn.setInteractive({ useHandCursor: true })
      upgradeBtn.on('pointerover', () => upgradeBtn.setStyle({ color: '#ffffff' }))
      upgradeBtn.on('pointerout', () => upgradeBtn.setStyle({ color: '#88aaff' }))
      upgradeBtn.on('pointerdown', () => {
        this.mainView.setVisible(false)
        this.upgradeView.setVisible(true)
      })
    } else {
      this.mainView.add(
        this.add.text(width / 2, height - 116, '(강화 가능한 카드 없음)', {
          fontSize: '11px', color: '#555555',
        }).setOrigin(0.5)
      )
    }
  }

  private buildUpgradeView(run: RunState): void {
    const { width, height } = this.scale

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88)
      .setInteractive()
    this.upgradeView.add(overlay)

    this.upgradeView.add(
      this.add.text(width / 2, 65, '강화할 카드 선택', {
        fontSize: '26px', color: '#88aaff', fontStyle: 'bold',
      }).setOrigin(0.5)
    )
    this.upgradeView.add(
      this.add.text(width / 2, 102, '강화된 효과가 미리 표시됩니다', {
        fontSize: '12px', color: '#555577',
      }).setOrigin(0.5)
    )

    // 강화 가능한 카드 목록 (defId 기준 그룹화)
    const upgradable = run.deck.filter(c => !c.isUpgraded)
    const uniqueMap = new Map<string, number>()
    for (const inst of upgradable) {
      uniqueMap.set(inst.defId, (uniqueMap.get(inst.defId) ?? 0) + 1)
    }
    const entries = [...uniqueMap.entries()]

    const cardW = 110, cardH = 148, gap = 12
    const cols = Math.min(entries.length, 8)
    const totalW = cols * (cardW + gap) - gap
    const startX = width / 2 - totalW / 2 + cardW / 2

    entries.forEach(([defId, count], i) => {
      const def = getCardDef(defId)
      const col = i % 8
      const row = Math.floor(i / 8)
      const x = startX + col * (cardW + gap)
      const y = 290 + row * (cardH + gap + 30)

      const c = this.add.container(x, y)
      const bg = this.add.rectangle(0, 0, cardW, cardH, CARD_COLORS[def.type] ?? 0x333333)
        .setStrokeStyle(2, 0x7799ff)
        .setInteractive({ useHandCursor: true })
      c.add(bg)

      c.add(this.add.text(0, -cardH / 2 + 14, def.name + '+', {
        fontSize: '11px', color: '#aaddff', fontStyle: 'bold',
        wordWrap: { width: cardW - 8 }, align: 'center',
      }).setOrigin(0.5, 0))
      c.add(this.add.text(0, -cardH / 2 + 36, def.type, {
        fontSize: '9px', color: '#aaaaaa',
      }).setOrigin(0.5, 0))
      c.add(this.add.text(0, -cardH / 2 + 50, def.upgradedDescription ?? def.description, {
        fontSize: '9px', color: '#aaddff',
        wordWrap: { width: cardW - 8 }, align: 'center',
      }).setOrigin(0.5, 0))

      if (count > 1) {
        c.add(this.add.text(cardW / 2 - 4, -cardH / 2 + 4, `x${count}`, {
          fontSize: '10px', color: '#88ff88',
        }).setOrigin(1, 0))
      }

      bg.on('pointerover', () => { bg.setStrokeStyle(3, 0xffffff); c.setY(y - 8) })
      bg.on('pointerout', () => { bg.setStrokeStyle(2, 0x7799ff); c.setY(y) })
      bg.on('pointerdown', () => {
        const inst = run.deck.find(d => d.defId === defId && !d.isUpgraded)
        if (inst) inst.isUpgraded = true
        this.scene.start('MapScene')
      })
      this.upgradeView.add(c)
    })

    const cancelBtn = this.add.text(width / 2, height - 60, '취소', {
      fontSize: '17px', color: '#888888',
      backgroundColor: '#222222', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cancelBtn.on('pointerover', () => cancelBtn.setStyle({ color: '#ffffff' }))
    cancelBtn.on('pointerout', () => cancelBtn.setStyle({ color: '#888888' }))
    cancelBtn.on('pointerdown', () => {
      this.upgradeView.setVisible(false)
      this.mainView.setVisible(true)
    })
    this.upgradeView.add(cancelBtn)
  }
}
