import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { SaveManager } from '@game/save/SaveManager'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  create(): void {
    const { width, height } = this.scale

    // 런 정보 추출 후 초기화
    let floor = 0
    let gold = 0
    let deckSize = 0

    if (RunState.hasInstance()) {
      const run = RunState.getInstance()
      floor = run.floor
      gold = run.gold
      deckSize = run.deck.length
      new SaveManager().clearRun()
      RunState.reset()
    }

    this.add.rectangle(width / 2, height / 2, width, height, 0x080808)
    this.add.circle(width / 2, height / 2 - 60, 160, 0x330000, 0.5)

    this.add.text(width / 2, height / 2 - 110, '💀', { fontSize: '60px' }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 30, '게임 오버', {
      fontSize: '44px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5)

    // 구분선
    const g = this.add.graphics()
    g.lineStyle(1, 0x442222, 0.8)
    g.lineBetween(width / 2 - 200, height / 2 + 28, width / 2 + 200, height / 2 + 28)

    // 실적
    const stats = [
      { label: '도달 층수', value: `${floor} 층` },
      { label: '남은 골드', value: `${gold} G` },
      { label: '덱 장수', value: `${deckSize} 장` },
    ]
    stats.forEach(({ label, value }, i) => {
      const y = height / 2 + 56 + i * 36
      this.add.text(width / 2 - 90, y, label, {
        fontSize: '17px', color: '#888888',
      }).setOrigin(1, 0.5)
      this.add.text(width / 2 - 70, y, value, {
        fontSize: '17px', color: '#ffffff',
      }).setOrigin(0, 0.5)
    })

    // 다시 시작
    const retryBtn = this.add.text(width / 2 - 90, height - 90, '다시 시작', {
      fontSize: '22px', color: '#aaffaa',
      backgroundColor: '#1a2e1a', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    retryBtn.on('pointerover', () => retryBtn.setStyle({ color: '#ffffff' }))
    retryBtn.on('pointerout', () => retryBtn.setStyle({ color: '#aaffaa' }))
    retryBtn.on('pointerdown', () => {
      RunState.newRun()
      this.scene.start('MapScene')
    })

    // 메인 메뉴
    const menuBtn = this.add.text(width / 2 + 90, height - 90, '메인 메뉴', {
      fontSize: '22px', color: '#aaaaaa',
      backgroundColor: '#1a1a1a', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    menuBtn.on('pointerover', () => menuBtn.setStyle({ color: '#ffffff' }))
    menuBtn.on('pointerout', () => menuBtn.setStyle({ color: '#aaaaaa' }))
    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'))
  }
}
