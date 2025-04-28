import * as path from "path";
import { dirs } from "../unitls";

import { mkdir, rm } from "node:fs/promises";
import { config, loadConfig } from "../config";
import { LD } from "../ldconnector/ld-command";

const CONFIG_FILE_NAME = "config.json";
export const CONFIG_PATH = path.join(dirs, CONFIG_FILE_NAME);

export async function initStorage(options?: { deleteOldOnStart?: boolean }) {
  //laod config
  await loadConfig();

  const LdNames = (await LD.list2()).map((it) => it.name);

  checkLdNamesWithConfig(LdNames);
  //delete old screenshots
  if (options?.deleteOldOnStart) {
    await deleteALLPNG(LdNames);
  }

  //Create screenshot folders
  await createScreenShotFolders(LdNames);
}

async function checkLdNamesWithConfig(LDnames: string[]) {
  const configNames = config.runners.map((it) => it.name);

  const check = configNames.every((conf) => LDnames.find((ld) => ld === conf));
  if (!check) {
    console.error(`config names don't match with ld Names!!!`, `config: ${configNames}, LDnames: ${LDnames}`);
  }
}

async function createScreenShotFolders(emulatorsNames: string[]) {
  return Promise.all(
    emulatorsNames.map((name) => createFolderForImgIfNotExist(name))
  );
}

async function createFolderForImgIfNotExist(name: string) {
  await mkdir(getImgFolder(name), { recursive: true });
}


async function deleteALLPNG(emulatorsNames: string[]) {
  return Promise.all(
    emulatorsNames.map((name) =>
      rm(getImgFolder(name), { recursive: true, force: true })
    )
  );
}

export async function deletePNG(path: string) {
  return rm(path, { force: true });
}

export function getImgFolder(emulatorName: string) {
  return path.join(dirs, "tmp", emulatorName);
}
