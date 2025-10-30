import type { GameMap } from '@ovenstandoff/contract'

const coordinatesByMap: Record<GameMap, { x: number; y: number }> = {
  Hanami: { x: 1022, y: 112 },
  Sakura: { x: 1022, y: 251 },
  'Zone 7': { x: 1022, y: 280 },
  Breeze: { x: 1022, y: 375 },
  Sandstone: { x: 1022, y: 499 },
  Rust: { x: 1154, y: 112 },
  Dune: { x: 1154, y: 251 },
  Province: { x: 1154, y: 375 },
} as const

export function getCoordinatesByMap(map: GameMap | null) {
  if (!map) {
    return coordinatesByMap.Dune
  }
  return coordinatesByMap[map]
}
