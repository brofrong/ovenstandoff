import { getConfig } from '@ovenstandoff/shared'
import { CronJob } from 'cron'
import {
  downloadLastVersion,
  STANDOFF2_DOWNLOAD_URL,
} from '../../../setup/src/download-last-version'
import { unzip } from '../../../setup/src/unzip'
import { getLd } from '../../../shared/src/ld-command'
import { startWorker } from '../core/worket'
import {
  activeStateManagers,
  StateManager,
  clearActiveStateManagers,
} from '../state-manager/state-manager'
import { log } from '../utils/log'
import { wait } from '../utils/utils'

export function startCron() {
  if (process.env.FORSE_UPDATE === 'true') {
    updateGameJob()
  }
  new CronJob('0 0 3 * * *', updateGameJob, null, true, 'Europe/Moscow')
  new CronJob('0 0 4 * * *', restartWorkers, null, true, 'Europe/Moscow')
  new CronJob('0 */5 * * * *', healthCheck, null, true, 'Europe/Moscow')
}

async function healthCheck() {
  const results = await Promise.allSettled(
    activeStateManagers.map((manager) => healthCheckEmulator(manager))
  )
  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      log.info(`health check success ${result.value.ldPlayer.name}`)
    } else {
      if (activeStateManagers[index]) {
        await activeStateManagers[index].reboot()
      }
      log.error(`health check failed ${result.reason}`)
    }
  }
}

async function healthCheckEmulator(emulator: StateManager): Promise<StateManager> {
  const activity = await emulator.ldPlayer.adb('shell dumpsys activity')
  if (!activity || !activity.includes('com.axlebolt.standoff2')) {
    await emulator.reboot()
    return emulator
  }

  return emulator
}

let updateInProgress = false

async function restartWorkers() {
  const config = await getConfig()
  await getLd(config).quitall()
  clearActiveStateManagers()
  await wait(10000)
  await startWorker()
}

async function updateGameJob() {
  try {
    if (updateInProgress) {
      return
    }
    updateInProgress = true
    log.info(`start updating games ${new Date().toISOString()}`)

    log.info('downloading last version of standoff2')
    const lastVersion = await downloadLastVersion(STANDOFF2_DOWNLOAD_URL)
    if (!lastVersion.isNew) {
      log.info('last version is already downloaded')
      return
    }
    const unzippedFolder = await unzip(lastVersion.filename)

    await Promise.all(activeStateManagers.map((manager) => updateGame(manager, unzippedFolder)))
    updateInProgress = false
    log.info(`update game success ${new Date().toISOString()}`)
  } catch (_e) {
    log.error(`update game failed ${new Date().toISOString()}`)
  }
}

function updateGame(manager: StateManager, unzippedFolder: string, retry: number = 0) {
  return new Promise(async (resolve, reject) => {
    if (
      manager.state === 'inGame' ||
      manager.state === 'android' ||
      manager.state === 'launching' ||
      manager.state === 'booting'
    ) {
      await manager.updateGame(unzippedFolder)
      log.info(`update game success ${manager.ldPlayer.name} ${new Date().toISOString()}`)
      return resolve(true)
    }

    if (retry > 10) {
      log.error(`update game failed ${manager.ldPlayer.name} ${new Date().toISOString()}`)
      return reject(false)
    }

    setTimeout(() => {
      updateGame(manager, unzippedFolder, retry + 1)
    }, 10000)
  })
}
