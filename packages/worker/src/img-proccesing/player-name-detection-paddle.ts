import sharp from 'sharp'
import { createWorker, PSM } from 'tesseract.js'
import { loadBuffer } from './memo-img'
import { PaddleOcrService } from "ppu-paddle-ocr";

const playerNameBoxSizes = {
  width: 109,
  height: 24,
} as const

export const playerNameCoords: Record<string, { x: number; y: number, width: number; height: number }> = {
  free_slot_1: { x: 459, y: 136, width: 109, height: 24 },
  free_slot_2: { x: 575, y: 136, width: 109, height: 24 },
  free_slot_3: { x: 690, y: 136, width: 109, height: 24 },
  free_slot_4: { x: 806, y: 136, width: 109, height: 24 },
  free_slot_5: { x: 923, y: 136, width: 109, height: 24 },

  free_slot_6: { x: 459, y: 227, width: 109, height: 24 },
  free_slot_7: { x: 575, y: 227, width: 109, height: 24 },
  free_slot_8: { x: 690, y: 227, width: 109, height: 24 },
  free_slot_9: { x: 806, y: 227, width: 109, height: 24 },
  free_slot_10: { x: 923, y: 227, width: 109, height: 24 },
}

// Create a new instance of the service
const service = new PaddleOcrService();
await service.initialize();

export async function getPlayerNamePaddle(
  slotName: string | 'gnames',
  img: string | Buffer | null,
  config: { debug: boolean } = { debug: false }
) {
  let coord = playerNameCoords[slotName];
  if (!coord && slotName === 'gnames') {
    coord = { x: 0, y: 68, width: 129, height: 27 };
  }
  if (!coord) {
    return null
  }
  const imgBuffer = await loadBuffer(img, {
    left: coord.x,
    top: coord.y,
    width: playerNameBoxSizes.width,
    height: playerNameBoxSizes.height,
  })
  if (!imgBuffer) {
    return null
  }

  if (config.debug) {
    await Bun.write(`./tmp/names/original-${Date.now()}.png`, imgBuffer)
    await Bun.write(`./tmp/names/processed-${Date.now()}.png`, imgBuffer)
  }

  const arrayBuffer = new Uint8Array(imgBuffer).buffer;

  try {
    // Распознаем текст
    const result = await service.recognize(arrayBuffer);

    return result.text;
  } catch (error) {
    return null;
  }
}
