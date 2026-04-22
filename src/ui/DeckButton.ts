import Phaser from 'phaser'

/**
 * 어느 씬에서든 덱 뷰어 오버레이를 열 수 있는 '덱' 버튼을 우상단에 추가한다.
 */
export function addDeckButton(scene: Phaser.Scene): void {
  const { width } = scene.scale
  const btn = scene.add.text(width - 12, 12, '덱 보기', {
    fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#aaaaaa',
    backgroundColor: '#1a1a1a', padding: { x: 10, y: 6 },
  }).setOrigin(1, 0).setDepth(100).setInteractive({ useHandCursor: true })

  btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }))
  btn.on('pointerout', () => btn.setStyle({ color: '#aaaaaa' }))
  btn.on('pointerdown', () => {
    if (!scene.scene.isActive('DeckViewerScene')) {
      scene.scene.launch('DeckViewerScene')
    }
  })
}
