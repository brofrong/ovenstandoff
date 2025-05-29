import { findAnchor } from "../img-proccesing/img-proccesing";
import type { LDPlayer } from "../ldconnector/ld";
import { getRunnerAuthInfo } from "../storage/get-runner-info";
import { runSteps } from "./steps";
import { config } from "../config";
import { updateRunnerInfo } from "../storage/update-storage";
import { sendMessageToMasterServer } from "../ws/ws";
import type { State } from "./states";
import {waitForPlayers} from './waiting-for-players';

export type Teams = {
  ct: string[];
  t: string[];
};

type ActionRet = { wait: number | null };

export const activeStateManagers: StateManager[] = [];

export class StateManager {
  public ldPlayer: LDPlayer;
  public state: State = "booting";
  public currentImg: string | Buffer | null = "";
  public lobbyCode: string | null = null;
  public teams: Teams = { ct: ["CH auto 1"], t: ["CH auto 2"] };
  public matchStartedTimestamp: number | null = null;

  constructor(ldPlayer: LDPlayer) {
    this.ldPlayer = ldPlayer;
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
    sendMessageToMasterServer({
      type: "changeState",
      data: {
        runner: this.ldPlayer.name,
        state: newState,
      },
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

    if(this.currentImg) {
      await Bun.write(`./tmp/debug-${Date.now()}.png`, this.currentImg);
    }
    return { wait: 2000 };
  }

  private async launching(): Promise<ActionRet> {
    await this.takeScreenshot();

    if (await findAnchor(this.currentImg, "play")) {
      if (
        !config.runners.find((runner) => runner.name === this.ldPlayer.name)
          ?.lowSettings
      ) {
        this.setState("lowSettings");
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
      const runnerInfo = getRunnerAuthInfo(this.ldPlayer.name);
      await runSteps(
        [
          { step: "click", data: { anchorKey: "launch_with_google" } },
          { step: "wait", data: { amount: 5000 } },
          { step: "click", data: { anchorKey: "launch_login_email" } },
          { step: "wait", data: { amount: 1000 } },
          { step: "write", data: { text: runnerInfo.email } },
          { step: "click", data: { anchorKey: "launch_login_continue" } },
          { step: "wait", data: { amount: 5000 } },
          { step: "click", data: { anchorKey: "launch_login_password" } },
          { step: "wait", data: { amount: 1000 } },
          { step: "write", data: { text: runnerInfo.password } },
          {
            step: "click",
            data: { anchorKey: "launch_login_password_continue" },
          },
        ],
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
        // { step: "find", data: { anchorKey: "lobby_setting" } },
        // { step: "click", data: { x: 383, y: 75 } },
        // { step: "wait", data: { amount: 500 } },
        // { step: "click", data: { anchorKey: "to_spectators" } },
      ],
      this
    );
    this.setState("waitingForPlayers");
    return { wait: 1000 };
  }


  private async waitingForPlayers(): Promise<ActionRet> {
    await this.takeScreenshot();

    if(await waitForPlayers.isMatchExpired(this)) {
      this.setState("launching");
      return { wait: 0 };
    }

    //TODO: kick player from spectator
    await waitForPlayers.kickSpectators(this);

    //TODO: all slots are occupied check

    const WaitingForPlayerCount = await waitForPlayers.getJoinedPlayersCountKickPlayersNotInList(this);

    if (WaitingForPlayerCount !== 0) {
      return { wait: 10000 };
    }

    //TODO: check if all players are connected kick if player not in team
    
    // TODO: start game

    // if(WaitingForPlayerCount === 0) {
    //   console.log("start game");
    //   await runSteps([
    //     {step: "click", data: {x: 433, y: 507}},
    //     {step: "wait", data: {amount: 1000}},
    //     {step: "write", data: {text: "Start match in 10 seconds"}},
    //     {step: "wait", data: {amount: 1000}},
    //     {step: "click", data: {x: 865, y: 494}},
    //     {step: "wait", data: {amount: 5000}},
    //     {step: "click", data: {x: 865, y: 494}},
    //   ], this);
      
    //   this.setState("inGame");
    // }

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

    await updateRunnerInfo(this.ldPlayer.name, true);
    this.setState("launching");
    return { wait: 1000 };
  }

  private async inGame(): Promise<ActionRet> {
    await this.takeScreenshot();
    if(await findAnchor(this.currentImg, "in_game_t_win")) {
      sendMessageToMasterServer({
        type: "matchEnded",
        data: { winner: "t" },
      });
      return this.matchEnded();
    }

    if(await findAnchor(this.currentImg, "launch_is_in_lobby")) {
      // TODO: send message to master server
      sendMessageToMasterServer({
        type: "matchEnded",
        data: { winner: "error" },
      });

      return this.matchEnded();
    }
    return { wait: 200 };
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
    sendMessageToMasterServer({
      type: "lobbyCode",
      data: { code },
    });
  }
}
