import sharp from "sharp";
import { anchors } from "./anchors";
import type { Offset, AnchorKey } from './img.type';
import { getImagesSimilarity } from "@appium/opencv";
import { loadBuffer } from './memo-img';

const SIMILARITY_GOAL = 0.9;

export async function findAnchor(
  targetImg: string,
  anchorKey: AnchorKey,
  debug: boolean = false
): Promise<boolean> {
  const anchor = anchors[anchorKey];
  const similarity = await calculateSimilarityOpenCV(
    targetImg,
    anchor.img,
    anchor.offset
  );

  if (debug) {
    console.log()
  }

  return similarity >= SIMILARITY_GOAL;
}

export async function calculateSimilarityOpenCV(
  bigImagePath: string,
  smallImagePath: string,
  offset: Offset
) {
  const smallImage = await loadBuffer(smallImagePath);
  const bigImage = await loadBuffer(bigImagePath, offset);

  const { score, visualization } = await getImagesSimilarity(
    bigImage,
    smallImage,
  );

  if (visualization) {
    sharp(visualization).toFile(`./tmp/difference-${Date.now()}.png`);
  }

  return score;
}
