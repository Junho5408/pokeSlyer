export type NodeType =
  | 'COMBAT'
  | 'ELITE'
  | 'EVENT'
  | 'SHOP'
  | 'REST'
  | 'TREASURE'
  | 'BOSS'

export interface MapNode {
  id: string
  type: NodeType
  floor: number
  position: { x: number; y: number }
  connectionIds: string[]
  isVisited: boolean
  isAccessible: boolean
}

export interface MapState {
  nodes: MapNode[]
  currentNodeId: string
  floor: number
}
