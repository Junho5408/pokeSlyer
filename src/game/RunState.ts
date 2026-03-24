import type { CardInstance } from '@t/card.types'
import type { RelicInstance } from '@t/relic.types'
import type { MapState } from '@t/map.types'
import type { RunSaveData } from '@t/save.types'
import { MapGenerator } from '@game/map/MapGenerator'
import { RNGManager } from '@game/rng/RNGManager'

/** 진행 중인 런의 영속 상태. 씬 간 공유. */
export class RunState {
  private static _instance: RunState | null = null

  seed: number
  floor: number
  hp: number
  maxHp: number
  gold: number
  deck: CardInstance[]
  relics: RelicInstance[]
  potions: string[]
  mapState: MapState
  rngManager: RNGManager

  private constructor(seed: number) {
    this.seed = seed
    this.floor = 0
    this.hp = 75
    this.maxHp = 75
    this.gold = 99
    this.deck = RunState.buildStarterDeck()
    this.relics = [{ defId: 'burning_blood', counter: 0 }]
    this.potions = []
    this.rngManager = new RNGManager(seed)
    this.mapState = new MapGenerator().generate(this.rngManager.get('MapRNG'))
  }

  static getInstance(): RunState {
    if (!RunState._instance) throw new Error('RunState not initialized. Call RunState.newRun() first.')
    return RunState._instance
  }

  static newRun(seed?: number): RunState {
    RunState._instance = new RunState(seed ?? Date.now())
    return RunState._instance
  }

  static hasInstance(): boolean {
    return RunState._instance !== null
  }

  static reset(): void {
    RunState._instance = null
  }

  private static buildStarterDeck(): CardInstance[] {
    const deck: CardInstance[] = []
    let idx = 0
    const add = (defId: string, count: number) => {
      for (let i = 0; i < count; i++) {
        deck.push({ instanceId: `init_${idx++}`, defId, isUpgraded: false })
      }
    }
    add('strike', 5)
    add('defend', 4)
    return deck
  }

  /** 노드를 방문하고 다음 접근 가능 노드를 갱신한다. */
  visitNode(nodeId: string): void {
    const node = this.mapState.nodes.find(n => n.id === nodeId)
    if (!node) return
    node.isVisited = true
    this.mapState.currentNodeId = nodeId
    this.floor = node.floor
    for (const n of this.mapState.nodes) {
      n.isAccessible = node.connectionIds.includes(n.id)
    }
  }

  addCardToDeck(defId: string): void {
    this.deck.push({
      instanceId: `reward_${Date.now()}_${this.deck.length}`,
      defId,
      isUpgraded: false,
    })
  }

  serialize(): RunSaveData {
    return {
      version: 1,
      timestamp: Date.now(),
      characterId: 'warrior',
      floor: this.floor,
      hp: this.hp,
      maxHp: this.maxHp,
      gold: this.gold,
      deck: this.deck,
      relics: this.relics,
      potions: this.potions,
      map: this.mapState,
      rng: this.rngManager.serialize(this.seed),
      pity: { commonCardStreak: 0, recentRelicIds: [] },
    }
  }

  static fromSaveData(data: RunSaveData): RunState {
    // 새 인스턴스 생성 후 저장 데이터로 모두 덮어쓴다
    const run = new RunState(data.rng.globalSeed)
    run.floor = data.floor
    run.hp = data.hp
    run.maxHp = data.maxHp
    run.gold = data.gold
    run.deck = data.deck
    run.relics = data.relics
    run.potions = data.potions
    run.mapState = data.map
    run.rngManager = RNGManager.fromState(data.rng)
    RunState._instance = run
    return run
  }
}
