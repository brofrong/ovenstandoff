import { LD } from "../ldconnector/ld-command";
import { initStorage } from "../storage/init-storage";
import { dirs, wait } from "../unitls";
import {
  downloadLastVersion,
  STANDOFF2_DOWNLOAD_URL,
  standoffOutputPath,
} from "./download-last-version";
import path from "path";
import AdmZip from "adm-zip";
import { unzip } from "./unzip";
import { ejectBasicSettings } from "./settings";
import { config } from "../config";

async function init() {
  await initStorage();

  //   const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL);
  const lastVersion = "Standoff_2_0.33.3_APKPure.xapk";
  const unzippedFolder = await unzip(lastVersion);

  const list = await LD.list2();
  for (const item of list) {
    await LD.delete(item.name);
  }
  const id = await LD.create("clear");
  await wait(2000);
  await ejectBasicSettings(id);
  await wait(1000);
  await LD.launch("clear");
  await waitForLaunch("clear");

  console.log("install apk");
  console.log(
    await LD.install(
      "clear",
      path.join(unzippedFolder, "com.axlebolt.standoff2.apk")
    )
  );

  console.log("push obb");
  console.log(
    await LD.adb(
      "clear",
      `push ${path.join(
        unzippedFolder,
        "Android",
        "obb",
        "com.axlebolt.standoff2"
      )} /storage/emulated/0/Android/obb/`
    )
  );
  console.log("push success");
  await LD.quit("clear");
  //coping other instans
  const otherInstances: string[] = config.runners.map((runner) => runner.name);

  for (const instance of otherInstances) {
    console.log(`coping ${instance}`);
    await LD.copy(instance, "clear");
  }

  await wait(50 * 1000);
}

await init();

function waitForLaunch(name: string) {
  return new Promise(async (resolve, reject) => {
    for (let times = 0; times < 60; times++) {
      const activity = await LD.adb(name, "shell dumpsys activity");
      console.log({ activity });
      if (activity) {
        return resolve(true);
      }
      await wait(2000);
    }
    reject(false);
  });
}
