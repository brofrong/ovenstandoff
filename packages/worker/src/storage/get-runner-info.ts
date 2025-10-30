import type { ConfigWithRunners } from '@ovenstandoff/shared/src/config.type'

export function getRunnerAuthInfo(name: string, config: ConfigWithRunners) {
  const runner = config.runners.find((runner) => runner.name === name)
  if (!runner) {
    throw new Error(`Runner ${name} not found`)
  }
  return runner
}
