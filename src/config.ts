import { z } from "zod";
import { configSchema } from "./worker/storage/config.schema";
import { CONFIG_PATH } from "./worker/storage/init-storage";
import defaultConfig from "./worker/storage/default-config.json";

export let config: z.infer<typeof configSchema>;

export async function loadConfig() {
  await checkIsConfigExist();
  const configFile = Bun.file(CONFIG_PATH);
  console.log(`load config from ${CONFIG_PATH}`);
  const configJSON = await configFile.json();
  config = configSchema.parse(configJSON);
}

async function checkIsConfigExist(): Promise<void> {
  const configFile = Bun.file(CONFIG_PATH);
  if (!(await configFile.exists())) {
    await configFile.write(JSON.stringify(defaultConfig));
    return;
  }

  const fileJson = await configFile.json();
  const fileZodSafeParse = configSchema.safeParse(fileJson);

  if (!fileZodSafeParse.success) {
    await configFile.write(JSON.stringify(defaultConfig));
    return;
  }

  return;
}
