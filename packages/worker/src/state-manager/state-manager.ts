import { Faker, en } from '@faker-js/faker'
import type { GameMap } from '@ovenstandoff/contract'
import type { State } from '@ovenstandoff/shared'
import type { ConfigWithRunners } from '@ovenstandoff/shared/src/config.type'
import path from 'node:path'
import sharp from 'sharp'
import { anchors } from '../anchors'
import { getCoordinatesByMap } from '../data/coordinates'
import { getLobbySettingsCoordinates } from '../data/lobby-settings'
import { findAnchorV2 } from '../img-proccesing/img-proccesing'
import type { LDPlayer } from '../ldconnector/ld'
import { getRunnerAuthInfo } from '../storage/get-runner-info'
import { updateRunnerInfo } from '../storage/update-storage'
import { log } from '../utils/log'
import { wait } from '../utils/utils'
import { client } from '../ws/ws'
import { runSteps } from './steps'
import { waitForPlayers } from './waiting-for-players'

export type Teams = {
  ct: string[]
  t: string[]
}

type ActionRet = { wait: number | null }

export const activeStateManagers: StateManager[] = [];

export const faker = new Faker({
  locale: en,
});

export class StateManager {
  public ldPlayer: LDPlayer
  public state: State = 'booting'
  public currentImg: string | Buffer | null = ''
  public lobbyCode: string | null = null
  public teams: Teams = { ct: [], t: [] }
  public map: GameMap | null = null
  public matchStartedTimestamp: number | null = null
  public matchID: string | null = null
  public callbackUrl: string | null = null
  public config: ConfigWithRunners
  public hasGFlag: boolean = false;
  public GName: string | null = null // G flag name
  private dropFrameCount: number = 0;

  // Screen streaming properties
  private isStreaming: boolean = false;

  constructor(ldPlayer: LDPlayer, config: ConfigWithRunners, hasGFlag: boolean = false) {
    this.ldPlayer = ldPlayer
    this.config = config
    this.hasGFlag = hasGFlag
    activeStateManagers.push(this)
  }

