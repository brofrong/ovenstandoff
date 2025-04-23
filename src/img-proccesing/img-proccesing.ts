import sharp from "sharp";
import { anchors } from "./anchors";
import type { Offset } from "./offset.type";
import { getImagesSimilarity } from "@appium/opencv";

const MAX_MEMOSIZE = 40;
const SIMILARITY_GOAL = 0.9;

const imgMemo: { path: string; buffer: Buffer<ArrayBufferLike> }[] = [];

export async function findAnchor(
  targetImg: string,
  anchorKey: keyof typeof anchors
): Promise<boolean> {
  const anchor = anchors[anchorKey];
  const similarity = await calculateSimilarity(
    targetImg,
    anchor.img,
    anchor.offset
  );
  // console.log({ anchor, similarity });
  return similarity >= SIMILARITY_GOAL;
}

export async function calculateSimilarity(
  bigImagePath: string,
  smallImagePath: string,
  offset: Offset
) {
  const [bigImage, smallImage] = await Promise.all([
    loadBuffer(bigImagePath, offset),
    loadBuffer(smallImagePath),
  ]);

  const totalCount = offset.height * offset.width;
  let diffCount = 0;

  // Сравниваем пиксели
  for (let i = 0; i < bigImage.length && i < smallImage.length; i += 3) {
    const smallPixel = Math.round((smallImage[i] / 256) * 16);
    const bigPixel = Math.round((bigImage[i] / 256) * 16);
    if (bigPixel > smallPixel + 1 || bigPixel < smallPixel - 1) {
      diffCount++;
    }
  }

  // Вычисляем коэффициент схожести как отношение совпавших пикселей
  const similarity = 1 - diffCount / totalCount;
  if (similarity < SIMILARITY_GOAL) {
    const ts = Date.now();
    await sharp(bigImagePath)
      .toColourspace("b-w")
      .extract(offset)
      .toFile(`./tmp/${ts}-big.png`);
    await sharp(smallImagePath)
      .toColourspace("b-w")
      .toFile(`./tmp/${ts}-small.png`);
  }
  return similarity;
}

export async function calculateSimilarityOpenCV(
  bigImagePath: string,
  smallImagePath: string,
  offset: Offset
) {
  const smallImage = await sharp(smallImagePath).toBuffer();
  const bigImage = await sharp(
    await sharp(bigImagePath).extract(offset).toBuffer()
  ).toBuffer();

  const { score, visualization } = await getImagesSimilarity(
    bigImage,
    smallImage,
    // { visualize: true }
  );
  if (visualization) {
    sharp(visualization).toFile(`./tmp/diffrence-${Date.now()}.png`);
  }

  return score;
}

function getFromMemo(imgPath: string): Buffer<ArrayBufferLike> | undefined {
  const finded = imgMemo.find((memo) => memo.path === imgPath);
  return finded?.buffer;
}
function saveToMemo(imgPath: string, buffer: Buffer<ArrayBufferLike>) {
  if (imgMemo.length >= MAX_MEMOSIZE) {
    imgMemo.shift();
  }
  imgMemo.push({ path: imgPath, buffer });
}

async function loadBuffer(imgPath: string, offset?: Offset) {
  // Загружаем большое изображение
  let buffer = getFromMemo(imgPath);
  if (!buffer) {
    if (offset) {
      buffer = await sharp(imgPath)
        .toColourspace("b-w")
        .extract(offset)
        .raw()
        .toBuffer();
    } else {
      buffer = await sharp(imgPath).toColourspace("b-w").raw().toBuffer();
    }
    saveToMemo(imgPath, buffer);
  }

  return buffer;
}
