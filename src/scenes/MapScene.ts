import Phaser from 'phaser'
import type { MapNode } from '@t/map.types'
import { RunState } from '@game/RunState'
import { SaveManager } from '@game/save/SaveManager'
import { addDeckButton } from '@ui/DeckButton'

const COMBAT_ENEMIES = ['goblin', 'lancer', 'cultist', 'jaw_worm', 'louse']
const ELITE_ENEMY = 'bandit_leader'
const BOSS_ENEMY = 'guardian'

// 노드 y(720~45) → 화면 y(660~60) 변환
const toDisplayY = (nodeY: number) => 60 + ((nodeY - 45) / 675) * 600

// 노드 타입별 색상 & 아이콘
const NODE_STYLE: Record<string, { color: number; icon: string; glowColor: number }> = {
  COMBAT:   { color: 0xaa2222, icon: '⚔',  glowColor: 0xff4444 },
  ELITE:    { color: 0xb85500, icon: '★',  glowColor: 0xff8800 },
  BOSS:     { color: 0xcc1122, icon: '💀', glowColor: 0xff2244 },
  EVENT:    { color: 0x2255bb, icon: '?',  glowColor: 0x4488ff },
  SHOP:     { color: 0xaa8800, icon: 'G',  glowColor: 0xffdd00 },
  REST:     { color: 0x228844, icon: '♨',  glowColor: 0x44ff88 },
  TREASURE: { color: 0x997700, icon: '✦',  glowColor: 0xffee44 },
}

