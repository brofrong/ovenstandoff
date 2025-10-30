import type { anchors } from './anchors'

export type Offset = {
  left: number
  top: number
  width: number
  height: number
}
export type AnchorKey = keyof typeof anchors
