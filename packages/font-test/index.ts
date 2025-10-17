import sharp from "sharp";
import path from "path";
import { coords } from "./src/coords";
import { renderTextToImage, slimRenderTextToImage } from './src/generate';
import { getImageOccurrence, getImagesSimilarity } from "@appium/opencv";

const names = [
  "Balagan",
  "Midoria",
  "Dan1x",
  "I1mboo",
  "Militriss",
  "YT:DEHICUA",
  "Pishtolet",
  "Pen1lo",
  "Sneppy",
  "Funny",
] as const;

const imgPath = path.join(process.cwd(), `./img/img-names.png`);

// async function cropImage(imgName: string, slot: number) {
//   const coord = coords[slot];
//   await sharp(imgPath).extract({
//     left: coord.topLeft.x,
//     top: coord.topLeft.y,
//     width: coord.bottomRight.x - coord.topLeft.x,
//     height: coord.bottomRight.y - coord.topLeft.y,
//   }).grayscale().normalise({ lower: 80, upper: 95 }).toFile(path.join(process.cwd(), `./img/cropped/${imgName}.png`));
// };
// await cropImage('Balagan', 0);


// slimRenderTextToImage({ text: 'Balagan', fontSize: 12, fontColor: '#FFFFFF', backgroundColor: '#000000', outputPath: path.join(process.cwd(), `./img/render/Balagan.png`) });

let index = 0;
for (const coord of coords) {

  const date = Date.now();
  const croppedImage = await sharp(imgPath).extract({
    left: coord.topLeft.x,
    top: coord.topLeft.y,
    width: coord.bottomRight.x - coord.topLeft.x,
    height: coord.bottomRight.y - coord.topLeft.y,
  }).grayscale().normalise({ lower: 80, upper: 95 }).toBuffer();

  const scores = [];

  for (const name of names) {
    const renderedImage = await renderTextToImage({
      text: name,
      fontSize: 12,
      fontColor: '#FFFFFF',
      backgroundColor: '#000000',
      letterSpacing: -1, // Уменьшаем межстрочное расстояние на 2 пикселя
      outputPath: path.join(process.cwd(), `./img/render/${name}.png`),
    });


    // * - `TM_CCOEFF`
    // * - `TM_CCOEFF_NORMED` (default)
    // * - `TM_CCORR`
    // * - `TM_CCORR_NORMED`
    // * - `TM_SQDIFF`
    // * - `TM_SQDIFF_NORMED`
    // const { score, visualization } = await getImagesSimilarity(
    //   croppedImage,
    //   renderedImage,
    //   {
    //     visualize: true,
    //     method: "TM_CCORR",
    //   }
    // );
    const { visualization, score } = await getImageOccurrence(croppedImage, renderedImage, {
      threshold: 0.0,
      // visualize: true,
    });
    scores.push({ name, score });
    // console.log(`${name} - x: ${coord.topLeft.x} - y: ${coord.topLeft.y} - score: ${score}`);
    if (visualization) {
      sharp(visualization).toFile(`./img/diff/${date}-${name}-${coord}.png`);
    }
  }

  scores.sort((a, b) => b.score - a.score);
  console.log(`best: ${scores.at(0)?.name} - ${index} - ${scores.at(0)?.score}`);
  index++;
}



