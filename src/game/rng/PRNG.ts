/**
 * Mulberry32 알고리즘 기반 결정론적 PRNG.
 * 동일 시드 -> 동일 결과 보장 (재현성).
 */
export class PRNG {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let z = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)]
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  getState(): number {
    return this.state
  }

  setState(state: number): void {
    this.state = state >>> 0
  }
}