  public async takeScreenshot() {
    const imgTimeout = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('timeout')
      }, 4000)
    })

    this.currentImg = await Promise.race([this.ldPlayer.screenShot(), imgTimeout])

    if (this.currentImg === 'timeout') {
      //TODO: make half check if screen multiple times is empty
      console.warn(`${this.ldPlayer.name} img timeout`)
      this.currentImg = ''
      this.dropFrameCount++;
    }

    // If streaming is active, send the screenshot frame
    if (this.isStreaming) {
      // Don't await to avoid blocking the main screenshot flow
      this.sendScreenFrameIfStreaming().catch((error) => {
        console.error(`Error in background screen frame sending for ${this.ldPlayer.name}:`, error)
      })
    }


    if (this.currentImg !== '') {
      this.dropFrameCount = 0;
    };

    if (this.dropFrameCount > 6) {
      throw new Error('Emulator is not responding, cant take screenshot');
    }

    return this.currentImg;
  }

  private async sendScreenFrameIfStreaming(): Promise<void> {
    if (!this.currentImg || !Buffer.isBuffer(this.currentImg)) {
      log.info(
        `No valid screenshot to send for ${this.ldPlayer.name} (currentImg type: ${typeof this.currentImg})`
      )
      return
    }

    try {
      // Compress the image before sending
      const compressedBuffer = await sharp(this.currentImg)
        .jpeg({
          quality: 30,
          progressive: true,
        })
        .toBuffer()

      const base64Frame = compressedBuffer.toString('base64')
      log.info(`Sending screen frame for ${this.ldPlayer.name}, size: ${base64Frame.length} bytes`)
      if (client) {
        client.send.sendScreenFrame({
          runner: this.ldPlayer.name,
          frame: base64Frame,
          timestamp: Date.now(),
        })
      } else {
        console.warn(`Client not available for sending screen frame for ${this.ldPlayer.name}`)
      }
    } catch (error) {
      console.error(`Error sending screen frame for ${this.ldPlayer.name}:`, error)
    }
  }

  private setState(newState: State) {
    this.state = newState
    log.info(`${this.ldPlayer.name} state changed to ${newState}`)
    if (!client) {
      console.error('Client not found!!!!!!!!')
    }
    client?.send.changeState({
      runner: this.ldPlayer.name,
      state: newState,
    })
  }

  private runState(): Promise<ActionRet> {
    const keyToRunners: Record<State, () => Promise<ActionRet>> = {
      booting: this.booting,
      android: this.android,
      // launching: this.debug,
      launching: this.launching,
      readyForCreateLobby: this.readyForCreateLobby,
      createLobby: this.createLobby,
      // mainMenu: this.debug,
      lowSettings: this.lowSettings,
      changeName: this.changeName,
      waitingForPlayers: this.waitingForPlayers,
      debug: this.debug,
      inGame: this.inGame,
      updateGame: this.readyForCreateLobby,
      pictureName: this.pictureName,
    }

    return keyToRunners[this.state].bind(this)()
  }

  public async startCreatingLobby(
    teams: Teams,
    map: GameMap | null,
    matchID?: string,
    callbackUrl?: string
  ) {
    if (this.state !== 'readyForCreateLobby') {
      console.warn(`${this.ldPlayer.name} is not ready for create lobby`)
      return { error: 'not ready for create lobby' }
    }
    this.teams = teams
    this.matchID = matchID || null
    this.callbackUrl = callbackUrl || null
    this.map = map
    this.setState('createLobby')
    await this.run()
  }

  public async run() {
    log.info(`${this.ldPlayer.name} running with state: ${this.state}`)

    try {
      const neededAction = await this.runState()
      // deletePNG(screenshot);
      if (neededAction.wait !== null) {
        setTimeout(this.run.bind(this), neededAction.wait)
      }
    } catch (e) {
      log.error(`${this.ldPlayer.name}, error: ${e}`);
      this.reboot();
      this.setState('android');
      await this.run();
    }
  }

  public async startMatch(teams: Teams) {
    this.teams = teams
    this.setState('createLobby')
    await this.run()
  }

  private async booting(): Promise<ActionRet> {
    const activity = await this.ldPlayer.adb('shell dumpsys activity')

    if (!activity) return { wait: 5000 }
    this.setState('android')
    return { wait: 0 }
  }

  private async android(): Promise<ActionRet> {
    const activity = await this.ldPlayer.adb('shell dumpsys activity')
    const runningActivitiesRegex = /Running activities[\s\S]*?A=com\.axlebolt\.standoff2/
    const hasStandoff = runningActivitiesRegex.test(activity)

    if (!hasStandoff) {
      await this.ldPlayer.runapp('com.axlebolt.standoff2')
      return { wait: 5000 }
    }
    this.setState('launching')
    return { wait: 0 }
  }

  private async debug(): Promise<ActionRet> {
    log.info({ state: this.state, ts: Date.now() }, 'run debug')
    await this.takeScreenshot()

    if (this.currentImg) {
      await Bun.write(`./tmp/debug-${Date.now()}.png`, this.currentImg)
    }
    return { wait: 1000 }
  }

  private async launching(): Promise<ActionRet> {
    await this.takeScreenshot()

    if (await findAnchorV2(this.currentImg, anchors.mainMenuPlay)) {
      if (!this.config.runners.find((runner) => runner.name === this.ldPlayer.name)?.lowSettings) {
        this.setState('lowSettings')
        return { wait: 0 }
      }

      if (
        !this.config.runners.find((runner) => runner.name === this.ldPlayer.name)?.nameIsChanged
      ) {
        this.setState('changeName')
        return { wait: 0 }
      }

      this.setState('readyForCreateLobby')
      return { wait: 0 }
    }

    if (await findAnchorV2(this.currentImg, anchors.launchStorageAllow)) {
      await runSteps([{ step: 'click', data: { anchor: anchors.launchStorageAllow } }], this)
    }

    if (await findAnchorV2(this.currentImg, anchors.launchInformApply)) {
      await runSteps([{ step: 'click', data: { anchor: anchors.launchInformApply } }], this)
    }

    if (await findAnchorV2(this.currentImg, anchors.lobbyExitFromLobby)) {
      await runSteps(
        [
          { step: 'click', data: { anchor: anchors.lobbyExitFromLobby } },
          { step: 'click', data: { x: 526, y: 464 } },
          { step: 'click', data: { x: 30, y: 48 } },
        ],
        this
      )
      return { wait: 0 }
    }

    if (await findAnchorV2(this.currentImg, anchors.eventHalloweenClose)) {
      await runSteps([{ step: 'click', data: { anchor: anchors.eventHalloweenClose } }], this)
    }

    if (await findAnchorV2(this.currentImg, anchors.authGoogleAuth)) {
      const runnerInfo = getRunnerAuthInfo(this.ldPlayer.name, this.config)
      await runSteps(
        [
          { step: 'click', data: { anchor: anchors.authGoogleAuth } },
          { step: 'wait', data: { amount: 5000 } },
          { step: 'click', data: { anchor: anchors.authEnterEmail } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'write', data: { text: runnerInfo.email } },
          { step: 'click', data: { anchor: anchors.authContinueEmail } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'click', data: { anchor: anchors.authEnterPassword } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'write', data: { text: runnerInfo.password } },
          { step: 'click', data: { anchor: anchors.authContinuePassword } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'click', data: { anchor: anchors.authBackupImg } },
          { step: 'swipe', data: { x1: 629, y1: 500, x2: 621, y2: 500, duration: 200 } },
          { step: 'wait', data: { amount: 2000 } },
          { step: 'click', data: { anchor: anchors.authBackupOff } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'click', data: { anchor: anchors.authWelcomeApply } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'click', data: { anchor: anchors.authServicesMore } },
          { step: 'wait', data: { amount: 1000 } },
          { step: 'click', data: { anchor: anchors.authServicesMore } },
          { step: 'wait', data: { amount: 1000 } },
        ],
        this
      )
    }

    //TODO: add back
    // if (await findAnchor(this.currentImg, "launch_in_match_pause")) {
    //   await runSteps(
    //     [
    //       { step: "click", data: { anchorKey: "launch_in_match_pause" } },
    //       { step: "wait", data: { amount: 500 } },
    //       { step: "click", data: { x: 838, y: 479 } },
    //       { step: "click", data: { x: 397, y: 348 } },
    //     ],
    //     this
    //   );
    // }

    // if (await findAnchor(this.currentImg, "launch_close_bp")) {
    //   await runSteps(
    //     [{ step: "click", data: { anchorKey: "launch_close_bp" } }],
    //     this
    //   );
    // }

    return { wait: 5000 }
  }

  private async readyForCreateLobby(): Promise<ActionRet> {
    await this.takeScreenshot()
    log.info(
      {
        name: this.ldPlayer.name,
        ts: Date.now(),
      },
      'readyForCreateLobby'
    )

    if (this.hasGFlag) {
      this.GName = Math.random() > 0.5 ? faker.person.firstName() : faker.person.lastName();
      log.info(`${this.ldPlayer.name} GName: ${this.GName}`)
      this.setState('changeName');
      return { wait: 0 }
    }

    return { wait: null }
  }

  private async createLobby(): Promise<ActionRet> {
    await runSteps(
      [
        // create lobby
        { step: 'click', data: { anchor: anchors.mainMenuLobby } },
        { step: 'click', data: { anchor: anchors.lobbyCreateCustomLobby } },

        // set lobby to private
        { step: 'click', data: { x: 1076, y: 97 } },
        { step: 'click', data: { x: 804, y: 541 } },

        { step: 'share', data: { setCode: this.setCode } },

        //setup lobby
        { step: 'click', data: { x: 1180, y: 592 } }, // change game mode
        { step: 'click', data: { x: 397, y: 157 } }, // competitive mode
        { step: 'click', data: getCoordinatesByMap(this.map) },
        { step: 'click', data: { x: 1109, y: 665 } }, // apply

        // lobby setting
        { step: 'click', data: { x: 1151, y: 101 } }, // lobby setting

        // prod Settings
        // { step: "click", data: { x: 927, y: 129 } }, // Ограничить выбор команды
        // { step: "click", data: { x: 586, y: 180 } }, // длительность разминки уменьшить
        // { step: "click", data: { x: 927, y: 237 } }, // Длительность раунда увеличить
        // { step: "click", data: { x: 586, y: 292 } }, // длительность подготовки к раунду увеличить

        // debug settings
        { step: 'wait', data: { amount: 2000 } },
        { step: 'click', data: getLobbySettingsCoordinates('limit_team_selection', 'increase') },
        { step: 'click', data: getLobbySettingsCoordinates('warmup_time', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('warmup_time', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('warmup_time', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('round_time', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('prep_time', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('rounds_count', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('rounds_count', 'decrease') },
        { step: 'click', data: getLobbySettingsCoordinates('rounds_count', 'decrease') },

        { step: 'click', data: { x: 1206, y: 689 } }, // apply

        //move self to spectator
        { step: 'wait', data: { amount: 1000 } },
        { step: 'find', data: { anchor: anchors.lobbySettings } },
        { step: 'click', data: { x: 512, y: 107 } },
        { step: 'wait', data: { amount: 500 } },
        { step: 'click', data: { x: 605, y: 31 } },
      ],
      this
    )
    this.setState('waitingForPlayers')
    return { wait: 1000 }
  }

  private async waitingForPlayers(): Promise<ActionRet> {
    await this.takeScreenshot()

    if (await waitForPlayers.isMatchExpired(this)) {
      return this.matchEnded()
    }

    //kick player from spectator
    await waitForPlayers.kickSpectators(this)

    //all slots are occupied check and kick player not in team
    const WaitingForPlayerCount =
      await waitForPlayers.getJoinedPlayersCountKickPlayersNotInList(this)

    if (WaitingForPlayerCount !== 0) {
      log.info(`${this.ldPlayer.name} waiting for players, left: ${WaitingForPlayerCount}`)
      return { wait: 10000 }
    }

    //start game

    log.info('start game')
    await waitForPlayers.startGame(this)

    this.setState('inGame')
    return { wait: 30000 }
  }

  private async lowSettings(): Promise<ActionRet> {
    await runSteps(
      [
        { step: 'click', data: { x: 29, y: 560 } }, // settings main menu
        { step: 'click', data: { x: 528, y: 24 } }, // video settings

        // set low settings
        { step: 'click', data: { x: 635, y: 97 } },
        { step: 'click', data: { x: 635, y: 184 } },
        { step: 'click', data: { x: 635, y: 269 } },
        { step: 'click', data: { x: 635, y: 344 } },
        { step: 'click', data: { x: 1115, y: 441 } },

        // apply settings
        { step: 'click', data: { x: 1206, y: 687 } },
        { step: 'wait', data: { amount: 5000 } },

        // set audio
        { step: 'click', data: { x: 1132, y: 32 } }, // audio settings
        { step: 'click', data: { x: 661, y: 102 } },
        { step: 'click', data: { x: 661, y: 186 } },
        { step: 'click', data: { x: 661, y: 270 } },
        { step: 'click', data: { x: 661, y: 359 } },

        // apply audio settings
        { step: 'click', data: { x: 1206, y: 687 } },
        { step: 'wait', data: { amount: 5000 } },

        // back to main menu
        { step: 'click', data: { x: 33, y: 49 } },
      ],
      this
    )

    await updateRunnerInfo(this.config, this.ldPlayer.name, true)
    this.setState('launching')
    return { wait: 1000 }
  }

  private async changeName(): Promise<ActionRet> {
    let runnerName = this.ldPlayer.name
    if (this.hasGFlag && this.GName) {
      runnerName = this.GName
    }
    await runSteps(
      [
        { step: 'click', data: { x: 377, y: 97 } },
        { step: 'click', data: { x: 433, y: 314 } },
        { step: 'deleteAllText' },
        { step: 'write', data: { text: runnerName } },
        { step: 'click', data: { x: 748, y: 466 } },
      ],
      this
    )

    await updateRunnerInfo(this.config, this.ldPlayer.name, false, true)
    this.setState('launching')


    if (this.hasGFlag) {
      this.setState('pictureName')
    }
    return { wait: 0 }
  }

  private async inGame(): Promise<ActionRet> {
    await this.takeScreenshot()

    // if (await findAnchorV2(this.currentImg, anchors.inGameCtWin)) {
    //   log.info('match ended t win')
    //   client?.send.matchEnded({
    //     winner: 't',
    //   })

    //   return this.matchEnded()
    // }

    if (await findAnchorV2(this.currentImg, anchors.inGameCtWin)) {
      log.info('match ended ct win')
      client?.send.matchEnded({
        winner: 'ct',
      })
      return this.matchEnded()
    }

    if (await findAnchorV2(this.currentImg, anchors.mainMenuBackToMatch)) {
      await runSteps([{ step: 'click', data: { anchor: anchors.mainMenuBackToMatch } }], this)
      return { wait: 1000 }
    }

    if (await findAnchorV2(this.currentImg, anchors.lobbyExitFromLobby)) {
      log.info('match ended with error')
      client?.send.matchEnded({
        winner: 'error',
      })

      return this.matchEnded();
    }

    if (
      (await findAnchorV2(this.currentImg, anchors.mainMenuLobby)) &&
      (await findAnchorV2(this.currentImg, anchors.mainMenuPlay))
    ) {
      log.info('match ended with error')
      client?.send.matchEnded({
        winner: 'error',
      })

      return this.matchEnded()
    }

    //check if match expires

    if (this.matchStartedTimestamp && Date.now() - this.matchStartedTimestamp > 1000 * 60 * 60) {
      log.info('match expired')
      client?.send.matchEnded({
        winner: 'error',
      })
      return this.matchEnded()
    }

    return { wait: 1500 }
  }

  private async matchEnded(): Promise<ActionRet> {
    this.teams = { ct: [], t: [] }
    this.matchStartedTimestamp = null
    this.lobbyCode = null
    this.matchID = null
    this.callbackUrl = null
    this.map = null
    this.setState('launching')
    return { wait: 1000 }
  }

  public async reboot(): Promise<ActionRet> {
    const oldState = this.state;
    this.setState('booting');
    this.ldPlayer.quit()
    await wait(15000)
    this.ldPlayer.start()
    await this.ldPlayer.waitForStart()
    log.info(`rebooted emulator ${this.ldPlayer.name}`);
    await wait(5000)
    if (oldState === 'readyForCreateLobby') {
      this.run();
    }
    return { wait: 0 }
  }

  private setCode(code: string, runnerName: string) {
    this.lobbyCode = code
    if (!client) {
      console.error('Client not found!!!!!!!!')
    }
    client?.send.lobbyCode({
      runnerName,
      code,
    })
  }

  private async pictureName(): Promise<ActionRet> {
    await this.takeScreenshot()
    await runSteps([
      { step: 'click', data: { anchor: anchors.mainMenuLobby } },
      { step: "wait", data: { amount: 1000 } },
      { step: 'click', data: { anchor: anchors.lobbyCreateCustomLobby } },
      { step: 'wait', data: { amount: 1000 } },
    ], this);

    const img = await this.takeScreenshot();
    if (!img) {
      this.setState('launching');
      return { wait: 0 }
    }

    const name = this.GName;

    await sharp(img).extract({
      left: 457,
      top: 69,
      width: 113,
      height: 90,
    }).toFile(`./img/gnames/${name}-${Date.now()}.png`);

    this.setState('launching');
    return { wait: 0 }
  }

  // Screen streaming methods
  public async startScreenStream(): Promise<void> {
    if (this.isStreaming) {
      log.info(`Screen streaming already active for ${this.ldPlayer.name}`)
      return
    }

    log.info(`Starting screen stream for ${this.ldPlayer.name}`)
    this.isStreaming = true

    // Send current screenshot immediately if available
    if (this.currentImg && Buffer.isBuffer(this.currentImg)) {
      log.info(`Sending current screenshot for ${this.ldPlayer.name} immediately`)
      await this.sendScreenFrameIfStreaming()
    } else {
      // If no current screenshot or it's a string (timeout/empty), take one immediately
      log.info(`No valid current screenshot available, taking new one for ${this.ldPlayer.name}`)
      await this.takeScreenshot()
    }

    // No need for interval - screenshots will be sent automatically via takeScreenshot()
  }

  public async stopScreenStream(): Promise<void> {
    if (!this.isStreaming) {
      log.info(`Screen streaming not active for ${this.ldPlayer.name}`)
      return
    }

    log.info(`Stopping screen stream for ${this.ldPlayer.name}`)
    this.isStreaming = false
  }

  public async updateGame(unzippedFolder: string): Promise<ActionRet> {
    this.setState('updateGame')
    this.ldPlayer.killapp('com.axlebolt.standoff2')
    await wait(5000)
    this.ldPlayer.quit()
    await wait(5000)
    this.ldPlayer.start()
    await this.ldPlayer.waitForStart()
    await wait(5000)
    await this.ldPlayer.install(path.join(unzippedFolder, 'com.axlebolt.standoff2.apk'))
    await wait(5000)
    await this.ldPlayer.adb(`shell rm -rf /storage/emulated/0/Android/obb/com.axlebolt.standoff2`)
    await wait(5000)
    await this.ldPlayer.adb(
      `push ${path.join(
        unzippedFolder,
        'Android',
        'obb',
        'com.axlebolt.standoff2'
      )} /storage/emulated/0/Android/obb/com.axlebolt.standoff2/`
    )
    await wait(5000)

    this.setState('booting')
    this.run()
    return { wait: 1000 }
  }

  // Cleanup method to stop streaming when StateManager is destroyed
  public destroy(): void {
    this.stopScreenStream()
  }
}
