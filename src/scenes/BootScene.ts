import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // TODO: 에셋 로드
    // this.load.image('card_back', 'assets/images/cards/back.png')
  }

  create(): void {
    this.scene.start('MainMenuScene')
  }
}
