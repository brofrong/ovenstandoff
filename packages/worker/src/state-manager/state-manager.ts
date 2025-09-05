import type { State } from "@ovenstandoff/shared";
import { type ConfigWithRunners } from '@ovenstandoff/shared/src/config.type';
import { findAnchor } from "../img-proccesing/img-proccesing";
import type { LDPlayer } from "../ldconnector/ld";
import { getRunnerAuthInfo } from "../storage/get-runner-info";
import { updateRunnerInfo } from "../storage/update-storage";
import { client } from "../ws/ws";
import { runSteps } from "./steps";
import { waitForPlayers } from "./waiting-for-players";

export type Teams = {
  ct: string[];
  t: string[];
};

type ActionRet = { wait: number | null };

export const activeStateManagers: StateManager[] = [];

export class StateManager {
  public ldPlayer: LDPlayer;
  public state: State = "android";
  public currentImg: string | Buffer | null = "";
  public lobbyCode: string | null = null;
  public teams: Teams = { ct: [], t: [] };
  public matchStartedTimestamp: number | null = null;
  public config: ConfigWithRunners;

  // Screen streaming properties
  private isStreaming: boolean = false;
  private streamingInterval: NodeJS.Timeout | null = null;
  private readonly STREAMING_FPS = 1; // Frames per second for streaming

  constructor(ldPlayer: LDPlayer, config: ConfigWithRunners) {
    this.ldPlayer = ldPlayer;
    this.config = config;
    activeStateManagers.push(this);
  }

