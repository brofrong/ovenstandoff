import clipboard from "clipboardy";
import { wait } from "../utils/utils";
import type { StateManager } from "../state-manager/state-manager";
import { runSteps } from "../state-manager/steps";

const queue = new Map<
  string,
  { res: (ret: ReturnShare) => void; stateManager: StateManager }
>();

type ReturnShare = { code: string };

export async function share(
  name: string,
  stateManager: StateManager
): Promise<ReturnShare> {
  return new Promise(async (res, rej) => {
    if (queue.size) {
      queue.set(name, { res, stateManager });
    } else {
      queue.set(name, { res, stateManager });
      try {
        shareSteps(name);
      } catch (e) {
        rej(e);
      }
    }
  });
}

async function shareSteps(name: string) {
  const queueObject = queue.get(name);
  if (!queueObject) throw new Error(`share queue don't have ${name}`);
  const { stateManager, res } = queueObject;

  await runSteps(
    [
      // { step: "find", data: { x: "share_room_code" } },
      { step: "click", data: { x: 1238, y: 94 } },
      { step: "wait", data: { amount: 500 } },
      { step: "click", data: { x: 99, y: 588 } }, // click away
    ],
    stateManager
  );

  const code = await clipboard.read();

  if (code === "clear") {
    await wait(2000);
    return await shareSteps(name);
  }

  clipboard.writeSync("clear");

  res({ code });
  await wait(2000);
  queue.delete(name);
  if (queue.size) {
    const nextName = queue.keys().next();
    if (nextName.value) {
      shareSteps(nextName.value);
    }
  }
}

// async function shareSteps(name: string) {
//   const queueObject = queue.get(name);
//   if (!queueObject) throw new Error(`share queue don't have ${name}`);
//   const { ldPlayer, res } = queueObject;

//   const screen = await ldPlayer.screenShot();

//   const shareIcon = await sharp(anchors["share_icon"].img).toBuffer();
//   const shareMenu = await sharp(
//     await sharp(screen).extract(ShareMenuJSON).toBuffer()
//   ).toBuffer();

//   const { rect: _rect, score } = await getImageOccurrence(shareMenu, shareIcon);

//   const rect = _rect as {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   };
// //   https://link.standoff2.com/ru/lobby/join/6809125ebcf0ef13c225acce?token=Dq9Uq6V9Uys29cHkowj4W0wYjFHGacVM

//   if (score < 0.9) return res({ code: "0" });
//   const menuXY = ShareMenuJSON;
//   await ldPlayer.click(
//     menuXY.left + rect.x + Math.round(rect.width / 2),
//     menuXY.top + rect.y + Math.round(rect.height / 2)
//   );
//   await wait(2000);
//   const code = await clipboard.read();
//   if(code === 'clear') {

//     await runSteps([
//           {step: 'find', data: {anchorKey: 'share_room_code'}},
//           {step: 'click', data: {anchorKey: 'share_room_code'}},
//           {step: 'wait', data: {amount: 500}},

//         ], ldPlayer);
//     return shareSteps(name);
//   }
//   clipboard.writeSync('clear');
//   res({ code });
//   await wait(5000);
//   queue.delete(name);
//   if(queue.size) {
//     const nextName = queue.keys().next();
//     if(nextName.value) {

//         shareSteps(nextName.value);
//     }
//   }
// }
