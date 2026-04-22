import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { starterEvents } from '@data/events/starterEvents'
import type { EventDef } from '@data/events/starterEvents'
import { addDeckButton } from '@ui/DeckButton'

export class EventScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EventScene' })
  }

  create(): void {
    if (!RunState.hasInstance()) {
      this.scene.start('MainMenuScene')
      return
    }
    const run = RunState.getInstance()
    const { width, height } = this.scale
    const lootRng = run.rngManager.get('LootRNG')

    this.add.rectangle(width / 2, height / 2, width, height, 0x080810)

    // 장식 테두리
    const g = this.add.graphics()
    g.lineStyle(2, 0x334466, 0.7)
    g.strokeRect(70, 60, width - 140, height - 120)
    g.lineStyle(1, 0x223355, 0.4)
    g.strokeRect(76, 66, width - 152, height - 132)

    const eventIdx = lootRng.nextInt(0, starterEvents.length - 1)
    const event = starterEvents[eventIdx]

    this.buildEventView(event, run, lootRng)
    addDeckButton(this)
  }

  private buildEventView(
    event: EventDef,
    run: RunState,
    lootRng: { nextInt: (min: number, max: number) => number }
  ): void {
    const { width } = this.scale

    // 제목
    this.add.text(width / 2, 110, event.title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '30px', color: '#ffddaa', fontStyle: 'bold',
    }).setOrigin(0.5)

    // 구분선
    const g2 = this.add.graphics()
    g2.lineStyle(1, 0x446688, 0.6)
    g2.lineBetween(120, 150, width - 120, 150)

    // 본문 텍스트
    this.add.text(width / 2, 175, event.flavor, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '17px', color: '#cccccc',
      wordWrap: { width: width - 250 }, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5, 0)

    // 선택지 버튼
    const btnStartY = 380
    const choiceObjects: Phaser.GameObjects.Text[] = []

    event.choices.forEach((choice, i) => {
      const disabled = choice.isDisabled(run)
      const btn = this.add.text(width / 2, btnStartY + i * 90, choice.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '19px',
        color: disabled ? '#444444' : '#eeeeee',
        backgroundColor: disabled ? '#0d0d0d' : '#1a1a2e',
        padding: { x: 30, y: 13 },
      }).setOrigin(0.5)

      choiceObjects.push(btn)

      if (!disabled) {
        btn.setInteractive({ useHandCursor: true })
        btn.on('pointerover', () => btn.setStyle({ color: '#ffddaa', backgroundColor: '#252545' }))
        btn.on('pointerout', () => btn.setStyle({ color: '#eeeeee', backgroundColor: '#1a1a2e' }))
        btn.on('pointerdown', () => {
          // 다른 버튼 비활성화
          for (const other of choiceObjects) {
            other.removeInteractive()
          }
          const result = choice.apply(run, lootRng)
          this.showResult(result)
        })
      }

      // 설명
      this.add.text(width / 2, btnStartY + i * 90 + 30, choice.detail, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#556677',
      }).setOrigin(0.5, 0)
    })
  }

  private showResult(message: string): void {
    const { width, height } = this.scale

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88)
      .setInteractive()

    // 결과 패널
    this.add.rectangle(width / 2, height / 2 - 30, width - 200, 160, 0x111122)
      .setStrokeStyle(1, 0x334466)

    this.add.text(width / 2, height / 2 - 30, message, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffffff',
      wordWrap: { width: width - 260 }, align: 'center', lineSpacing: 10,
    }).setOrigin(0.5)

    const continueBtn = this.add.text(width / 2, height / 2 + 90, '계속하기', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#aaaaaa',
      backgroundColor: '#1a1a1a', padding: { x: 28, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    continueBtn.on('pointerover', () => continueBtn.setStyle({ color: '#ffffff' }))
    continueBtn.on('pointerout', () => continueBtn.setStyle({ color: '#aaaaaa' }))
    continueBtn.on('pointerdown', () => this.scene.start('MapScene'))

    // overlay 클릭 시에도 계속 (UX 편의)
    overlay.on('pointerdown', () => this.scene.start('MapScene'))
  }
}
