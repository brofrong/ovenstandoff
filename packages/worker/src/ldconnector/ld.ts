import { anchors } from "../img-proccesing/anchors";
import type { LD } from "@ovenstandoff/shared";


export const activeLdPlayers: LDPlayer[] = [];

export class LDPlayer {
  public name;
  public LD: LD;

  constructor(name: string, LD: LD) {
    this.name = name;
    this.LD = LD;
    activeLdPlayers.push(this);
  }

  public async start() {
    return this.LD.launch(this.name);
  }

  public async isRunning() {
    return this.LD.isrunning(this.name);
  }

  public async adb(command: string) {
    return this.LD.adb(this.name, command);
  }

  public async click(x: number, y: number) {
    return this.LD.click(this.name, x, y);
  }
  public async clickAnchor(anchorKey: keyof typeof anchors) {
    const anchor = anchors[anchorKey];
    const centerX = anchor.offset.left + Math.round(anchor.offset.width / 2);
    const centerY = anchor.offset.top + Math.round(anchor.offset.height / 2);

    return this.LD.click(this.name, centerX, centerY);
  }

  public async writeText(text: string, pressEnterAfter: boolean = false) {
    const textWithSpaceChange = text.replaceAll(" ", "%s");
    await this.LD.adb(this.name, `shell input text "${textWithSpaceChange}"`);
    if (pressEnterAfter) {
      await this.LD.adb(this.name, `shell input keyevent 66`);
    }

    return;
  }

  public async screenShot(): Promise<Buffer | null> {
    return this.LD.screencap(this.name);
  }

  public async runapp(packagename: string) {
    return this.LD.runapp(this.name, packagename);
  }

  public async killapp(packagename: string) {
    return this.LD.killapp(this.name, packagename);
  }

  public async deleteAllText() {
    return this.LD.deleteAllText(this.name);
  }
}
