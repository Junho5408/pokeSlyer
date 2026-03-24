import Phaser from 'phaser'
import type { Unit, CombatState } from '@t/combat.types'
import type { CardInstance } from '@t/card.types'
import { CombatManager } from '@game/combat/CombatManager'
import { RelicManager } from '@game/relics/RelicManager'
import { RunState } from '@game/RunState'
import { getCardDef } from '@data/cards/index'
import { getEnemyDef } from '@data/enemies/index'
import { buildCard } from '@ui/CardRenderer'

// ── 카드 UI 상수 ──────────────────────────
const CARD_W = 110
const CARD_H = 150
const CARD_GAP = 8
const HAND_Y = 590

// ── 적 캐릭터 색상 테마 ────────────────────
const ENEMY_THEMES: Record<string, { body: number; head: number; stroke: number }> = {
  goblin:        { body: 0x1e3a10, head: 0x2a5018, stroke: 0x44aa33 },
  lancer:        { body: 0x102040, head: 0x182a5a, stroke: 0x3366bb },
  cultist:       { body: 0x2e1030, head: 0x441848, stroke: 0x9933cc },
  jaw_worm:      { body: 0x1a3010, head: 0x244018, stroke: 0x558833 },
  louse:         { body: 0x3a2808, head: 0x503810, stroke: 0xaa7722 },
  bandit_leader: { body: 0x3a1008, head: 0x521814, stroke: 0xcc4422 },
  guardian:      { body: 0x100830, head: 0x1a1248, stroke: 0x7744cc },
}

export class CombatScene extends Phaser.Scene {
  private manager!: CombatManager
  private selectedCardId: string | null = null
  private needsEnemyTarget = false

  private handCards: Phaser.GameObjects.Container[] = []
  private enemyContainers: Map<string, Phaser.GameObjects.Container> = new Map()
  private playerHud!: Phaser.GameObjects.Container
  private pileText!: Phaser.GameObjects.Text
  private endTurnBtn!: Phaser.GameObjects.Text
  private logText!: Phaser.GameObjects.Text
  private alertText!: Phaser.GameObjects.Text
  private logLines: string[] = []

  constructor() {
    super({ key: 'CombatScene' })
  }

  // ─────────────────────────────────────────────
  create(): void {
    if (!RunState.hasInstance()) RunState.newRun()
    const run = RunState.getInstance()

    const player: Unit = {
      id: 'player',
      name: '전사',
      resource: { hp: run.hp, maxHp: run.maxHp, block: 0, energy: 3, maxEnergy: 3 },
      statuses: [],
      isAlive: true,
    }

    const data = this.scene.settings.data as { enemyId?: string } | undefined
    const enemyDef = getEnemyDef(data?.enemyId ?? 'goblin')
    const enemy: Unit = {
      id: `${enemyDef.id}_0`,
      name: enemyDef.name,
      resource: { hp: enemyDef.baseHp, maxHp: enemyDef.baseHp, block: 0, energy: 0, maxEnergy: 0 },
      statuses: [],
      isAlive: true,
    }

    // RunState의 덱을 얕은 복사로 전투에 사용
    const combatDeck: CardInstance[] = run.deck.map(c => ({ ...c }))

    const combatState: CombatState = {
      player,
      enemies: [enemy],
      piles: {
        draw: run.rngManager.get('CombatRNG').shuffle(combatDeck),
        hand: [], discard: [], exhaust: [],
      },
      turnCount: 0,
      isPlayerTurn: true,
    }

    this.manager = new CombatManager(combatState, run.rngManager)
    this.manager.registerEnemy(enemy.id, enemyDef.id)
    this.manager.onUpdate = () => this.refreshUI()

    // 유물 효과 등록
    const relicMgr = new RelicManager(this.manager.triggerBus)
    for (const relic of run.relics) {
      relicMgr.add(relic)
      relicMgr.registerEffect(relic.defId, this.manager)
    }

    // 배경
    this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e)
    this.add.line(640, 430, 0, 0, 1280, 0, 0x333355).setLineWidth(1)

