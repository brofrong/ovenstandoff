import type { Anchor } from '../anchors/anchor.type'
import type { StateManager } from '../state-manager/state-manager'
import { wait } from '../utils/utils'
import { findAnchorV2 } from './img-proccesing'

export async function findLoop(
  anchor: Anchor,
  stateManager: StateManager,
  options?: { times?: number; wait?: number }
): Promise<{ sucess: true; error: false } | { sucess: false; error: true }> {
  const defaultOptions = { times: 3, wait: 500 }
  const _options = Object.assign(defaultOptions, options)
  return new Promise(async (res) => {
    for (let i = 0; i < _options.times; i++) {
      const screenShot = await stateManager.takeScreenshot()

      if (await findAnchorV2(screenShot, anchor)) {
        return res({ sucess: true, error: false })
      }
      await wait(_options.wait)
    }

    return res({ sucess: false, error: true })
  })
}
