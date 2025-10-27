import type { Config } from "@ovenstandoff/shared/src/config.type";
import * as path from "path";


const basicSettings = {
  "advancedSettings.resolution": {
    width: 1280,
    height: 720,
  },
  "advancedSettings.resolutionDpi": 160,
  "advancedSettings.cpuCount": 2,
  "advancedSettings.memorySize": 2048,
  "basicSettings.adbDebug": 1,
};

export async function ejectBasicSettings(id: number, config: Config) {
  const configPath = path.join(
    config.ldPath,
    "vms",
    "config",
    `leidian${id}.config`
  );
  const CurrentConfig = await Bun.file(configPath).json();

  const newConfig = Object.assign({}, CurrentConfig, basicSettings);
  await Bun.write(configPath, JSON.stringify(newConfig));
}
