import type { GameMap } from "@ovenstandoff/contract";

const coordinatesByMap: Record<GameMap, { x: number, y: number }> = {
  "Sandstone": { x: 762, y: 370 },
  "Breeze": { x: 762, y: 280 },
  "Zone 7": { x: 762, y: 190 },
  "Sakura": { x: 762, y: 100 },
  "Hanami": { x: 762, y: 100 },
  "Rust": { x: 875, y: 100 },
  "Dune": { x: 875, y: 190 },
  "Province": { x: 875, y: 280 },
} as const;

export function getCoordinatesByMap(map: GameMap | null) {
  if (!map) {
    return coordinatesByMap['Dune'];
  }
  return coordinatesByMap[map];
}
