import { updateConfig } from '@ovenstandoff/shared'
import type { ConfigWithRunners } from '@ovenstandoff/shared/src/config.type'
import { log } from '../utils/log'

export async function updateRunnerInfo(
  config: ConfigWithRunners,
  name: string,
  lowSettings?: boolean,
  nameIsChanged?: boolean
) {
  const runner = config.runners.find((runner) => runner.name === name)
  if (!runner) {
    throw new Error(`Runner ${name} not found`)
  }

  log.info(`updateRunnerInfo: runner: ${JSON.stringify(runner)}`)

  if (lowSettings) {
    runner.lowSettings = lowSettings ? 1 : 0
  }

  if (nameIsChanged) {
    runner.nameIsChanged = nameIsChanged ? 1 : 0
  }

  await updateConfig(config, config.runners)
}
