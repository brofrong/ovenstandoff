
import { getConfig, updateConfig, type LD } from "@ovenstandoff/shared";
import type { ConfigWithRunners, Runner } from "@ovenstandoff/shared/src/config.type";

export async function initStorage(LD: LD) {
  //laod config
  const config = await getConfig();
  try {
    const LdNames = (await LD.list2()).map((it) => it.name);
    checkLdNamesWithConfig(LdNames, config);
  } catch (error) {
    console.log("error in path to LD player!!!");
  }
}

async function checkLdNamesWithConfig(LDnames: string[], config: ConfigWithRunners) {
  const configNames = config.runners.map((it) => it.name);

  const check = configNames.every((conf) => LDnames.find((ld) => ld === conf));
  if (!check) {
    console.error(
      `config names don't match with ld Names!!!`,
      `config: ${configNames}, LDnames: ${LDnames}`
    );

    const newRunners: Runner[] = LDnames.map((ld, index) => ({ id: index, name: ld, nameIsChanged: 0, lowSettings: 0, email: "", password: "" }));
    config.runners = newRunners;
    await updateConfig(config, config.runners);
  }
}

