// больше меньше
// 1241, 783
// y coords:
// Ограничить выбор команды 129
// длительность разминки 180
// длительность раунда 237
// длительность подготовки к раунду 292
// Количество раундов 346

type Setting = 'limit_team_selection' | 'warmup_time' | 'round_time' | 'prep_time' | 'rounds_count'

const yCoords: Record<Setting, number> = {
  limit_team_selection: 170,
  warmup_time: 244,
  round_time: 317,
  prep_time: 389,
  rounds_count: 461,
} as const

export function getLobbySettingsCoordinates(
  setting: Setting,
  change: 'increase' | 'decrease'
): { x: number; y: number } {
  const x = change === 'increase' ? 1241 : 783
  const y = yCoords[setting]
  return { x, y }
}
