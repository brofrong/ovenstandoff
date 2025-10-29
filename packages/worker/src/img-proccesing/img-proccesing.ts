import sharp from "sharp";
import { anchors } from "./anchors";
import type { Offset, AnchorKey } from "./img.type";
import { getImagesSimilarity } from "@appium/opencv";
import { loadBuffer } from "./memo-img";
import { log } from "../utils/log";
import type { Anchor } from "../anchors/anchor.type";

const SIMILARITY_GOAL = 0.98;

export async function findAnchor(
  targetImg: Buffer | string | null,
  anchorKey: AnchorKey,
  debug: boolean = false
): Promise<boolean> {
  if (!targetImg) {
    return false;
  }

  const anchor = anchors[anchorKey];
  const similarity = await calculateSimilarityOpenCV(
    targetImg,
    anchor.img,
    anchor.offset,
    debug
  );

  if (debug) {
    log.info(`${anchorKey} similarity: ${similarity}`);
  }
  return similarity >= SIMILARITY_GOAL;
}

export async function findAnchorV2(
  targetImg: Buffer | string | null,
  anchor: Anchor,
  debug: boolean = false
): Promise<boolean> {
  if (!targetImg) {
    return false;
  }
  try {
    const similarity = await calculateSimilarityOpenCV(
      targetImg,
      anchor.img,
      { left: anchor.offset.x, top: anchor.offset.y, width: anchor.offset.width, height: anchor.offset.height },
      debug
    );
    if (debug) {
      log.info(`${anchor.img} similarity: ${similarity}`);
    }
    return similarity >= SIMILARITY_GOAL;
  } catch (error) {
    log.error(`findAnchorV2: error: ${error} anchor: ${anchor.img} offset: ${JSON.stringify(anchor.offset)}`);
    return false;
  }
}

export async function calculateSimilarityOpenCV(
  bigImageBuffer: Buffer | string,
  smallImagePath: string,
  offset: Offset,
  debug: boolean = false
) {
  if (!bigImageBuffer || !smallImagePath) {
    return 0;
  }

  const smallImage = await loadBuffer(smallImagePath);
  const bigImage = await loadBuffer(bigImageBuffer, offset);

  if (!smallImage || !bigImage) {
    return 0;
  }

  // * - `TM_CCOEFF`
  // * - `TM_CCOEFF_NORMED` (default)
  // * - `TM_CCORR`
  // * - `TM_CCORR_NORMED`
  // * - `TM_SQDIFF`
  // * - `TM_SQDIFF_NORMED`

  const { score, visualization } = await getImagesSimilarity(
    bigImage,
    smallImage,
    { visualize: debug, method: "TM_CCORR_NORMED" }
  );

  if (visualization) {
    sharp(visualization).toFile(`./tmp/difference-${Date.now()}.png`);
  }

  return score;
}
