import * as p from '@clack/prompts';
import { intro } from "@clack/prompts";
import { getConfig, getLd, updateConfig } from '@ovenstandoff/shared';
import type { Config, Runner } from '@ovenstandoff/shared/src/config.type';
import path from "path";
import { downloadLastVersion, STANDOFF2_DOWNLOAD_URL } from "./download-last-version";
import { ejectBasicSettings } from "./settings";
import { unzip } from "./unzip";
import { wait } from "./utils";
import { initClient } from '@ts-rest/core';
import { masterContract } from '@ovenstandoff/contract';

export async function setup() {
  const config = await getConfig();
  intro(`setup standoff 2 and ldap`);

  const group = await p.group(
    {
      LDPath: () => p.text({ message: 'путь до ldplayer?', initialValue: config.ldPath }),
      restHost: () => p.text({ message: 'host где размещён REST мастер сервер?', initialValue: config.masterServerRestHost }),
      wsHost: () => p.text({ message: 'host где размещён WS мастер сервер?', initialValue: config.masterServerWsHost }),
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
  currentConfig.masterServerRestHost = group.restHost;
  currentConfig.masterServerWsHost = group.wsHost;
  currentConfig.secret = group.secret;
  if (currentConfig.runners.length !== parseInt(group.count)) {
    currentConfig.runners = await getRunnersId(currentConfig, Number(group.count));
  }
  console.log(currentConfig.runners);


  await updateConfig(currentConfig, currentConfig.runners);

  await downloadAndInstallStandoff2(currentConfig.runners, currentConfig);

  console.log("setup complete");
}



async function getRunnersId(config: Config, count: number,) {
  const host = new URL(config.masterServerRestHost);

  const client = initClient(masterContract, {
    baseUrl: `https://${host.host}`,
    baseHeaders: {
      "Authorization": `Bearer ${config.secret}`
    },
  });
  const response = await client.registerClients({ body: { count } });


  if (response.status !== 200) {
    throw new Error(`Failed to get runners id: ${response.status}`);
  }

  return response.body;
}

async function downloadAndInstallStandoff2(runners: Runner[], config: Config) {

  console.log("downloading last version of standoff2");
  const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL);
  // const lastVersion = "Standoff_2_0.33.3_APKPure.xapk";
  const unzippedFolder = await unzip(lastVersion);

  const LD = getLd(config);
  const list = await LD.list2();
  for (const item of list) {
    await LD.delete(item.name);
  }

  const id = await LD.create("clear");
  await wait(2000);
  await ejectBasicSettings(id, config);
  await wait(1000);
  await LD.launch("clear");
  await waitForLaunch("clear", config);

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
      )} /storage/emulated/0/Android/obb/com.axlebolt.standoff2/`
    )
  );
  console.log("push success");
  await LD.quit("clear");
  //coping other instans
  const otherInstances: string[] = runners.map((runner) => runner.name);

  for (const instance of otherInstances) {
    console.log(`coping ${instance}`);
    await LD.copy(instance, "clear");
  }

  await wait(50 * 1000);
}

function waitForLaunch(name: string, config: Config) {
  const LD = getLd(config);
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
