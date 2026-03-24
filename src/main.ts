import Phaser from 'phaser'
import { BootScene } from '@scenes/BootScene'
import { MainMenuScene } from '@scenes/MainMenuScene'
import { MapScene } from '@scenes/MapScene'
import { CombatScene } from '@scenes/CombatScene'
import { RewardScene } from '@scenes/RewardScene'
import { ShopScene } from '@scenes/ShopScene'
import { RestScene } from '@scenes/RestScene'
import { EventScene } from '@scenes/EventScene'
import { DeckViewerScene } from '@scenes/DeckViewerScene'
import { GameOverScene } from '@scenes/GameOverScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [
    BootScene,
    MainMenuScene,
    MapScene,
    CombatScene,
    RewardScene,
    ShopScene,
    RestScene,
    EventScene,
    DeckViewerScene,
    GameOverScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

new Phaser.Game(config)
