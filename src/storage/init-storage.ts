import { dirs } from "../unitls";
import * as path from "path";
import defaultConfig from "./default-config.json";
import { loadConfig } from "../config";
import { mkdir, rm } from "node:fs/promises";
import { LD } from "../ldconnector/ld-command";

const CONFIG_FILE_NAME = "config.json";
export const CONFIG_PATH = path.join(dirs, CONFIG_FILE_NAME);

export async function initStorage(options?: {deleteOldOnStart?: boolean}) {
  //laod config
  await checkIsConfigExist();
  await loadConfig();

  const LdNames = (await LD.list2()).map((it) => it.name);

  //delete old screenshots
  if(options?.deleteOldOnStart) {
    await deleteALLPNG(LdNames);
  }


  //Create screenshot folders
  await createScreenShotFolders(LdNames);
}

async function createScreenShotFolders(emulatorsNames: string[]) {
  return Promise.all(
    emulatorsNames.map((name) => createFolderForImgIfNotExist(name))
  );
}

async function createFolderForImgIfNotExist(name: string) {
  await mkdir(getImgFolder(name), { recursive: true });
}

async function checkIsConfigExist(): Promise<void> {
  const configFile = Bun.file(CONFIG_PATH);
  if (await configFile.exists()) {
    return;
  }

  await configFile.write(JSON.stringify(defaultConfig));
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
