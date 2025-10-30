export const coords = [
  // 0
  {
    topLeft: { x: 343, y: 102 },
    bottomRight: { x: 426, y: 119 },
  },
  // 1
  {
    topLeft: { x: 430, y: 102 },
    bottomRight: { x: 513, y: 119 },
  },
  // 2
  {
    topLeft: { x: 517, y: 102 },
    bottomRight: { x: 600, y: 119 },
  },
  // 3
  {
    topLeft: { x: 604, y: 102 },
    bottomRight: { x: 687, y: 119 },
  },
  // 4
  {
    topLeft: { x: 692, y: 102 },
    bottomRight: { x: 775, y: 119 },
  },
  // 5
  {
    topLeft: { x: 343, y: 172 },
    bottomRight: { x: 426, y: 189 },
  },
  // 6
  {
    topLeft: { x: 430, y: 172 },
    bottomRight: { x: 513, y: 189 },
  },
  // 7
  {
    topLeft: { x: 517, y: 172 },
    bottomRight: { x: 600, y: 189 },
  },
  // 8
  {
    topLeft: { x: 604, y: 172 },
    bottomRight: { x: 687, y: 189 },
  },
  // 9
  {
    topLeft: { x: 692, y: 172 },
    bottomRight: { x: 775, y: 189 },
  },
] as const

export const canvasSize = {
  width: coords[0].bottomRight.x - coords[0].topLeft.x,
  height: coords[0].bottomRight.y - coords[0].topLeft.y,
} as const
