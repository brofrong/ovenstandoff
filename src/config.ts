import { z } from "zod";
import { CONFIG_PATH } from "./storage/init-storage";

export let config: z.infer<typeof configShema>;

const configShema = z.object({
  ldconsolePath: z.string(),
});

export async function loadConfig() {
  const configFile = Bun.file(CONFIG_PATH);
  const configJSON = await configFile.json();
  config = configShema.parse(configJSON);
}
