
import { findLoop } from "../img-proccesing/findloop";
import type { LDPlayer } from "../ldconnector/ld";
import { wait } from "../unitls";
import { share } from "../share/shate";
import type { anchors } from "../img-proccesing/anchors";

type Step =
  | {
    step: "find";
    data: { anchorKey: keyof typeof anchors };
  }
  | {
    step: "click";
    data: { anchorKey?: keyof typeof anchors, x?: number, y?: number };
  }
  | {
    step: "write";
    data: { text: string };
  }
  | {
    step: "share";
    data: { setCode: (code: string) => void };
  }
  | {
    step: "wait";
    data: { amount: number };
  };

type Steps = Step[];

export async function runSteps(steps: Steps, ldPlayer: LDPlayer) {
  for (let step of steps) {
    switch (step.step) {
      case "find":
        await find(step, ldPlayer);
        break;
      case "click":
        if(step.data.x && step.data.y) {
          await ldPlayer.click(step.data.x, step.data.y);
        }
        if(step.data.anchorKey) {
          await find(step, ldPlayer);
          await ldPlayer.clickAnchor(step.data.anchorKey);
        }
        break;
      case "write":
        await ldPlayer.writeText(step.data.text);
        break;
      case "share":
        const shareRet = await share(ldPlayer.name, ldPlayer);
        step.data.setCode(shareRet.code);
        break;
      case "wait": {
        await wait(step.data.amount);
      }
    }
    await wait(500);
  }
}

async function find(step: Step, ldPlayer: LDPlayer) {
  if (step.step !== "find") return;
  const findedEllement = await findLoop(step.data.anchorKey, ldPlayer);
  if (findedEllement.error) {
    throw new Error(`name: ${ldPlayer.name}, anchor: ${step.data.anchorKey}`);
  }
  return;
}
