import { loadBuffer } from "./memo-img";
import { createWorker, PSM } from "tesseract.js";
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

const rusWorker = await createWorker(["rus"], 2);
const engWorker = await createWorker(["eng"], 2);

// Настраиваем параметры Tesseract для лучшего распознавания имен
// PSM.SINGLE_LINE = Treat image as a single text line (лучше всего для имен игроков)
await rusWorker.setParameters({
  tessedit_pageseg_mode: PSM.SINGLE_LINE,
  tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ :_-",
});
await engWorker.setParameters({
  tessedit_pageseg_mode: PSM.SINGLE_LINE,
  tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :_-",
});

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

  // Увеличиваем масштаб до 6x для лучшего распознавания маленького текста
  // Особенно важно для тонких букв типа i, l, 1
  const scaleFactor = 3;
  
  // Предобработка изображения для улучшения распознавания
  const processedImgBuffer = await sharp(imgBuffer)
    // Сначала увеличиваем размер с качественной интерполяцией
    .resize({
      width: playerNameBoxSizes.width * scaleFactor,
      height: playerNameBoxSizes.height * scaleFactor,
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();

  if (config.debug) {
    await Bun.write(`./tmp/names/original-${Date.now()}.png`, imgBuffer);
    await Bun.write(`./tmp/names/processed-${Date.now()}.png`, processedImgBuffer);
  }

  // Распознаем с обоими языками параллельно
  const [ruRet, engRet] = await Promise.all([
    rusWorker.recognize(processedImgBuffer),
    engWorker.recognize(processedImgBuffer)
  ]);

  const ruUnfilteredName = ruRet.data.text;
  const name = ruUnfilteredName.replace(/[^a-zA-Z0-9а-яA-ЯёЁ]/g, "");
  const ruConfidence = ruRet.data.confidence;

  const engUnfilteredName = engRet.data.text;
  const engName = engUnfilteredName.replace(/[^a-zA-Z0-9а-яA-ЯёЁ]/g, "");
  const engConfidence = engRet.data.confidence;

  return { ru: name, eng: engName };
}
