import * as p from '@clack/prompts';
import { intro } from "@clack/prompts";
import path from "path";
import { config } from "../config";
import { wait } from "../unitls";
import { LD } from "../worker/ldconnector/ld-command";
import { initStorage } from "../worker/storage/init-storage";
import { downloadLastVersion, STANDOFF2_DOWNLOAD_URL } from "./download-last-version";
import { ejectBasicSettings } from "./settings";
import { unzip } from "./unzip";
import { z } from 'zod';
import { Config } from '../worker/storage/config.schema';
import { writeConfig } from '../worker/storage/update-storage';

export async function setup() {
  await initStorage();
  intro(`setup standoff 2 and ldap`);

  const group = await p.group(
    {
      LDPath: () => p.text({ message: 'путь до ldplayer?', initialValue: config.ldPath }),
      age: () => p.text({ message: 'host где размещён мастер сервер?', initialValue: config.masterServerHost }),
      secret: () => p.text({ message: 'секретный ключ для мастер сервера?', initialValue: config.secret }),
      count: () => p.text({ message: 'количество инстансов', initialValue: config.runners.length.toString() }),
    },
    {
      // On Cancel callback that wraps the group
      // So if the user cancels one of the prompts in the group this function will be called
      onCancel: ({ results }) => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );
  const currentConfig = config;
  currentConfig.ldPath = group.LDPath;
  currentConfig.masterServerHost = group.age;
  currentConfig.secret = group.secret;
  if (currentConfig.runners.length !== parseInt(group.count)) {
    currentConfig.runners = await getRunnersId(currentConfig.masterServerHost, Number(group.count), currentConfig.secret);
  }
  await writeConfig(currentConfig);

  await downloadAndInstallStandoff2(Number(group.count));

  console.log("setup complete");
}

async function getRunnersId(masterServerHost: string, count: number, secret: string) {
  const host = new URL(masterServerHost);
  const response = await fetch(`https://${host.host}/register-clients`, {
    body: JSON.stringify({ count }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secret}`
    },
  });
  const data = await response.json() as {
    startID: number;
    endID: number;
  };

  const runners: Config['runners'] = [];

  for (let i = data.startID; i < data.endID; i++) {
    runners.push({ name: `CH auto ${i + 1}`, nameIsChanged: false, lowSettings: false });
  }

  return runners;
}

async function downloadAndInstallStandoff2(count: number) {
  console.log("downloading last version of standoff2");
  const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL);
  // const lastVersion = "Standoff_2_0.33.3_APKPure.xapk";
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
  console.log(`push ${path.join(
    unzippedFolder,
    "Android",
    "obb",
    "com.axlebolt.standoff2"
  )} /storage/emulated/0/Android/obb/`);
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
