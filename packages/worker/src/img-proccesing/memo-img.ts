import sharp from "sharp";
import type { Offset } from "./img.type";
import { anchors } from "./anchors";
import { log } from "../utils/log";

const imgMemo: { path: string; buffer: Buffer<ArrayBufferLike> }[] = [];
const anchorsMemo: Map<string, Buffer<ArrayBufferLike>> = new Map();

const MAX_MEMOSIZE = 40;

const anchorRex = /.*anchors.*/;

await loadAnchors();

async function loadAnchors() {
  await Promise.all(
    Object.values(anchors).map(async (anchor: { img: string }) =>
      loadBuffer(anchor.img)
    )
  );
}

function getFromMemo(
  imgPath: string,
  offset?: Offset
): Buffer<ArrayBufferLike> | undefined {
  if (anchorRex.test(imgPath)) {
    return anchorsMemo.get(imgPath);
  }
  const toFined = imgPath + offsetToString(offset);
  const fined = imgMemo.find((memo) => memo.path === toFined);
  return fined?.buffer;
}
function saveToMemo(
  imgPath: string,
  buffer: Buffer<ArrayBufferLike>,
  offset?: Offset
) {
  if (anchorRex.test(imgPath)) {
    return anchorsMemo.set(imgPath, buffer);
  }
  const toSave = imgPath + offsetToString(offset);
  if (imgMemo.length >= MAX_MEMOSIZE) {
    imgMemo.shift();
  }
  imgMemo.push({ path: toSave, buffer });
}

function offsetToString(offset?: Offset): string {
  if (!offset) return "";
  return `${offset.height}-${offset.left}-${offset.top}-${offset.width}`;
}

export async function loadBuffer(
  imgPath: string | Buffer | null,
  offset?: Offset
): Promise<Buffer<ArrayBufferLike> | null> {
  let buffer: Buffer;

  if (!imgPath) {
    return null;
  }

  if (typeof imgPath === "string") {
    const memo = getFromMemo(imgPath, offset);
    if (memo) {
      return memo;
    }
    // Загружаем большое изображение
    if (offset) {
      buffer = await sharp(
        await sharp(imgPath).extract(offset).toBuffer()
      ).toBuffer();
    } else {
      buffer = await sharp(imgPath).toBuffer();
    }
    if (typeof imgPath === "string") {
      saveToMemo(imgPath, buffer);
    }
    return buffer;
  }

  if (offset) {
    return sharp(await sharp(imgPath).extract(offset).toBuffer()).toBuffer();
  }

  return imgPath;
}
