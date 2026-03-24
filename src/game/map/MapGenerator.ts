import type { MapState, MapNode, NodeType } from '@t/map.types'
import type { PRNG } from '@game/rng/PRNG'

const FLOORS = 15
const NODES_PER_FLOOR = 3

export class MapGenerator {
  generate(rng: PRNG): MapState {
    const nodes: MapNode[] = []
    let idCounter = 0

    for (let floor = 0; floor <= FLOORS; floor++) {
      const count = floor === FLOORS ? 1 : NODES_PER_FLOOR
      for (let i = 0; i < count; i++) {
        nodes.push({
          id: String(idCounter++),
          type: this.pickNodeType(floor, rng),
          floor,
          position: { x: (i + 1) * (1280 / (count + 1)), y: 720 - floor * 45 },
          connectionIds: [],
          isVisited: false,
          isAccessible: floor === 0,
        })
      }
    }

    this.generateConnections(nodes, rng)

    const startNodeId = nodes.find(n => n.floor === 0)?.id ?? '0'
    return { nodes, currentNodeId: startNodeId, floor: 0 }
  }

  /**
   * 노드 간 연결 생성 (교차 없음 보장).
   * 각 층의 모든 노드는 최소 1개의 다음 층 노드와 연결된다.
   */
  private generateConnections(nodes: MapNode[], rng: PRNG): void {
    const maxFloor = Math.max(...nodes.map(n => n.floor))

    for (let floor = 0; floor < maxFloor; floor++) {
      const cur = nodes
        .filter(n => n.floor === floor)
        .sort((a, b) => a.position.x - b.position.x)
      const nxt = nodes
        .filter(n => n.floor === floor + 1)
        .sort((a, b) => a.position.x - b.position.x)

      if (nxt.length === 1) {
        // 보스 층: 모든 현재 노드가 단일 노드에 연결
        for (const c of cur) c.connectionIds.push(nxt[0].id)
        continue
      }

      const nxtLen = nxt.length
      const curLen = cur.length
      const edges: Array<[number, number]> = []
      const nxtCovered = new Set<number>()

      // 비례 매핑으로 기본 연결
      for (let i = 0; i < curLen; i++) {
        const j = Math.round((i * (nxtLen - 1)) / Math.max(curLen - 1, 1))
        edges.push([i, j])
        nxtCovered.add(j)
      }

      // 미연결 다음 층 노드 보완
      for (let j = 0; j < nxtLen; j++) {
        if (!nxtCovered.has(j)) {
          const i = Math.round((j * (curLen - 1)) / Math.max(nxtLen - 1, 1))
          edges.push([i, j])
          nxtCovered.add(j)
        }
      }

      // 추가 연결 (40% 확률, 교차 없음 보장)
      for (let i = 0; i < curLen; i++) {
        if (rng.next() < 0.4) {
          const iEdges = edges.filter(e => e[0] === i).map(e => e[1])
          const currentMaxJ = Math.max(...iEdges)
          const upperBound = edges
            .filter(e => e[0] > i)
            .reduce((min, e) => Math.min(min, e[1]), nxtLen - 1)
          const extraJ = currentMaxJ + 1
          if (extraJ <= upperBound && extraJ < nxtLen && !iEdges.includes(extraJ)) {
            edges.push([i, extraJ])
          }
        }
      }

      for (let i = 0; i < curLen; i++) {
        const jList = [...new Set(edges.filter(e => e[0] === i).map(e => e[1]))]
        cur[i].connectionIds = jList.map(j => nxt[j].id)
      }
    }
  }

  private pickNodeType(floor: number, rng: PRNG): NodeType {
    if (floor === FLOORS) return 'BOSS'
    if (floor === 0) return 'COMBAT'
    if (floor % 5 === 4) return 'REST' // 4, 9, 14층은 반드시 휴식
    const pool: NodeType[] = ['COMBAT', 'COMBAT', 'COMBAT', 'EVENT', 'SHOP', 'REST', 'ELITE']
    return rng.pick(pool)
  }
}
