import { config } from "../../config";
import type { Config } from "./config.schema";
import { CONFIG_PATH } from "./init-storage";

export async function updateRunnerInfo(
  name: string,
  lowSettings?: boolean,
  nameIsChanged?: boolean
) {
  const runner = config.runners.find((runner) => runner.name === name);
  if (!runner) {
    throw new Error(`Runner ${name} not found`);
  }

  console.log(`updateRunnerInfo: runner: ${JSON.stringify(runner)}`);

  if (lowSettings) {
    runner.lowSettings = lowSettings;
  }

  if (nameIsChanged) {
    runner.nameIsChanged = nameIsChanged;
  }

  await writeConfig(config);
}

export async function writeConfig(config: Config) {
  return Bun.write(CONFIG_PATH, JSON.stringify(config));
}
