import { findAnchor } from "../img-proccesing/img-proccesing";
import type { LDPlayer } from "../ldconnector/ld";
import { runSteps } from "./steps";

type State =
  | "stoped"
  | "booting"
  | "andorid"
  | "launching"
  | "auth"
  | "mainMenu"
  | "dumd"
  | "waitingForPlayers";

type ActionRet = { wait: number };

export class StateManager {
  public ldPlayer: LDPlayer;
  public state: State = "booting";
  public currentImg: string = "";
  public lobbyCode: string | null = null;

  constructor(ldPlayer: LDPlayer) {
    this.ldPlayer = ldPlayer;
  }

  public async run() {
    console.log(`${this.ldPlayer.name} running with state: ${this.state}`);
    this.currentImg = await this.ldPlayer.screenShot();

    try {
      const neededAction = await this.runState();
      // deletePNG(screenshot);
      setTimeout(this.run.bind(this), neededAction.wait);
    } catch (e) {
      console.log(`${this.ldPlayer.name}, error: ${e}`);
      this.state = 'andorid';
      this.ldPlayer.killapp("com.axlebolt.standoff2");
    }
  }

  private runState(): Promise<ActionRet> {
    const keyToRunners: Record<State, () => Promise<ActionRet>> = {
      booting: this.botting,
      andorid: this.andorid,
      auth: this.dump,
      launching: this.launching,
      mainMenu: this.createLobby,
      stoped: this.dump,
      dumd: this.dump,
      waitingForPlayers: this.dump,
    };

    return keyToRunners[this.state].bind(this)();
  }

  private async botting(): Promise<ActionRet> {
    const activity = await this.ldPlayer.adb("shell dumpsys activity");
    if (!activity) return { wait: 5000 };

    this.state = "andorid";
    return { wait: 0 };
  }

  private async andorid(): Promise<ActionRet> {
    this.ldPlayer.runapp("com.axlebolt.standoff2");

    this.state = "launching";
    return { wait: 0 };
  }

  private async dump(): Promise<ActionRet> {
    console.log("run dump", { state: this.state, ts: Date.now() });
    return { wait: 10000 };
  }

  private async launching(): Promise<ActionRet> {
    if (await findAnchor(this.currentImg, "play")) {
      this.state = "mainMenu";
      return { wait: 0 };
    }
    return { wait: 5000 };
  }

  private async createLobby(): Promise<ActionRet> {
    await runSteps([
      // create lobby
      { step: 'click', data: { anchorKey: 'menu_group' } },
      { step: 'click', data: { anchorKey: 'custom_lobby' } },
      { step: 'click', data: { anchorKey: 'create_custom_lobby' } },

      { step: 'share', data: { setCode: this.setCode } },

      //setup lobby 
      { step: 'click', data: { anchorKey: 'to_change_mode' } },
      { step: 'click', data: { anchorKey: 'competitive_mode' } },
      { step: 'click', data: { anchorKey: 'change_mode' } },

      // lobby setting
      { step: 'click', data: { anchorKey: 'lobby_setting' } },

      { step: 'click', data: { anchorKey: 'change_lobby_description' } },
      { step: 'write', data: { text: 'CH match' } },
      { step: 'click', data: { anchorKey: 'lock_team_setting' } },
      { step: 'click', data: { anchorKey: 'lobby_pripare_time_setting' } },
      { step: 'click', data: { anchorKey: 'lobby_rounds_count_setting' } },
      { step: 'click', data: { anchorKey: 'lobby_time_setting' } },
      { step: 'click', data: { anchorKey: 'apply_setting' } },

    ], this.ldPlayer);

    this.state = 'waitingForPlayers';
    return { wait: 1000 };
  }


  private setCode(code: string) {
    this.lobbyCode = code;
  }
}