  public async takeScreenshot() {
    const imgTimeout = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve("timeout");
      }, 4000);
    });

    this.currentImg = await Promise.race([
      this.ldPlayer.screenShot(),
      imgTimeout,
    ]);

    if (this.currentImg === "timeout") {
      console.warn(`${this.ldPlayer.name} img timeout`);
      this.currentImg = "";
    }
    return this.currentImg;
  }

  private setState(newState: State) {
    this.state = newState;
    console.log(`${this.ldPlayer.name} state changed to ${newState}`);
    if (!client) {
      console.error("Client not found!!!!!!!!");
    }
    client?.send.changeState({
      runner: this.ldPlayer.name,
      state: newState,
    });
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
    };

    return keyToRunners[this.state].bind(this)();
  }

  public async startCreatingLobby(teams: Teams) {
    if (this.state !== "readyForCreateLobby") {
      console.warn(`${this.ldPlayer.name} is not ready for create lobby`);
      return { error: "not ready for create lobby" };
    }
    this.teams = teams;
    this.setState("createLobby");
    await this.run();
  }

  public async run() {
    console.log(`${this.ldPlayer.name} running with state: ${this.state}`);

    try {
      const neededAction = await this.runState();
      // deletePNG(screenshot);
      if (neededAction.wait !== null) {
        setTimeout(this.run.bind(this), neededAction.wait);
      }
    } catch (e) {
      console.log(`${this.ldPlayer.name}, error: ${e}`);
      this.ldPlayer.killapp("com.axlebolt.standoff2");
      this.setState("android");
    }
  }

  public async startMatch(teams: Teams) {
    this.teams = teams;
    this.setState("createLobby");
    await this.run();
  }

  private async booting(): Promise<ActionRet> {
    const activity = await this.ldPlayer.adb("shell dumpsys activity");
    if (!activity) return { wait: 5000 };
    this.setState("android");
    return { wait: 0 };
  }

  private async android(): Promise<ActionRet> {
    await this.ldPlayer.runapp("com.axlebolt.standoff2");
    this.setState("launching");
    return { wait: 0 };
  }

  private async debug(): Promise<ActionRet> {
    console.log("run debug", { state: this.state, ts: Date.now() });
    await this.takeScreenshot();

    if (this.currentImg) {
      await Bun.write(`./tmp/debug-${Date.now()}.png`, this.currentImg);
    }
    return { wait: 2000 };
  }

  private async launching(): Promise<ActionRet> {
    await this.takeScreenshot();

    if (await findAnchor(this.currentImg, "play")) {
      if (
        !this.config.runners.find((runner) => runner.name === this.ldPlayer.name)
          ?.lowSettings
      ) {
        this.setState("lowSettings");
        return { wait: 0 };
      }

      if (
        !this.config.runners.find((runner) => runner.name === this.ldPlayer.name)
          ?.nameIsChanged
      ) {
        this.setState("changeName");
        return { wait: 0 };
      }

      this.setState("readyForCreateLobby");
      return { wait: 0 };
    }

    if (await findAnchor(this.currentImg, "launch_storage_apply")) {
      await runSteps(
        [{ step: "click", data: { anchorKey: "launch_storage_apply" } }],
        this
      );
    }

    if (await findAnchor(this.currentImg, "launch_info_apply")) {
      await runSteps(
        [{ step: "click", data: { anchorKey: "launch_info_apply" } }],
        this
      );
    }

    if (await findAnchor(this.currentImg, "launch_is_in_lobby")) {
      await runSteps(
        [
          { step: "click", data: { anchorKey: "launch_is_in_lobby" } },
          { step: "click", data: { x: 371, y: 349 } },
          { step: "click", data: { x: 25, y: 36 } },
        ],
        this
      );
      return { wait: 0 };
    }

    if (await findAnchor(this.currentImg, "launch_ad_close")) {
      await runSteps(
        [{ step: "click", data: { anchorKey: "launch_ad_close" } }],
        this
      );
    }

    if (await findAnchor(this.currentImg, "launch_with_google")) {
      const runnerInfo = getRunnerAuthInfo(this.ldPlayer.name, this.config);
      await runSteps(
        [
          { step: "click", data: { anchorKey: "launch_with_google" } },
          { step: "wait", data: { amount: 5000 } },
          { step: "click", data: { anchorKey: "launch_login_email" } },
          { step: "wait", data: { amount: 1000 } },
          { step: "write", data: { text: runnerInfo.email } },
          { step: "click", data: { anchorKey: "launch_login_continue" } },
          { step: "wait", data: { amount: 1000 } },
          { step: "click", data: { anchorKey: "launch_login_password" } },
          { step: "wait", data: { amount: 1000 } },
          { step: "write", data: { text: runnerInfo.password } },
          { step: "click", data: { anchorKey: "launch_login_continue" } },
        ],
        this
      );
    }

    if (await findAnchor(this.currentImg, "launch_in_match_pause")) {
      await runSteps(
        [
          { step: "click", data: { anchorKey: "launch_in_match_pause" } },
          { step: "wait", data: { amount: 500 } },
          { step: "click", data: { x: 838, y: 479 } },
          { step: "click", data: { x: 397, y: 348 } },
        ],
        this
      );
    }

    if (await findAnchor(this.currentImg, "launch_close_bp")) {
      await runSteps(
        [{ step: "click", data: { anchorKey: "launch_close_bp" } }],
        this
      );
    }

    return { wait: 5000 };
  }

  private async readyForCreateLobby(): Promise<ActionRet> {
    await this.takeScreenshot();
    console.log("readyForCreateLobby", {
      name: this.ldPlayer.name,
      ts: Date.now(),
    });
    return { wait: null };
  }

  private async createLobby(): Promise<ActionRet> {
    await runSteps(
      [
        // create lobby
        { step: "click", data: { anchorKey: "menu_group" } },
        { step: "click", data: { anchorKey: "custom_lobby" } },
        // { step: 'click', data: { anchorKey: 'create_custom_lobby' } },

        // set lobby to private
        { step: "click", data: { x: 810, y: 76 } },
        { step: "click", data: { x: 608, y: 399 } },

        { step: "share", data: { setCode: this.setCode } },

        //setup lobby
        { step: "click", data: { anchorKey: "to_change_mode" } },
        { step: "click", data: { anchorKey: "competitive_mode" } },
        { step: "click", data: { anchorKey: "change_mode" } },

        // lobby setting
        { step: "click", data: { anchorKey: "lobby_setting" } },

        // prod Settings
        // { step: "click", data: { anchorKey: "lock_team_setting" } },
        // { step: "click", data: { anchorKey: "lobby_pripare_time_setting" } },
        // { step: "click", data: { anchorKey: "lobby_rounds_count_setting" } },
        // { step: "click", data: { anchorKey: "lobby_time_setting" } },
        // { step: "click", data: { anchorKey: "apply_setting" } },

        // debug settings
        { step: "click", data: { x: 927, y: 69 } }, // lock team
        { step: "click", data: { x: 927, y: 129 } }, // prepare time
        { step: "click", data: { x: 585, y: 180 } }, // roundTime time
        { step: "click", data: { x: 586, y: 235 } }, // prepare time
        { step: "click", data: { x: 586, y: 292 } }, // roundCount
        { step: "click", data: { x: 586, y: 292 } }, // roundCount
        { step: "click", data: { x: 586, y: 292 } }, // roundCount
        { step: "click", data: { anchorKey: "apply_setting" } },

        //move self to spectator
        { step: "find", data: { anchorKey: "lobby_setting" } },
        { step: "click", data: { x: 383, y: 75 } },
        { step: "wait", data: { amount: 500 } },
        { step: "click", data: { anchorKey: "to_spectators" } },
      ],
      this
    );
    this.setState("waitingForPlayers");
    return { wait: 1000 };
  }

  private async waitingForPlayers(): Promise<ActionRet> {
    await this.takeScreenshot();

    if (await waitForPlayers.isMatchExpired(this)) {
      this.setState("launching");
      return { wait: 0 };
    }

    //kick player from spectator
    await waitForPlayers.kickSpectators(this);

    //all slots are occupied check and kick player not in team
    const WaitingForPlayerCount =
      await waitForPlayers.getJoinedPlayersCountKickPlayersNotInList(this);

    if (WaitingForPlayerCount !== 0) {
      console.log(
        `${this.ldPlayer.name} waiting for players, left: ${WaitingForPlayerCount}`
      );
      return { wait: 10000 };
    }

    //start game

    console.log("start game");
    await waitForPlayers.startGame(this);

    this.setState("inGame");
    return { wait: 10000 };
  }

  private async lowSettings(): Promise<ActionRet> {
    await runSteps(
      [
        { step: "click", data: { anchorKey: "settings_main_menu" } },
        { step: "click", data: { anchorKey: "settings_to_video" } },

        // set low settings
        { step: "click", data: { x: 476, y: 84 } },
        { step: "click", data: { x: 476, y: 145 } },
        { step: "click", data: { x: 476, y: 204 } },
        { step: "click", data: { x: 476, y: 256 } },
        { step: "click", data: { x: 476, y: 321 } },

        // apply settings
        { step: "click", data: { x: 879, y: 513 } },
        { step: "wait", data: { amount: 5000 } },

        // set audio
        { step: "click", data: { anchorKey: "settings_to_audio" } },
        { step: "click", data: { x: 498, y: 78 } },
        { step: "click", data: { x: 498, y: 139 } },
        { step: "click", data: { x: 498, y: 202 } },
        { step: "click", data: { x: 498, y: 270 } },

        // apply audio settings
        { step: "click", data: { x: 879, y: 513 } },
        { step: "wait", data: { amount: 5000 } },

        // back to main menu
        { step: "click", data: { x: 22, y: 38 } },
      ],
      this
    );

    await updateRunnerInfo(this.config, this.ldPlayer.name, true);
    this.setState("launching");
    return { wait: 1000 };
  }

  private async changeName(): Promise<ActionRet> {
    const runnerName = this.ldPlayer.name;
    await runSteps(
      [
        { step: "click", data: { x: 222, y: 73 } },
        { step: "click", data: { x: 330, y: 236 } },
        { step: "deleteAllText" },
        { step: "write", data: { text: runnerName } },
        { step: "click", data: { x: 544, y: 353 } },
      ],
      this
    );

    await updateRunnerInfo(this.config, this.ldPlayer.name, false, true);
    this.setState("launching");
    return { wait: 0 };
  }

  private async inGame(): Promise<ActionRet> {
    await this.takeScreenshot();

    if (await findAnchor(this.currentImg, "in_game_t_win")) {
      console.log("match ended t win");
      // send opposite team win because of team swap

      client?.send.matchEnded({
        winner: "ct",
      });

      return this.matchEnded();
    }

    if (await findAnchor(this.currentImg, "in_game_ct_win")) {
      console.log("match ended ct win");
      // send opposite team win because of team swap
      client?.send.matchEnded({
        winner: "t",
      });
      return this.matchEnded();
    }

    if (await findAnchor(this.currentImg, "in_game_in_menu")) {
      console.log("match ended with error");
      client?.send.matchEnded({
        winner: "error",
      });

      return this.matchEnded();
    }

    //check if match expires

    if (
      this.matchStartedTimestamp &&
      Date.now() - this.matchStartedTimestamp > 1000 * 60 * 60
    ) {
      console.log("match expired");
      client?.send.matchEnded({
        winner: "error",
      });
      return this.matchEnded();
    }

    return { wait: 1500 };
  }

  private async matchEnded(): Promise<ActionRet> {
    this.teams = { ct: [], t: [] };
    this.matchStartedTimestamp = null;
    this.lobbyCode = null;
    this.setState("launching");
    return { wait: 1000 };
  }

  private setCode(code: string) {
    this.lobbyCode = code;
    if (!client) {
      console.error("Client not found!!!!!!!!");
    }
    client?.send.lobbyCode({
      code,
    });
  }

  // Screen streaming methods
  public async startScreenStream(): Promise<void> {
    if (this.isStreaming) {
      console.log(`Screen streaming already active for ${this.ldPlayer.name}`);
      return;
    }

    console.log(`Starting screen stream for ${this.ldPlayer.name}`);
    this.isStreaming = true;

    // Start streaming loop
    this.streamingInterval = setInterval(async () => {
      if (!this.isStreaming) return;

      try {
        await this.sendScreenFrame();
      } catch (error) {
        console.error(`Error sending screen frame for ${this.ldPlayer.name}:`, error);
      }
    }, 1000 / this.STREAMING_FPS); // Convert FPS to interval in milliseconds
  }

  public async stopScreenStream(): Promise<void> {
    if (!this.isStreaming) {
      console.log(`Screen streaming not active for ${this.ldPlayer.name}`);
      return;
    }

    console.log(`Stopping screen stream for ${this.ldPlayer.name}`);
    this.isStreaming = false;

    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
  }

  private async sendScreenFrame(): Promise<void> {
    try {
      // Take screenshot
      const screenshot = await this.ldPlayer.screenShot();

      if (screenshot && Buffer.isBuffer(screenshot)) {
        // Convert screenshot to base64
        const base64Frame = screenshot.toString('base64');

        // Send frame to master server using type-safe-socket
        if (client) {
          client.send.sendScreenFrame({
            runner: this.ldPlayer.name,
            frame: base64Frame,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error(`Error taking screenshot for ${this.ldPlayer.name}:`, error);
    }
  }

  // Cleanup method to stop streaming when StateManager is destroyed
  public destroy(): void {
    this.stopScreenStream();
  }
}
