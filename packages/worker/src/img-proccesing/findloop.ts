import { anchors } from "./anchors";
import { findAnchor } from "./img-proccesing";
import { wait } from "../utils/utils";
import { StateManager } from "../state-manager/state-manager";

export async function findLoop(
  anchorKey: keyof typeof anchors,
  stateManager: StateManager,
  options?: { times?: number; wait?: number }
): Promise<{ sucess: true; error: false } | { sucess: false; error: true }> {
  const defaultOptions = { times: 3, wait: 500 };
  const _options = Object.assign(defaultOptions, options);
  return new Promise(async (res) => {
    for (let i = 0; i < _options.times; i++) {
      const screenShot = await stateManager.takeScreenshot();
      if (await findAnchor(screenShot, anchorKey)) {
        return res({ sucess: true, error: false });
      }
      await wait(_options.wait);
      // await deletePNG(screenShot);
    }

    return res({ sucess: false, error: true });
  });
}
