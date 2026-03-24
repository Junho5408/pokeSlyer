import type { DeckPiles, CardInstance } from '@t/index'
import type { PRNG } from '@game/rng/PRNG'
import { getCardDef } from '@data/cards/index'

export class DeckManager {
  constructor(private readonly piles: DeckPiles) {}

  draw(count: number, rng: PRNG): CardInstance[] {
    const drawn: CardInstance[] = []
    for (let i = 0; i < count; i++) {
      if (this.piles.draw.length === 0) {
        if (this.piles.discard.length === 0) break
        this.piles.draw = rng.shuffle(this.piles.discard)
        this.piles.discard = []
      }
      const card = this.piles.draw.pop()
      if (card) drawn.push(card)
    }
    return drawn
  }

  addToHand(cards: CardInstance[]): void {
    this.piles.hand.push(...cards)
  }

  discard(cards: CardInstance[]): void {
    this.piles.discard.push(...cards)
  }

  exhaust(card: CardInstance): void {
    this.piles.exhaust.push(card)
  }

  discardHand(): void {
    const retained: CardInstance[] = []
    const discarded: CardInstance[] = []
    for (const card of this.piles.hand) {
      const def = getCardDef(card.defId)
      if (def.isRetain) {
        retained.push(card)
      } else if (def.isEthereal) {
        this.piles.exhaust.push(card)
      } else {
        discarded.push(card)
      }
    }
    this.piles.discard.push(...discarded)
    this.piles.hand = retained
  }

  removeFromHand(instanceId: string): CardInstance | undefined {
    const idx = this.piles.hand.findIndex(c => c.instanceId === instanceId)
    if (idx === -1) return undefined
    return this.piles.hand.splice(idx, 1)[0]
  }
}
