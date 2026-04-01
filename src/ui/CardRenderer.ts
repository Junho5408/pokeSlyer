import Phaser from 'phaser'
import type { CardDef } from '@t/card.types'

// ── 이미지가 없는 타입용 폴백 색상 ──────────────────────────
const BASE_COLORS: Record<string, { dark: number; mid: number; accent: number }> = {
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

// 카드 이미지가 있는 타입 (이미지가 곧 카드 프레임)
const TYPE_TEXTURES: Record<string, string> = {
  ATTACK: 'card_at',
  SKILL:  'card_sk',
  POWER:  'card_pw',
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
  const left = -w / 2
  const top = -h / 2
  const bot = h / 2

  const texKey = TYPE_TEXTURES[def.type]
  const hasImage = !!(texKey && scene.textures.exists(texKey))

  if (hasImage) {
    // ── 이미지가 카드 자체 ────────────────────────────────
    const img = scene.add.image(0, 0, texKey)
    img.setDisplaySize(w, h)
    if (dimmed) img.setAlpha(0.45)
    c.add(img)

    // 마나 코스트 (좌상단 엠블럼 위)
    const costX = left + w * 0.145
    const costY = top + h * 0.11
    c.add(scene.add.text(costX, costY, String(def.cost), {
      fontSize: `${Math.round(w * 0.13)}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(w * 0.03),
    }).setOrigin(0.5))

    // 카드 이름 (하단 텍스트 영역 상단)
    const displayName = isUpgraded ? `${def.name}+` : def.name
    const nameY = h * 0.16
    c.add(scene.add.text(0, nameY, displayName, {
      fontSize: `${Math.max(9, Math.round(w * 0.09))}px`,
      color: isUpgraded ? '#884400' : '#1a0a00',
      fontStyle: 'bold',
      wordWrap: { width: w * 0.68 },
      align: 'center',
    }).setOrigin(0.5, 0))

    // 효과 설명 (이름 아래)
    const desc = isUpgraded ? (def.upgradedDescription ?? def.description) : def.description
    const descY = h * 0.27
    c.add(scene.add.text(0, descY, desc, {
      fontSize: `${Math.max(7, Math.round(w * 0.072))}px`,
      color: '#2a1500',
      wordWrap: { width: w * 0.68 },
      align: 'center',
    }).setOrigin(0.5, 0))

    // 선택/강화 외곽선
    if (selected || isUpgraded) {
      const borderG = scene.add.graphics()
      const borderColor = selected ? 0xffdd44 : 0x88aaff
      borderG.lineStyle(selected ? 3 : 2, borderColor, dimmed ? 0.2 : 1.0)
      borderG.strokeRoundedRect(left, top, w, h, 8)
      c.add(borderG)
    }

  } else {
    // ── 폴백: STATUS / CURSE (이미지 없음) ──────────────────
    const col = BASE_COLORS[def.type] ?? BASE_COLORS.STATUS
    const headerH = Math.round(h * 0.165)
    const artTop = top + headerH + 2
    const artH = Math.round(h * 0.28)
    const contentTop = artTop + artH + 5

    const g = scene.add.graphics()

    g.fillStyle(0x000000, 0.35)
    g.fillRoundedRect(left + 3, top + 3, w, h, 9)

    g.fillStyle(col.mid)
    g.fillRoundedRect(left, top, w, h, 8)

    g.fillStyle(col.dark, 0.9)
    g.fillRoundedRect(left, top, w, headerH, { tl: 8, tr: 8, bl: 0, br: 0 })

    g.fillStyle(col.accent, 0.15)
    g.fillRoundedRect(left + 6, artTop, w - 12, artH, 4)

    g.lineStyle(1, 0x334466, 0.4)
    g.lineBetween(left + 8, artTop + artH + 2, left + w - 8, artTop + artH + 2)

    const rarityColor = RARITY_COLORS[def.rarity] ?? 0x888888
    g.fillStyle(rarityColor, 0.85)
    g.fillRoundedRect(left + 8, bot - 10, w - 16, 5, 2)

    const borderColor = selected ? 0xffdd44 : (isUpgraded ? 0x88aaff : 0x446688)
    g.lineStyle(selected ? 2.5 : 1.5, borderColor, dimmed ? 0.25 : 0.9)
    g.strokeRoundedRect(left, top, w, h, 8)

    c.add(g)

    // 마나 보석
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

    c.add(scene.add.text(left + w - 5, top + 5, TYPE_LABELS[def.type] ?? def.type, {
      fontSize: `${Math.max(8, Math.round(w * 0.075))}px`, color: '#8899bb',
    }).setOrigin(1, 0))

    const displayName = isUpgraded ? `${def.name}+` : def.name
    c.add(scene.add.text(0, contentTop, displayName, {
      fontSize: `${Math.max(10, Math.round(w * 0.1))}px`,
      color: isUpgraded ? '#ffdd88' : '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: w - 14 },
      align: 'center',
    }).setOrigin(0.5, 0))

    const desc = isUpgraded ? (def.upgradedDescription ?? def.description) : def.description
    c.add(scene.add.text(0, contentTop + Math.round(h * 0.13), desc, {
      fontSize: `${Math.max(8, Math.round(w * 0.075))}px`,
      color: '#ccccdd',
      wordWrap: { width: w - 16 },
      align: 'center',
    }).setOrigin(0.5, 0))
  }

  // ── 구매 가격 ──────────────────────────────────────────
  if (opts.showPrice !== undefined) {
    c.add(scene.add.text(0, bot + Math.round(h * 0.1), `${opts.showPrice}G`, {
      fontSize: `${Math.max(12, Math.round(w * 0.115))}px`,
      color: dimmed ? '#665522' : '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5))
  }

  // ── 어둡게 처리 오버레이 ───────────────────────────────
  if (dimmed) {
    const dimG = scene.add.graphics()
    dimG.fillStyle(0x000000, 0.55)
    dimG.fillRoundedRect(left, top, w, h, 8)
    c.add(dimG)
  }

  // ── 투명 히트 영역 ─────────────────────────────────────
  const hitArea = scene.add.rectangle(0, 0, w, h, 0x000000, 0)
  c.add(hitArea)

  return { container: c, hitArea }
}
