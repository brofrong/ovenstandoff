import type { GameMap } from "@ovenstandoff/contract";

const coordinatesByMap: Record<GameMap, { x: number, y: number }> = {
  "Sandstone": { x: 1280, y: 611 },
  "Breeze": { x: 1280, y: 440 },
  "Zone 7": { x: 1280, y: 280 },
  "Sakura": { x: 1280, y: 100 },
  "Hanami": { x: 1280, y: 130 },
  "Rust": { x: 1480, y: 130 },
  "Dune": { x: 1480, y: 280 },
  "Province": { x: 1480, y: 440 },
} as const;

export function getCoordinatesByMap(map: GameMap | null) {
  if (!map) {
    return coordinatesByMap['Dune'];
  }
  return coordinatesByMap[map];
}