    this.buildStaticUI()
    this.manager.startCombat()
    this.log('⚔ 전투 시작!')
  }

  // ─────────────────────────────────────────────
  //  정적 UI (한번만 생성)
  // ─────────────────────────────────────────────
  private buildStaticUI(): void {
    // 플레이어 HUD 컨테이너
    this.playerHud = this.add.container(30, 445)

    // 더미 카운트
    this.pileText = this.add.text(30, 700, '', { fontSize: '12px', color: '#888888' })

    // 턴 종료 버튼
    this.endTurnBtn = this.add
      .text(1200, 620, '턴 종료 [E]', {
        fontSize: '15px', color: '#ffffff',
        backgroundColor: '#334422', padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    this.endTurnBtn.on('pointerdown', () => { void this.handleEndTurn() })
    this.endTurnBtn.on('pointerover', () => this.endTurnBtn.setStyle({ backgroundColor: '#4a6630' }))
    this.endTurnBtn.on('pointerout', () => this.endTurnBtn.setStyle({ backgroundColor: '#334422' }))
    this.input.keyboard?.on('keydown-E', () => { void this.handleEndTurn() })

    // 전투 로그
    this.logText = this.add.text(870, 440, '', {
      fontSize: '11px', color: '#999999', wordWrap: { width: 370 },
    })

    // 알림 텍스트
    this.alertText = this.add
      .text(640, 390, '', { fontSize: '18px', color: '#ff6666', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0)
  }

  // ─────────────────────────────────────────────
  //  전체 UI 갱신
  // ─────────────────────────────────────────────
  private refreshUI(): void {
    this.refreshPlayerHud()
    this.refreshEnemies()
    this.refreshHand()
    this.refreshPileText()
    this.checkTransition()
  }

  // ── 플레이어 HUD ───────────────────────────
  private refreshPlayerHud(): void {
    this.playerHud.removeAll(true)
    const r = this.manager.state.player.resource

    // HP 바
    const bw = 200
    this.playerHud.add(this.add.rectangle(0, 0, bw, 16, 0x552222).setOrigin(0, 0.5))
    const hpFill = Math.max(0, r.hp / r.maxHp)
    this.playerHud.add(this.add.rectangle(0, 0, bw * hpFill, 16, 0xcc3333).setOrigin(0, 0.5))
    this.playerHud.add(
      this.add.text(bw / 2, 0, `HP ${r.hp} / ${r.maxHp}`, { fontSize: '12px', color: '#fff' }).setOrigin(0.5)
    )

    this.playerHud.add(
      this.add.text(0, 24, `🛡 방어도: ${r.block}`, { fontSize: '13px', color: '#88aaff' })
    )
    this.playerHud.add(
      this.add.text(0, 44, `⚡ 에너지: ${r.energy} / ${r.maxEnergy}`, {
        fontSize: '13px', color: r.energy > 0 ? '#ffdd44' : '#888888',
      })
    )

    const p = this.manager.state.player
    if (p.statuses.length > 0) {
      const str = p.statuses.map(s => `[${s.id} ${s.stacks}]`).join(' ')
      this.playerHud.add(this.add.text(0, 64, str, { fontSize: '10px', color: '#aaffaa' }))
    }

    this.playerHud.add(
      this.add.text(0, -20, '전사', { fontSize: '15px', color: '#fff', fontStyle: 'bold' })
    )
  }

  // ── 적 UI ────────────────────────────────
  private refreshEnemies(): void {
    for (const c of this.enemyContainers.values()) c.destroy()
    this.enemyContainers.clear()

    const alive = this.manager.state.enemies.filter(e => e.isAlive)
    const spacing = 1280 / (alive.length + 1)

    alive.forEach((enemy, i) => {
      const x = spacing * (i + 1)
      const container = this.buildEnemyView(enemy, x, 190)
      this.enemyContainers.set(enemy.id, container)
    })
  }

  private buildEnemyView(enemy: Unit, x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y)

    const defId = this.manager.getEnemyDefId(enemy.id)
    const isBoss = defId === 'guardian'
    const isElite = defId === 'bandit_leader'
    const theme = ENEMY_THEMES[defId] ?? { body: 0x1c2a38, head: 0x2a3a4a, stroke: 0x4477aa }

    const bodyW = isBoss ? 100 : isElite ? 88 : 74
    const bodyH = isBoss ? 96 : isElite ? 86 : 72
    const headR = isBoss ? 32 : isElite ? 28 : 24
    const headY = -(bodyH / 2 + headR - 6)

    const g = this.add.graphics()

    // 그림자
    g.fillStyle(0x000000, 0.2)
    g.fillEllipse(4, bodyH / 2 + 10, bodyW + 22, 14)

    // 몸통
    g.fillStyle(theme.body)
    g.fillRoundedRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 10)
    g.lineStyle(2, theme.stroke, 0.8)
    g.strokeRoundedRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 10)

    // 배 무늬 (간단한 장식)
    g.fillStyle(0xffffff, 0.05)
    g.fillRoundedRect(-bodyW / 2 + 8, -bodyH / 2 + 10, bodyW - 16, bodyH / 2, 6)

    // 머리
    g.fillStyle(theme.head)
    g.fillCircle(0, headY, headR)
    g.lineStyle(2, theme.stroke, 0.8)
    g.strokeCircle(0, headY, headR)

    // 눈
    const eyeOffX = headR * 0.35
    const eyeOffY = headY - headR * 0.1
    g.fillStyle(0xff3333)
    g.fillCircle(-eyeOffX, eyeOffY, 5)
    g.fillCircle(eyeOffX, eyeOffY, 5)
    g.fillStyle(0x000000)
    g.fillCircle(-eyeOffX, eyeOffY, 2)
    g.fillCircle(eyeOffX, eyeOffY, 2)

    c.add(g)

    // 의도 배너 (이름 위)
    const intent = this.manager.getNextEnemyIntent(enemy.id)
    if (intent) {
      const intentBg = this.add.graphics()
      intentBg.fillStyle(this.intentBgColor(intent.intent.type), 0.85)
      intentBg.fillRoundedRect(-46, headY - headR - 30, 92, 22, 5)
      c.add(intentBg)
      c.add(this.add.text(0, headY - headR - 19, this.intentLabel(intent), {
        fontSize: '12px', color: '#ffffff',
      }).setOrigin(0.5))
    }

    // 이름판
    const namePlateG = this.add.graphics()
    namePlateG.fillStyle(0x000000, 0.65)
    namePlateG.fillRoundedRect(-50, headY - headR - (intent ? 54 : 26), 100, 20, 4)
    c.add(namePlateG)
    c.add(this.add.text(0, headY - headR - (intent ? 43 : 15), enemy.name, {
      fontSize: '13px', color: isBoss ? '#ffaaaa' : '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5))

    // HP 바
    const bw = bodyW + 10
    const barY = bodyH / 2 + 12
    const hpG = this.add.graphics()
    hpG.fillStyle(0x331111)
    hpG.fillRoundedRect(-bw / 2, barY, bw, 12, 3)
    const hpRatio = Math.max(0, enemy.resource.hp / enemy.resource.maxHp)
    if (hpRatio > 0) {
      hpG.fillStyle(hpRatio > 0.5 ? 0x44bb44 : (hpRatio > 0.25 ? 0xbb8833 : 0xcc2222))
      hpG.fillRoundedRect(-bw / 2, barY, bw * hpRatio, 12, 3)
    }
    hpG.lineStyle(1, 0x442222, 0.6)
    hpG.strokeRoundedRect(-bw / 2, barY, bw, 12, 3)
    c.add(hpG)
    c.add(this.add.text(0, barY + 6, `${enemy.resource.hp} / ${enemy.resource.maxHp}`, {
      fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5))

    // 방어도 배지
    let extraY = barY + 18
    if (enemy.resource.block > 0) {
      const blockG = this.add.graphics()
      blockG.fillStyle(0x1a3388, 0.9)
      blockG.fillRoundedRect(-28, extraY, 56, 18, 5)
      c.add(blockG)
      c.add(this.add.text(0, extraY + 9, `🛡 ${enemy.resource.block}`, {
        fontSize: '11px', color: '#aaccff',
      }).setOrigin(0.5))
      extraY += 22
    }

    // 상태 이상
    if (enemy.statuses.length > 0) {
      const str = enemy.statuses.map(s => `${s.id}:${s.stacks}`).join(' ')
      c.add(this.add.text(0, extraY, str, {
        fontSize: '9px', color: '#ffaaaa',
      }).setOrigin(0.5, 0))
    }

    // 히트존 (클릭 영역)
    const hitH = bodyH + headR * 2 + 24
    const hitZone = this.add.zone(0, headY / 2, bodyW + 24, hitH)
      .setInteractive({ useHandCursor: true })

    // 하이라이트 오버레이 (타겟 모드)
    const hlG = this.add.graphics()
    hlG.setVisible(false)
    hitZone.on('pointerover', () => {
      if (this.needsEnemyTarget) {
        hlG.setVisible(true)
        hlG.clear()
        hlG.lineStyle(3, 0xff4444, 1.0)
        hlG.strokeRoundedRect(-bodyW / 2 - 3, -bodyH / 2 - 3, bodyW + 6, bodyH + 6, 10)
        hlG.strokeCircle(0, headY, headR + 3)
      }
    })
    hitZone.on('pointerout', () => hlG.setVisible(false))
    hitZone.on('pointerdown', () => this.handleEnemyClick(enemy.id))
    c.add(hlG)
    c.add(hitZone)

    return c
  }

  private intentBgColor(type: string): number {
    switch (type) {
      case 'ATTACK': return 0x881818
      case 'DEFEND': return 0x183466
      case 'BUFF':   return 0x185518
      case 'DEBUFF': return 0x554418
      default:       return 0x333333
    }
  }

  private intentLabel(intent: NonNullable<ReturnType<CombatManager['getNextEnemyIntent']>>): string {
    const v = intent.intent
    switch (v.type) {
      case 'ATTACK': return `⚔ ${v.value ?? 0}${v.times ? ` x${v.times}` : ''}`
      case 'DEFEND': return `🛡 방어`
      case 'BUFF':   return `✨ 강화`
      case 'DEBUFF': return `💀 디버프`
      default:       return `❓`
    }
  }

  // ── 손패 ─────────────────────────────────
  private refreshHand(): void {
    for (const c of this.handCards) c.destroy()
    this.handCards = []

    const hand = this.manager.state.piles.hand
    if (hand.length === 0) return

    const totalW = hand.length * (CARD_W + CARD_GAP) - CARD_GAP
    const startX = 640 - totalW / 2 + CARD_W / 2

    hand.forEach((inst, i) => {
      const x = startX + i * (CARD_W + CARD_GAP)
      this.handCards.push(this.buildCardView(inst, x, HAND_Y))
    })
  }

  private buildCardView(inst: CardInstance, x: number, y: number): Phaser.GameObjects.Container {
    const def = getCardDef(inst.defId)
    const selected = this.selectedCardId === inst.instanceId
    const canAfford = this.manager.energyManager.canAfford(this.manager.state.player, def.cost)
    const interactive = this.manager.state.isPlayerTurn && !this.manager.isProcessing

    const { container: c, hitArea } = buildCard(this, def, {
      width: CARD_W,
      height: CARD_H,
      isUpgraded: inst.isUpgraded,
      selected,
      dimmed: !canAfford,
    })
    c.setPosition(x, y)

    if (interactive) {
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on('pointerdown', () => this.handleCardClick(inst))
      hitArea.on('pointerover', () => { if (!selected) c.setY(y - 14) })
      hitArea.on('pointerout', () => c.setY(y))
    }

    return c
  }

  private refreshPileText(): void {
    const p = this.manager.state.piles
    this.pileText.setText(`드로우: ${p.draw.length}  버림: ${p.discard.length}  소멸: ${p.exhaust.length}`)
    const active = this.manager.state.isPlayerTurn && !this.manager.isProcessing
    this.endTurnBtn.setAlpha(active ? 1 : 0.4)
  }

  // ─────────────────────────────────────────────
  //  입력 처리
  // ─────────────────────────────────────────────
  private handleCardClick(inst: CardInstance): void {
    if (this.manager.isProcessing || !this.manager.state.isPlayerTurn) return
    const def = getCardDef(inst.defId)

    if (!this.manager.energyManager.canAfford(this.manager.state.player, def.cost)) {
      this.showAlert('에너지가 부족합니다!')
      return
    }

    // 같은 카드 재클릭 → 선택 해제
    if (this.selectedCardId === inst.instanceId) {
      this.selectedCardId = null
      this.needsEnemyTarget = false
      this.refreshHand()
      return
    }

    this.selectedCardId = inst.instanceId

    const needsTarget = def.actions.some(a => a.target === 'ENEMY_SINGLE')
    if (needsTarget) {
      const aliveEnemies = this.manager.state.enemies.filter(e => e.isAlive)
      if (aliveEnemies.length === 1) {
        void this.doPlayCard(inst, aliveEnemies[0].id)
        return
      }
      this.needsEnemyTarget = true
      this.refreshHand()
      this.log(`${def.name}: 대상을 선택하세요`)
      return
    }

    void this.doPlayCard(inst, undefined)
  }

  private handleEnemyClick(enemyId: string): void {
    if (!this.needsEnemyTarget || !this.selectedCardId) return
    const inst = this.manager.state.piles.hand.find(c => c.instanceId === this.selectedCardId)
    if (!inst) return
    void this.doPlayCard(inst, enemyId)
  }

  private async doPlayCard(inst: CardInstance, targetId: string | undefined): Promise<void> {
    const def = getCardDef(inst.defId)
    this.selectedCardId = null
    this.needsEnemyTarget = false
    this.log(`▶ ${def.name}`)
    const ok = await this.manager.playCard(inst, targetId)
    if (!ok) this.showAlert('카드를 사용할 수 없습니다.')
  }

  private async handleEndTurn(): Promise<void> {
    if (this.manager.isProcessing || !this.manager.state.isPlayerTurn) return
    this.selectedCardId = null
    this.needsEnemyTarget = false
    this.log(`── 턴 종료 (${this.manager.state.turnCount}턴) ──`)
    await this.manager.endTurn()
    if (this.manager.state.player.isAlive) this.log('── 플레이어 턴 ──')
  }

  // ─────────────────────────────────────────────
  //  알림 + 씬 전환
  // ─────────────────────────────────────────────
  private showAlert(msg: string): void {
    this.alertText.setText(msg).setAlpha(1)
    this.tweens.add({ targets: this.alertText, alpha: 0, duration: 1200, ease: 'Power2' })
  }

  log(msg: string): void {
    this.logLines.push(msg)
    if (this.logLines.length > 9) this.logLines.shift()
    this.logText?.setText(this.logLines.join('\n'))
  }

  private checkTransition(): void {
    const r = this.manager.checkVictory()
    if (r === 'PLAYER_WIN') {
      this.log('✅ 승리!')
      // RunState HP 동기화
      RunState.getInstance().hp = this.manager.state.player.resource.hp
      this.time.delayedCall(800, () => this.scene.start('RewardScene'))
    } else if (r === 'PLAYER_LOSE') {
      this.log('💀 패배...')
      this.time.delayedCall(800, () => this.scene.start('GameOverScene'))
    }
  }
}
