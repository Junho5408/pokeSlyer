import Phaser from 'phaser'
import { RunState } from '@game/RunState'
import { SaveManager } from '@game/save/SaveManager'

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create(): void {
    const { width, height } = this.scale
    const saveManager = new SaveManager()
    const existingSave = saveManager.loadRun()

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a18)

    this.add.text(width / 2, height / 2 - 100, 'pokeSlyer', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '52px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 46, '덱빌딩 로그라이크', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '16px', color: '#555577',
    }).setOrigin(0.5)

    const btnY = existingSave ? height / 2 + 10 : height / 2 + 20

    // 새 게임
    const startBtn = this.add.text(width / 2, btnY, '새 게임 시작', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '26px', color: '#aaffaa',
      backgroundColor: '#1a2e1a', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    startBtn.on('pointerover', () => startBtn.setStyle({ color: '#ffffff' }))
    startBtn.on('pointerout', () => startBtn.setStyle({ color: '#aaffaa' }))
    startBtn.on('pointerdown', () => {
      saveManager.clearRun()
      RunState.newRun()
      this.scene.start('MapScene')
    })

    // 이어하기 (저장 데이터가 있을 때만)
    if (existingSave) {
      const continueBtn = this.add.text(width / 2, btnY + 68, `이어하기  (${existingSave.floor}층)`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '26px', color: '#aaaaff',
        backgroundColor: '#1a1a2e', padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      continueBtn.on('pointerover', () => continueBtn.setStyle({ color: '#ffffff' }))
      continueBtn.on('pointerout', () => continueBtn.setStyle({ color: '#aaaaff' }))
      continueBtn.on('pointerdown', () => {
        RunState.fromSaveData(existingSave)
        this.scene.start('MapScene')
      })
    }
  }
}
