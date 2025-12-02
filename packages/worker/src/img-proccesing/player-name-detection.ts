import sharp from 'sharp'
import { createWorker, PSM } from 'tesseract.js'
import { loadBuffer } from './memo-img'

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

const rusWorker = await createWorker(['rus'], 2)
const engWorker = await createWorker(['eng'], 2)

// Настраиваем параметры Tesseract для лучшего распознавания имен
// PSM.SINGLE_LINE = Treat image as a single text line (лучше всего для имен игроков)
await rusWorker.setParameters({
  tessedit_pageseg_mode: PSM.SINGLE_LINE,
  tessedit_char_whitelist:
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ :_-',
})
await engWorker.setParameters({
  tessedit_pageseg_mode: PSM.SINGLE_LINE,
  tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :_-',
})

export async function getPlayerName(
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

  // Увеличиваем масштаб до 6x для лучшего распознавания маленького текста
  // Особенно важно для тонких букв типа i, l, 1
  const scaleFactor = 3

  // Предобработка изображения для улучшения распознавания
  const processedImgBuffer = await sharp(imgBuffer)
    // Сначала увеличиваем размер с качественной интерполяцией
    .resize({
      width: playerNameBoxSizes.width * scaleFactor,
      height: playerNameBoxSizes.height * scaleFactor,
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer()

  if (config.debug) {
    await Bun.write(`./tmp/names/original-${Date.now()}.png`, imgBuffer)
    await Bun.write(`./tmp/names/processed-${Date.now()}.png`, processedImgBuffer)
  }

  // Распознаем с обоими языками параллельно
  const [ruRet, engRet] = await Promise.all([
    rusWorker.recognize(processedImgBuffer),
    engWorker.recognize(processedImgBuffer),
  ])

  const ruUnfilteredName = ruRet.data.text
  const name = ruUnfilteredName.replace(/[^a-zA-Z0-9а-яA-ЯёЁ]/g, '')

  const engUnfilteredName = engRet.data.text
  const engName = engUnfilteredName.replace(/[^a-zA-Z0-9а-яA-ЯёЁ]/g, '')

  return { ru: name, eng: engName }
}
