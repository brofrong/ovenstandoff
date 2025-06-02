import { config } from "../config";

export function getRunnerAuthInfo(name: string) {
  const runner = config.runners.find((runner) => runner.name === name);
  if (!runner) {
    throw new Error(`Runner ${name} not found`);
  }
  return runner;
}
