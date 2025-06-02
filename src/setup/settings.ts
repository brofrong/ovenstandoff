import * as path from "path";
import { config } from "../config";

const basicSettings = {
  "advancedSettings.resolution": {
    width: 960,
    height: 540,
  },
  "advancedSettings.resolutionDpi": 160,
  "advancedSettings.cpuCount": 2,
  "advancedSettings.memorySize": 2048,
  "basicSettings.adbDebug": 1,
};

export async function ejectBasicSettings(id: number) {
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
