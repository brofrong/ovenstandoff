import { loadBuffer } from "./memo-img";
import { createWorker } from "tesseract.js";
import sharp from "sharp";

const playerNameBoxSizes = {
  width: 83,
  height: 14,
} as const;

export const teamCoords = {
  ct: {
    free_slot_1: { x: 536, y: 312 },
    free_slot_2: { x: 617, y: 312 },
    free_slot_3: { x: 698, y: 312 },
    free_slot_4: { x: 779, y: 312 },
    free_slot_5: { x: 589, y: 312 },
    free_slot_6: { x: 536, y: 363 },
    free_slot_7: { x: 617, y: 363 },
    free_slot_8: { x: 698, y: 363 },
    free_slot_9: { x: 779, y: 363 },
    free_slot_10: { x: 589, y: 363 },
  },
  t: {
    free_slot_1: { x: 536, y: 312 },
    free_slot_2: { x: 617, y: 312 },
    free_slot_3: { x: 698, y: 312 },
    free_slot_4: { x: 779, y: 312 },
    free_slot_5: { x: 590, y: 312 },

    free_slot_6: { x: 536, y: 362 },
    free_slot_7: { x: 617, y: 362 },
    free_slot_8: { x: 698, y: 362 },
    free_slot_9: { x: 779, y: 362 },
    free_slot_10: { x: 590, y: 362 },
  },
} as const;

const playerNameCoords: Record<string, { x: number; y: number }> = {
  free_slot_1: { x: 343, y: 105 },
  free_slot_2: { x: 430, y: 105 },
  free_slot_3: { x: 517, y: 105 },
  free_slot_4: { x: 604, y: 105 },
  free_slot_5: { x: 691, y: 105 },

  free_slot_6: { x: 343, y: 175 },
  free_slot_7: { x: 430, y: 175 },
  free_slot_8: { x: 517, y: 175 },
  free_slot_9: { x: 604, y: 175 },
  free_slot_10: { x: 691, y: 175 },
};

export async function getPlayerName(
  slotName: string,
  img: string | Buffer | null,
  config: { debug: boolean } = { debug: false }
) {
  const coord = playerNameCoords[slotName];
  if (!coord) {
    return null;
  }
  const imgBuffer = await loadBuffer(img, {
    left: coord.x,
    top: coord.y,
    width: playerNameBoxSizes.width,
    height: playerNameBoxSizes.height,
  });
  if (!imgBuffer) {
    return null;
  }

  const upscaledImgBuffer = await sharp(imgBuffer)
    .resize({
      width: playerNameBoxSizes.width * 2,
      height: playerNameBoxSizes.height * 2,
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();

  if (config.debug) {
    await Bun.write(`./tmp/names/name${Date.now()}img.png`, upscaledImgBuffer);
  }

  const worker = await createWorker(["eng"]);
  const ret = await worker.recognize(upscaledImgBuffer);
  await worker.terminate();
  const unfilteredName = ret.data.text;

  // remove all non-latin characters
  const name = unfilteredName.replace(/[^a-zA-Z0-9а-яA-ЯёЁ]/g, "");

  return name;
}
