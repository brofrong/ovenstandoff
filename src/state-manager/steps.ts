import { findLoop } from "../img-proccesing/findloop";
import { wait } from "../unitls";
import { share } from "../share/shate";
import { anchors } from "../img-proccesing/anchors";
import { StateManager } from "./state-manager";
import { getImageOccurrence } from "@appium/opencv";
import { loadBuffer } from "../img-proccesing/memo-img";

type Step =
  | {
      step: "find";
      data: { anchorKey: keyof typeof anchors };
    }
  | {
      step: "click";
      data: { anchorKey?: keyof typeof anchors; x?: number; y?: number };
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
    }
  | {
      step: "clickOccurrence";
      data: { anchorKey: keyof typeof anchors };
    }
  | {
      step: "deleteAllText";
    };

type Steps = Step[];

export async function runSteps(steps: Steps, stateManager: StateManager) {
  for (let step of steps) {
    switch (step.step) {
      case "find":
        await find(step, stateManager);
        break;
      case "click":
        if (step.data.x && step.data.y) {
          await stateManager.ldPlayer.click(step.data.x, step.data.y);
        }
        if (step.data.anchorKey) {
          await find(step, stateManager);
          await stateManager.ldPlayer.clickAnchor(step.data.anchorKey);
        }
        break;
      case "write":
        await stateManager.ldPlayer.writeText(step.data.text);
        break;
      case "share":
        const shareRet = await share(stateManager.ldPlayer.name, stateManager);
        step.data.setCode(shareRet.code);
        break;
      case "wait": {
        await wait(step.data.amount);
        break;
      }
      case "clickOccurrence": {
        await clickOccurrence(step, stateManager);
        break;
      }
      case "deleteAllText": {
        await stateManager.ldPlayer.deleteAllText();
        break;
      }
    }
    await wait(500);
  }
}

async function clickOccurrence(step: Step, stateManager: StateManager) {
  if (step.step !== "clickOccurrence") return;
  if (!stateManager.currentImg)
    return console.error("clickOccurrence: no image");
  if (typeof stateManager.currentImg === "string")
    return console.error(
      `clickOccurrence: img is string: ${stateManager.currentImg}`
    );

  await stateManager.takeScreenshot();

  const anchor = anchors[step.data.anchorKey];
  const partialImage = await loadBuffer(anchor.img);
  if (!partialImage)
    return console.error(
      `clickOccurrence: no partial image: ${step.data.anchorKey}`
    );

  try {
    const { rect, score } = await getImageOccurrence(
      stateManager.currentImg,
      partialImage,
      { threshold: 0.85 }
    );

    //TODO: click on rect
    if (rect) {
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      await stateManager.ldPlayer.click(x, y);
    }

    console.log(
      `clickOccurrence: score: ${score}, rect: ${JSON.stringify(rect)}`
    );
  } catch (error) {
    console.error(`clickOccurrence: dont find element: ${step.data.anchorKey}`);
  }
}

async function find(step: Step, stateManager: StateManager) {
  if (step.step !== "find") return;
  const findedEllement = await findLoop(step.data.anchorKey, stateManager);
  if (findedEllement.error) {
    throw new Error(
      `name: ${stateManager.ldPlayer.name}, anchor: ${step.data.anchorKey}`
    );
  }
  return;
}