const NODE_LABELS: Record<string, string> = {
  COMBAT: '전투', ELITE: '엘리트', BOSS: '보스',
  EVENT: '이벤트', SHOP: '상점', REST: '휴식', TREASURE: '보물',
}

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' })
  }

  create(): void {
    if (!RunState.hasInstance()) RunState.newRun()
    const run = RunState.getInstance()
    const { mapState } = run
    const lootRng = run.rngManager.get('LootRNG')
    const pickEnemy = () => lootRng.pick(COMBAT_ENEMIES)
    const { width, height } = this.scale

    // ── 배경 ────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, 0x080c18)

    // 별 배경 (장식용 - 시각적으로만 사용)
    const starG = this.add.graphics()
    for (let i = 0; i < 90; i++) {
      const sx = (i * 137.508 * 13) % width           // 황금각 기반 분산
      const sy = (i * 97.317 * 7 + i * 31) % height
      const brightness = 0.15 + (i % 5) * 0.08
      const size = i % 7 === 0 ? 1.5 : 0.8
      starG.fillStyle(0xffffff, brightness)
      starG.fillCircle(sx, sy, size)
    }

    // 안개 그라데이션 (하단으로 갈수록 밝아짐)
    const fogG = this.add.graphics()
    fogG.fillGradientStyle(0x0a1030, 0x0a1030, 0x0e1840, 0x0e1840, 0.4)
    fogG.fillRect(0, 0, width, height)

    // ── 상단 HUD ────────────────────────────────────
    this.buildHUD(run)

    // ── 연결선 ──────────────────────────────────────
    const nodeMap = new Map(mapState.nodes.map(n => [n.id, n]))
    const lineG = this.add.graphics()

    for (const node of mapState.nodes) {
      const dy = toDisplayY(node.position.y)
      for (const connId of node.connectionIds) {
        const target = nodeMap.get(connId)
        if (!target) continue
        const tdy = toDisplayY(target.position.y)

        if (node.isVisited) {
          lineG.lineStyle(2.5, 0x3366cc, 0.7)
        } else {
          lineG.lineStyle(1.5, 0x1c2d44, 0.6)
        }
        lineG.lineBetween(node.position.x, dy, target.position.x, tdy)
      }
    }

    // ── 노드 렌더링 ─────────────────────────────────
    for (const node of mapState.nodes) {
      this.buildNodeView(node, run, pickEnemy)
    }

    // ── 범례 (하단) ─────────────────────────────────
    this.buildLegend()

    addDeckButton(this)
  }

  // ── HUD ─────────────────────────────────────────
  private buildHUD(run: RunState): void {
    const { width } = this.scale

    // HUD 배경 바
    const hudG = this.add.graphics()
    hudG.fillStyle(0x000000, 0.55)
    hudG.fillRect(0, 0, width, 56)
    hudG.lineStyle(1, 0x223355, 0.6)
    hudG.lineBetween(0, 56, width, 56)

    // 층수 (중앙)
    this.add.text(width / 2, 14, `층  ${run.floor} / 15`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#9999cc', fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    // HP 바 (좌측)
    const hpBarW = 160
    const hpRatio = Math.max(0, run.hp / run.maxHp)
    const hpG = this.add.graphics()
    hpG.fillStyle(0x441111)
    hpG.fillRoundedRect(12, 10, hpBarW, 14, 3)
    hpG.fillStyle(hpRatio > 0.5 ? 0xcc3333 : (hpRatio > 0.25 ? 0xcc8822 : 0xff2222))
    hpG.fillRoundedRect(12, 10, hpBarW * hpRatio, 14, 3)
    hpG.lineStyle(1, 0x552222, 0.8)
    hpG.strokeRoundedRect(12, 10, hpBarW, 14, 3)
    this.add.text(12 + hpBarW / 2, 10, `HP  ${run.hp} / ${run.maxHp}`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffaaaa',
    }).setOrigin(0.5, 0)

    // 골드 (HP 바 오른쪽)
    this.add.text(185, 14, `💰 ${run.gold} G`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#ffcc44',
    }).setOrigin(0, 0)

    // 유물 (중앙 아래)
    const relicNames = run.relics.map(r => r.defId).join('  ·  ')
    if (relicNames) {
      this.add.text(width / 2, 34, `유물: ${relicNames}`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8888bb',
      }).setOrigin(0.5, 0)
    }
  }

  // ── 노드 뷰 ─────────────────────────────────────
  private buildNodeView(node: MapNode, run: RunState, pickEnemy: () => string): void {
    const x = node.position.x
    const dy = toDisplayY(node.position.y)
    const isCurrent = node.isVisited && node.id === run.mapState.currentNodeId
    const isAccessible = node.isAccessible && !node.isVisited
    const isVisited = node.isVisited && !isCurrent

    const style = NODE_STYLE[node.type] ?? { color: 0x888888, icon: '?', glowColor: 0xaaaaaa }
    const isBoss = node.type === 'BOSS'
    const isElite = node.type === 'ELITE'
    const radius = isBoss ? 26 : isCurrent ? 22 : 18

    const alpha = isVisited ? 0.28 : isAccessible ? 1.0 : isCurrent ? 1.0 : 0.38

    const g = this.add.graphics()

    if (isBoss && isAccessible) {
      // 보스: 외부 빛나는 링
      g.lineStyle(3, style.glowColor, 0.4)
      g.strokeCircle(x, dy, radius + 8)
      g.lineStyle(1.5, style.glowColor, 0.2)
      g.strokeCircle(x, dy, radius + 14)
    }

    if (isCurrent) {
      // 현재 위치 표시: 흰 외곽 링
      g.lineStyle(3, 0xffffff, 0.6)
      g.strokeCircle(x, dy, radius + 4)
    }

    if (isElite) {
      // 엘리트: 마름모 모양
      const s = radius
      g.fillStyle(style.color, alpha)
      g.fillPoints([
        new Phaser.Geom.Point(x, dy - s - 2),
        new Phaser.Geom.Point(x + s + 2, dy),
        new Phaser.Geom.Point(x, dy + s + 2),
        new Phaser.Geom.Point(x - s - 2, dy),
      ], true)
      if (isAccessible) {
        g.lineStyle(2, 0xffa844, 0.9)
        g.strokePoints([
          new Phaser.Geom.Point(x, dy - s - 2),
          new Phaser.Geom.Point(x + s + 2, dy),
          new Phaser.Geom.Point(x, dy + s + 2),
          new Phaser.Geom.Point(x - s - 2, dy),
        ], true)
      }
    } else {
      // 일반 원형 노드
      g.fillStyle(style.color, alpha)
      g.fillCircle(x, dy, radius)

      if (isAccessible) {
        g.lineStyle(2.5, 0x88ff88, 0.9)
        g.strokeCircle(x, dy, radius)
      } else if (isCurrent) {
        g.lineStyle(2.5, 0xffffff, 0.8)
        g.strokeCircle(x, dy, radius)
      } else if (!isVisited) {
        g.lineStyle(1, style.color, 0.5)
        g.strokeCircle(x, dy, radius)
      }
    }

    // 아이콘 텍스트
    const iconColor = isVisited ? '#444466' : '#ffffff'
    this.add.text(x, dy, style.icon, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: `${isBoss ? 16 : 13}px`, color: iconColor,
    }).setOrigin(0.5)

    // 노드 라벨 (아래)
    this.add.text(x, dy + radius + 5, NODE_LABELS[node.type] ?? node.type, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: isAccessible ? '#ddddff' : (isVisited ? '#334455' : '#556677'),
    }).setOrigin(0.5, 0)

    // 접근 가능한 노드: 클릭 영역 + 펄스 애니메이션
    if (isAccessible) {
      const hitZone = this.add.zone(x, dy, (radius + 4) * 2, (radius + 4) * 2)
        .setInteractive({ useHandCursor: true })
      hitZone.on('pointerover', () => {
        g.clear()
        g.fillStyle(style.color, 1.0)
        if (isElite) {
          const s = radius + 2
          g.fillPoints([
            new Phaser.Geom.Point(x, dy - s - 2),
            new Phaser.Geom.Point(x + s + 2, dy),
            new Phaser.Geom.Point(x, dy + s + 2),
            new Phaser.Geom.Point(x - s - 2, dy),
          ], true)
          g.lineStyle(2.5, 0xffffff, 1.0)
          g.strokePoints([
            new Phaser.Geom.Point(x, dy - s - 2),
            new Phaser.Geom.Point(x + s + 2, dy),
            new Phaser.Geom.Point(x, dy + s + 2),
            new Phaser.Geom.Point(x - s - 2, dy),
          ], true)
        } else {
          g.fillCircle(x, dy, radius + 2)
          g.lineStyle(2.5, 0xffffff, 1.0)
          g.strokeCircle(x, dy, radius + 2)
        }
      })
      hitZone.on('pointerout', () => {
        g.clear()
        g.fillStyle(style.color, 1.0)
        if (isElite) {
          const s = radius
          g.fillPoints([
            new Phaser.Geom.Point(x, dy - s - 2),
            new Phaser.Geom.Point(x + s + 2, dy),
            new Phaser.Geom.Point(x, dy + s + 2),
            new Phaser.Geom.Point(x - s - 2, dy),
          ], true)
          g.lineStyle(2, 0xffa844, 0.9)
          g.strokePoints([
            new Phaser.Geom.Point(x, dy - s - 2),
            new Phaser.Geom.Point(x + s + 2, dy),
            new Phaser.Geom.Point(x, dy + s + 2),
            new Phaser.Geom.Point(x - s - 2, dy),
          ], true)
        } else {
          g.fillCircle(x, dy, radius)
          g.lineStyle(2.5, 0x88ff88, 0.9)
          g.strokeCircle(x, dy, radius)
        }
      })
      hitZone.on('pointerdown', () => this.selectNode(node, run, pickEnemy))

      // 펄스 트윈 (접근 가능 노드에만)
      this.tweens.add({
        targets: g,
        alpha: { from: 0.85, to: 1.0 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  // ── 범례 ────────────────────────────────────────
  private buildLegend(): void {
    const { width, height } = this.scale
    const legendG = this.add.graphics()
    legendG.fillStyle(0x000000, 0.4)
    legendG.fillRect(0, height - 28, width, 28)

    const items = Object.entries(NODE_STYLE).map(([type, s]) => ({
      color: s.color, label: NODE_LABELS[type] ?? type,
    }))

    const spacing = width / items.length
    items.forEach((item, i) => {
      const lx = spacing * i + spacing / 2
      const ly = height - 14
      const cG = this.add.graphics()
      cG.fillStyle(item.color, 0.9)
      cG.fillCircle(lx - 24, ly, 5)
      this.add.text(lx - 16, ly, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#aaaaaa',
      }).setOrigin(0, 0.5)
    })
  }

  // ── 노드 선택 ────────────────────────────────────
  private selectNode(node: MapNode, run: RunState, pickEnemy: () => string): void {
    run.visitNode(node.id)
    new SaveManager().saveRun(run.serialize())
    switch (node.type) {
      case 'COMBAT':
        this.scene.start('CombatScene', { enemyId: pickEnemy(), nodeId: node.id })
        break
      case 'ELITE':
        this.scene.start('CombatScene', { enemyId: ELITE_ENEMY, nodeId: node.id })
        break
      case 'BOSS':
        this.scene.start('CombatScene', { enemyId: BOSS_ENEMY, nodeId: node.id })
        break
      case 'REST':
        this.scene.start('RestScene')
        break
      case 'SHOP':
        this.scene.start('ShopScene')
        break
      case 'EVENT':
        this.scene.start('EventScene')
        break
      default:
        // TODO: TREASURE 전용 씬
        this.scene.restart()
        break
    }
  }
}
