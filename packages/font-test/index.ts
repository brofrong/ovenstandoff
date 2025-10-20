import sharp from "sharp";
import path from "path";
import { coords } from "./src/coords";
import { renderTextToImage, renderTextToImageFull, slimRenderTextToImage } from './src/generate';
import { getImageOccurrence, getImagesSimilarity } from "@appium/opencv";
import { findNameMSE } from "./src/find_name";

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

for (const name of names) {
  const renderedImage = await renderTextToImageFull({
    text: name,
    fontSize: 12,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
  });

  await sharp(renderedImage).blur(0.5).toFile(path.join(process.cwd(), `./img/render/${name}.png`));
}


// let index = 0;
// for (const coord of coords) {

//   const date = Date.now();
//   const croppedImage = await sharp(imgPath).extract({
//     left: coord.topLeft.x,
//     top: coord.topLeft.y,
//     width: coord.bottomRight.x - coord.topLeft.x,
//     height: coord.bottomRight.y - coord.topLeft.y,
//   }).grayscale().normalise({ lower: 80, upper: 95 }).toBuffer();

//   const scores = [];

//   for (const name of names) {
//     const renderedImage = await renderTextToImage({
//       text: name,
//       fontSize: 12,
//       fontColor: '#FFFFFF',
//       backgroundColor: '#000000',
//       letterSpacing: -1, // Уменьшаем межстрочное расстояние на 2 пикселя
//       outputPath: path.join(process.cwd(), `./img/render/${name}.png`),
//     });


//     const { visualization, score } = await getImageOccurrence(croppedImage, renderedImage, {
//       threshold: 0.0,
//       // visualize: true,
//     });
//     scores.push({ name, score });
//     // console.log(`${name} - x: ${coord.topLeft.x} - y: ${coord.topLeft.y} - score: ${score}`);
//     if (visualization) {
//       sharp(visualization).toFile(`./img/diff/${date}-${name}-${coord}.png`);
//     }
//   }

//   scores.sort((a, b) => b.score - a.score);
//   console.log(`best: ${scores.at(0)?.name} - ${index} - ${scores.at(0)?.score}`);
//   index++;
// }

// Пример использования MSE функции
console.log("Testing MSE function...");
const testImg = await sharp(imgPath).toBuffer();
const mseResult = await findNameMSE(testImg, names, 0);
console.log("MSE Result:", mseResult);

