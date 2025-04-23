import { findLoop } from "../img-proccesing/findloop";
import { findAnchor } from "../img-proccesing/img-proccesing";
import type { LDPlayer } from "../ldconnector/ld";
import { share } from "../share/shate";
import { deletePNG } from "../storage/init-storage";
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

  constructor(ldPlayer: LDPlayer) {
    this.ldPlayer = ldPlayer;
  }

  public async run() {
    console.log(`${this.ldPlayer.name} running with state: ${this.state}`);
    const screenshot = await this.ldPlayer.screenShot();
    this.currentImg = screenshot;
    const neededAction = await this.runState(screenshot);

    // deletePNG(screenshot);

    setTimeout(this.run.bind(this), neededAction.wait);
  }

  private runState(screenShot: string): Promise<ActionRet> {
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
    return { wait: 1000 };
  }

  private async andorid(): Promise<ActionRet> {
    this.ldPlayer.runapp("com.axlebolt.standoff2");

    this.state = "launching";
    return { wait: 5000 };
  }

  private async dump(): Promise<ActionRet> {
    console.log("run dump", { state: this.state, ts: Date.now() });
    return { wait: 10000 };
  }

  private async launching(): Promise<ActionRet> {
    if (await findAnchor(this.currentImg, "play")) {
      this.state = "mainMenu";
      return { wait: 1000 };
    }
    return { wait: 5000 };
  }

  private async createLobby(): Promise<ActionRet> {
    await runSteps([
      {step: 'find', data: {anchorKey: 'menu_group'}},
      {step: 'click', data: {anchorKey: 'menu_group'}},

      {step: 'find', data: {anchorKey: 'custom_lobby'}},
      {step: 'click', data: {anchorKey: 'custom_lobby'}},

      {step: 'find', data: {anchorKey: 'create_custom_lobby'}},
      {step: 'click', data: {anchorKey: 'create_custom_lobby'}},

      {step: 'share'},

      {step: 'find', data: {anchorKey: 'to_change_mode'}},
      {step: 'click', data: {anchorKey: 'to_change_mode'}},

      {step: 'find', data: {anchorKey: 'competitive_mode'}},
      {step: 'click', data: {anchorKey: 'competitive_mode'}},

      {step: 'find', data: {anchorKey: 'change_mode'}},
      {step: 'click', data: {anchorKey: 'change_mode'}},

      {step: 'find', data: {anchorKey: 'lobby_setting'}},
      {step: 'click', data: {anchorKey: 'lobby_setting'}},

      {step: 'find', data: {anchorKey: 'change_lobby_description'}},
      {step: 'click', data: {anchorKey: 'change_lobby_description'}},
      {step: 'write', data: {text: 'CH match'}},

      {step: 'find', data: {anchorKey: 'lock_team_setting'}},
      {step: 'click', data: {anchorKey: 'lock_team_setting'}},

      
      {step: 'find', data: {anchorKey: 'lobby_pripare_time_setting'}},
      {step: 'click', data: {anchorKey: 'lobby_pripare_time_setting'}},

      {step: 'find', data: {anchorKey: 'lobby_rounds_count_setting'}},
      {step: 'click', data: {anchorKey: 'lobby_rounds_count_setting'}},

      {step: 'find', data: {anchorKey: 'lobby_time_setting'}},
      {step: 'click', data: {anchorKey: 'lobby_time_setting'}},

      
      {step: 'find', data: {anchorKey: 'apply_setting'}},
      {step: 'click', data: {anchorKey: 'apply_setting'}},

    ], this.ldPlayer);

    this.state = 'waitingForPlayers';
    return { wait: 1000 };
  }
}
