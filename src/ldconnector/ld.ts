import { LD } from "./ld-command";
import * as path from "path";
import { getImgFolder } from "../storage/init-storage";
import { anchors } from "../img-proccesing/anchors";

export const activeLdPlayers: LDPlayer[] = [];

export class LDPlayer {
  public name;

  constructor(name: string) {
    this.name = name;
    activeLdPlayers.push(this);
  }

  public async start() {
    return LD.launch(this.name);
  }

  public async isRunning() {
    return LD.isrunning(this.name);
  }

  public async adb(command: string) {
    return LD.adb(this.name, command);
  }

  public async click(x: number, y: number) {
    return LD.click(this.name, x, y);
  }
  public async clickAnchor(anchorKey: keyof typeof anchors) {
    const anchor = anchors[anchorKey];
    const centerX = anchor.offset.left + Math.round(anchor.offset.width / 2);
    const centerY = anchor.offset.top + Math.round(anchor.offset.height / 2);

    return LD.click(this.name, centerX, centerY);
  }

  public async writeText(text: string, pressEnterAfter: boolean = false) {
    const textWithSpaceChange = text.replaceAll(" ", "%s");
    await LD.adb(this.name, `shell input text "${textWithSpaceChange}"`);
    if (pressEnterAfter) {
      await LD.adb(this.name, `shell input keyevent 66`);
    }

    return;
  }

  public async screenShot(): Promise<Buffer | null> {
    return LD.screencap(this.name);
  }

  public async runapp(packagename: string) {
    return LD.runapp(this.name, packagename);
  }

  public async killapp(packagename: string) {
    return LD.killapp(this.name, packagename);
  }

  public async deleteAllText() {
    return LD.deleteAllText(this.name);
  }
}
