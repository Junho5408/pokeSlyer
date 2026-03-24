import Phaser from 'phaser'
import type { CardDef } from '@t/card.types'

// ── 색상 테마 ──────────────────────────────────────────
const BASE_COLORS: Record<string, { dark: number; mid: number; accent: number }> = {
  ATTACK: { dark: 0x1e0608, mid: 0x5a1318, accent: 0x993333 },
  SKILL:  { dark: 0x06081e, mid: 0x131858, accent: 0x2244aa },
  POWER:  { dark: 0x10061e, mid: 0x341460, accent: 0x6633aa },
  STATUS: { dark: 0x111111, mid: 0x2d2d2d, accent: 0x555555 },
  CURSE:  { dark: 0x060606, mid: 0x101010, accent: 0x222222 },
}

const RARITY_COLORS: Record<string, number> = {
  STARTER: 0x666666,
  COMMON:  0x888888,
  UNCOMMON:0x3399ee,
  RARE:    0xff9933,
  SPECIAL: 0xaa44ff,
  CURSE:   0x336633,
}

const TYPE_LABELS: Record<string, string> = {
  ATTACK: '공격', SKILL: '기술', POWER: '파워', STATUS: '상태', CURSE: '저주',
}

export interface CardRenderOptions {
  width?: number
  height?: number
  isUpgraded?: boolean
  selected?: boolean
  dimmed?: boolean
  showPrice?: number
}

export interface CardRenderResult {
  container: Phaser.GameObjects.Container
  hitArea: Phaser.GameObjects.Rectangle
}

export function buildCard(
  scene: Phaser.Scene,
  def: CardDef,
  opts: CardRenderOptions = {}
): CardRenderResult {
  const w = opts.width ?? 120
  const h = opts.height ?? 160
  const isUpgraded = opts.isUpgraded ?? false
  const selected = opts.selected ?? false
  const dimmed = opts.dimmed ?? false

  const c = scene.add.container(0, 0)
  const col = BASE_COLORS[def.type] ?? BASE_COLORS.STATUS

  // 비율 기반 y 좌표
  const top = -h / 2
  const bot = h / 2
  const left = -w / 2
  const headerH = Math.round(h * 0.165)       // 헤더 높이
  const artTop = top + headerH + 2
  const artH = Math.round(h * 0.28)           // 아트 영역 높이
  const contentTop = artTop + artH + 5

  // ── 그래픽 레이어 ──────────────────────────────────
  const g = scene.add.graphics()

  // 그림자
  g.fillStyle(0x000000, 0.35)
  g.fillRoundedRect(left + 3, top + 3, w, h, 9)

  // 카드 기본 배경
  g.fillStyle(col.mid)
  g.fillRoundedRect(left, top, w, h, 8)

  // 헤더 영역 (타입 표시 위 어두운 배경)
  g.fillStyle(col.dark, 0.9)
  g.fillRoundedRect(left, top, w, headerH, { tl: 8, tr: 8, bl: 0, br: 0 })

  // 아트 플레이스홀더 영역
  g.fillStyle(col.accent, 0.15)
  g.fillRoundedRect(left + 6, artTop, w - 12, artH, 4)
  g.fillStyle(0xffffff, 0.04)
  g.fillRoundedRect(left + 6, artTop, w - 12, Math.round(artH * 0.3), { tl: 4, tr: 4, bl: 0, br: 0 })

  // 본문 구분선
  g.lineStyle(1, 0x334466, 0.4)
  g.lineBetween(left + 8, artTop + artH + 2, left + w - 8, artTop + artH + 2)

  // 희귀도 바
  const rarityColor = RARITY_COLORS[def.rarity] ?? 0x888888
  g.fillStyle(rarityColor, 0.85)
  g.fillRoundedRect(left + 8, bot - 10, w - 16, 5, 2)

  // 외곽선
  const borderColor = selected ? 0xffdd44 : (isUpgraded ? 0x88aaff : 0x446688)
  g.lineStyle(selected ? 2.5 : 1.5, borderColor, dimmed ? 0.25 : 0.9)
  g.strokeRoundedRect(left, top, w, h, 8)

  c.add(g)

  // ── 마나 보석 ──────────────────────────────────────
  const gemG = scene.add.graphics()
  const gemR = Math.round(w * 0.115)
  const gemX = left + gemR + 4
  const gemY = top + gemR + 4
  gemG.fillStyle(0x0a0a24)
  gemG.fillCircle(gemX, gemY, gemR)
  gemG.lineStyle(1.5, 0x4466aa)
  gemG.strokeCircle(gemX, gemY, gemR)
  c.add(gemG)

  c.add(scene.add.text(gemX, gemY, String(def.cost), {
    fontSize: `${Math.round(w * 0.11)}px`, color: '#ffdd44', fontStyle: 'bold',
  }).setOrigin(0.5))

  // ── 타입 라벨 (헤더 우측) ───────────────────────────
  c.add(scene.add.text(left + w - 5, top + 5, TYPE_LABELS[def.type] ?? def.type, {
    fontSize: `${Math.max(8, Math.round(w * 0.075))}px`, color: '#8899bb',
  }).setOrigin(1, 0))

  // ── 카드 이름 ──────────────────────────────────────
  const displayName = isUpgraded ? `${def.name}+` : def.name
  c.add(scene.add.text(0, contentTop, displayName, {
    fontSize: `${Math.max(10, Math.round(w * 0.1))}px`,
    color: isUpgraded ? '#ffdd88' : '#ffffff',
    fontStyle: 'bold',
    wordWrap: { width: w - 14 },
    align: 'center',
  }).setOrigin(0.5, 0))

  // ── 효과 설명 ──────────────────────────────────────
  const desc = isUpgraded ? (def.upgradedDescription ?? def.description) : def.description
  c.add(scene.add.text(0, contentTop + Math.round(h * 0.13), desc, {
    fontSize: `${Math.max(8, Math.round(w * 0.075))}px`,
    color: '#ccccdd',
    wordWrap: { width: w - 16 },
    align: 'center',
  }).setOrigin(0.5, 0))

  // ── 구매 가격 ──────────────────────────────────────
  if (opts.showPrice !== undefined) {
    c.add(scene.add.text(0, bot + Math.round(h * 0.1), `${opts.showPrice}G`, {
      fontSize: `${Math.max(12, Math.round(w * 0.115))}px`,
      color: dimmed ? '#665522' : '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5))
  }

  // ── 어둡게 처리 오버레이 ──────────────────────────────
  if (dimmed) {
    const dimG = scene.add.graphics()
    dimG.fillStyle(0x000000, 0.55)
    dimG.fillRoundedRect(left, top, w, h, 8)
    c.add(dimG)
  }

  // ── 투명 히트 영역 (인터랙션용) ───────────────────────
  const hitArea = scene.add.rectangle(0, 0, w, h, 0x000000, 0)
  c.add(hitArea)

  return { container: c, hitArea }
}
