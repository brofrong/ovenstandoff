
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
      data: { anchorKey: keyof typeof anchors };
    }
  | {
      step: "write";
      data: { text: string };
    }
  | {
      step: "share";
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
        await ldPlayer.clickAnchor(step.data.anchorKey);
        break;
      case "write":
        await ldPlayer.writeText(step.data.text);
        break;
      case "share":
        const code = await share(ldPlayer.name, ldPlayer);
        console.log(`player: ${ldPlayer.name} - ${code.code}`);
        break;
      case "wait": {
        await wait(step.data.amount);
      }
    }
    await wait(200);
  }
}

async function find(step: Step, ldPlayer: LDPlayer) {
  if (step.step !== "find") return;
  const custom_lobby = await findLoop(step.data.anchorKey, ldPlayer);
  if (custom_lobby.error) {
    throw new Error();
  }
  return;
}
