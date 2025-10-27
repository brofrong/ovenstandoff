import { CronJob } from 'cron';
import { activeStateManagers, StateManager } from '../state-manager/state-manager';
import { downloadLastVersion, STANDOFF2_DOWNLOAD_URL } from '../../../setup/src/download-last-version';
import { unzip } from '../../../setup/src/unzip';
import { log } from '../utils/log';
import { LDPlayer } from '../ldconnector/ld';
import { getConfig, LD } from '@ovenstandoff/shared';
import { getLd } from '../../../shared/src/ld-command';
import { wait } from '../utils/utils';
import { startWorker } from '../core/worket';

export function startCron() {
  if (process.env.FORSE_UPDATE === 'true') {
    updateGameJob();
  }
  new CronJob('0 0 3 * * *', updateGameJob, null, true, 'Europe/Moscow');
  new CronJob('0 0 4 * * *', restartWorkers, null, true, 'Europe/Moscow');
}

let updateInProgress = false;

async function restartWorkers() {
  const config = await getConfig();
  await getLd(config).quitall();
  await wait(10000);
  await startWorker();
}


async function updateGameJob() {
  try {
    if (updateInProgress) {
      return;
    }
    updateInProgress = true;
    log.info(`start updating games ${new Date().toISOString()}`);

    log.info("downloading last version of standoff2");
    const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL);
    if (!lastVersion.isNew) {
      log.info("last version is already downloaded");
      return;
    }
    const unzippedFolder = await unzip(lastVersion.filename);

    await Promise.all(activeStateManagers.map((manager) => updateGame(manager, unzippedFolder)));
    updateInProgress = false;
  } catch (e) {
    log.error(`update game failed ${new Date().toISOString()}`);
  }

}


function updateGame(manager: StateManager, unzippedFolder: string, retry: number = 0) {
  return new Promise(async (resolve, reject) => {
    if (manager.state === 'inGame' || manager.state === 'android' || manager.state === 'launching' || manager.state === 'booting') {
      await manager.updateGame(unzippedFolder);
      log.info(`update game success ${manager.ldPlayer.name} ${new Date().toISOString()}`);
      return resolve(true);
    }

    if (retry > 10) {
      log.error(`update game failed ${manager.ldPlayer.name} ${new Date().toISOString()}`);
      return reject(false);
    }

    setTimeout(() => {
      updateGame(manager, unzippedFolder, retry + 1);
    }, 10000);
  });
}
