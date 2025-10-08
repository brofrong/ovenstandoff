import { CronJob } from 'cron';
import { activeStateManagers, StateManager } from '../state-manager/state-manager';
import {downloadLastVersion, STANDOFF2_DOWNLOAD_URL} from '../../../setup/src/download-last-version';
import {unzip} from '../../../setup/src/unzip';

export function startCron() {
  new CronJob('0 * * * * *', updateGameJob, null, true, 'Europe/Moscow');
}


async function updateGameJob() {
  console.log(`start updating games ${new Date().toISOString()}`);

  console.log("downloading last version of standoff2");
  const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL);
  const unzippedFolder = await unzip(lastVersion);

  activeStateManagers.forEach((manager) => updateGame(manager, unzippedFolder));
}


function updateGame(manager: StateManager, unzippedFolder: string, retry: number = 0) {
  if(manager.state === 'inGame') {
    return manager.updateGame(unzippedFolder);
  } 

  if(retry > 10) {
    console.log(`update game failed ${manager.ldPlayer.name} ${new Date().toISOString()}`);
    return;
  }

  setTimeout(() => {
    updateGame(manager, unzippedFolder, retry + 1);
  }, 10000);
}
