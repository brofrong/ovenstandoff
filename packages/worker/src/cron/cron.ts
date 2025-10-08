import { CronJob } from 'cron';
import { activeStateManagers, StateManager } from '../state-manager/state-manager';
import {downloadLastVersion, STANDOFF2_DOWNLOAD_URL} from '../../../setup/src/download-last-version';
import {unzip} from '../../../setup/src/unzip';

export function startCron() {
  if(process.env.FORSE_UPDATE === 'true') {
    updateGameJob();
  }
  new CronJob('0 * * * * *', updateGameJob, null, true, 'Europe/Moscow');
}

let updateInProgress = false;


async function updateGameJob() {
  try{
    if(updateInProgress) {
      return;
    }
    updateInProgress = true;
    console.log(`start updating games ${new Date().toISOString()}`);
  
    console.log("downloading last version of standoff2");
    const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL);
    const unzippedFolder = await unzip(lastVersion);
  
    await Promise.all(activeStateManagers.map((manager) => updateGame(manager, unzippedFolder)));
    updateInProgress = false;
  } catch(e) {
    console.log(`update game failed ${new Date().toISOString()}`);
  }

}


function updateGame(manager: StateManager, unzippedFolder: string, retry: number = 0) {
  return new Promise(async (resolve, reject) => {
    if(manager.state === 'inGame' || manager.state === 'android' || manager.state === 'launching' || manager.state === 'booting') {
      await manager.updateGame(unzippedFolder);
      console.log(`update game success ${manager.ldPlayer.name} ${new Date().toISOString()}`);
      return resolve(true);
    } 

    if(retry > 10) {
      console.log(`update game failed ${manager.ldPlayer.name} ${new Date().toISOString()}`);
      return reject(false);
    }

    setTimeout(() => {
      updateGame(manager, unzippedFolder, retry + 1);
    }, 10000);
  });
}
