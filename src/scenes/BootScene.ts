import Phaser from 'phaser'
import atImg from '@ui/img/at.png'
import skImg from '@ui/img/sk.png'
import pwImg from '@ui/img/pw.png'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    this.load.image('card_at', atImg)
    this.load.image('card_sk', skImg)
    this.load.image('card_pw', pwImg)
  }

  create(): void {
    this.scene.start('MainMenuScene')
  }
}
