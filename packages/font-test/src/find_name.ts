import { getImageOccurrence, getImagesSimilarity, } from '@appium/opencv';
import sharp from 'sharp';
import { coords } from './coords';
import { renderTextToImage, renderTextToImageFull } from "./generate";
import ssim from "ssim.js";

/**
 * Вычисляет Mean Squared Error (MSE) между двумя изображениями
 * @param img1 - первое изображение в виде Buffer
 * @param img2 - второе изображение в виде Buffer
 * @returns MSE значение (чем меньше, тем больше сходство)
 */
async function calculateMSE(img1: Buffer, img2: Buffer): Promise<number> {
  // Получаем данные пикселей для обоих изображений
  const { data: data1, info: info1 } = await sharp(img1).raw().toBuffer({ resolveWithObject: true });
  const { data: data2, info: info2 } = await sharp(img2).raw().toBuffer({ resolveWithObject: true });

  // Проверяем, что изображения имеют одинаковые размеры
  if (info1.width !== info2.width || info1.height !== info2.height) {
    throw new Error('Images must have the same dimensions for MSE calculation');
  }

  const width = info1.width;
  const height = info1.height;
  const channels = info1.channels;
  const totalPixels = width * height * channels;

  let sumSquaredDiff = 0;

  // Вычисляем сумму квадратов разностей
  for (let i = 0; i < totalPixels; i++) {
    const diff = data1[i] - data2[i];
    sumSquaredDiff += diff * diff;
  }

  // Возвращаем среднее значение квадратов разностей
  return sumSquaredDiff / totalPixels;
}

export async function findName(img: Buffer, possibleNames: string[], coordsIndex: number) {
  const scores: { score: number, name: string }[] = [];
  const renderedNames = await renderNames(possibleNames);

  const coord = coords[coordsIndex];

  if (!coord) {
    return null;
  }
  const croppedImage = await sharp(img).extract({
    left: coord.topLeft.x,
    top: coord.topLeft.y,
    width: coord.bottomRight.x - coord.topLeft.x,
    height: coord.bottomRight.y - coord.topLeft.y,
  }).grayscale().normalise({ lower: 80, upper: 95 }).toBuffer();

  for (const renderedName of renderedNames) {

    try {
      const { visualization, score } = await getImageOccurrence(croppedImage, renderedName.img, {
        threshold: 0.4,
        visualize: true,
      });
      scores.push({ name: renderedName.name, score });
    } catch (error) {
      continue;
    }
  }
  scores.sort((a, b) => b.score - a.score);

  console.log(scores);

  return scores.at(0) ?? null;
}


export async function findNameSimilar(img: Buffer, possibleNames: string[], coordsIndex: number) {
  const coord = coords[coordsIndex];

  if (!coord) {
    return null;
  }
  const croppedImage = await sharp(img).extract({
    left: coord.topLeft.x,
    top: coord.topLeft.y,
    width: coord.bottomRight.x - coord.topLeft.x,
    height: coord.bottomRight.y - coord.topLeft.y,
  }).grayscale().normalise({ lower: 80, upper: 95 }).toBuffer();

  await sharp(croppedImage).toFile(`./img/cropped/${coordsIndex}.png`);


  const scores: { score: number, name: string }[] = [];

  for (const possibleName of possibleNames) {
    const renderedName = await renderTextToImageFull({
      text: possibleName,
      fontSize: 12,
      fontColor: '#FFFFFF',
      backgroundColor: '#000000',
      outputPath: `./img/render/${possibleName}.png`,
    });


    // * Acceptable values are:
    // * - `TM_CCOEFF`
    // * - `TM_CCOEFF_NORMED` (default)
    // * - `TM_CCORR`
    // * - `TM_CCORR_NORMED`
    // * - `TM_SQDIFF`
    // * - `TM_SQDIFF_NORMED`
    // * 
    const a = await getImagesSimilarity(croppedImage, renderedName, {
      method: "TM_CCOEFF",
      visualize: true,
    });
    if (a.visualization) {
      await sharp(a.visualization).toFile(`./img/diff/${possibleName}.png`);
    }
    scores.push({ score: a.score, name: possibleName });
  }

  scores.sort((a, b) => b.score - a.score);
  console.log(scores);
  return scores.at(0) ?? null;
}

/**
 * Ищет имя в изображении используя Mean Squared Error (MSE)
 * @param img - исходное изображение
 * @param possibleNames - список возможных имен для поиска
 * @param coordsIndex - индекс координат для обрезки изображения
 * @returns объект с найденным именем и его MSE score (чем меньше, тем лучше)
 */
export async function findNameMSE(img: Buffer, possibleNames: string[], coordsIndex: number) {
  const coord = coords[coordsIndex];

  if (!coord) {
    return null;
  }

  // Обрезаем и обрабатываем изображение
  const croppedImage = await sharp(img).extract({
    left: coord.topLeft.x,
    top: coord.topLeft.y,
    width: coord.bottomRight.x - coord.topLeft.x,
    height: coord.bottomRight.y - coord.topLeft.y,
  }).grayscale().normalise({ lower: 80, upper: 95 }).toBuffer();

  // Сохраняем обрезанное изображение для отладки
  await sharp(croppedImage).toFile(`./img/cropped/${coordsIndex}.png`);

  const scores: { score: number, name: string }[] = [];

  for (const possibleName of possibleNames) {
    try {
      // Рендерим имя в изображение
      const renderedName = await renderTextToImageFull({
        text: possibleName,
        fontSize: 12,
        fontColor: '#FFFFFF',
        backgroundColor: '#000000',
        outputPath: `./img/render/${possibleName}.png`,
      });

      // Вычисляем MSE между обрезанным изображением и отрендеренным именем
      const mse = await calculateMSE(croppedImage, renderedName);

      // Для MSE чем меньше значение, тем лучше сходство
      // Инвертируем значение для консистентности с другими методами (больше = лучше)
      const invertedScore = 1 / (1 + mse);

      scores.push({ score: invertedScore, name: possibleName });

      console.log(`MSE for ${possibleName}: ${mse.toFixed(4)}, inverted score: ${invertedScore.toFixed(4)}`);
    } catch (error) {
      console.error(`Error processing ${possibleName}:`, error);
      continue;
    }
  }

  // Сортируем по убыванию score (лучшие совпадения первыми)
  scores.sort((a, b) => b.score - a.score);

  console.log('MSE Results:', scores);

  return scores.at(0) ?? null;
}

export async function renderNames(names: string[]): Promise<{ img: Buffer, name: string }[]> {
  return Promise.all(names.map(async name => (
    {
      img: await renderTextToImage({
        text: name,
        fontSize: 12,
        fontColor: '#FFFFFF',
        backgroundColor: '#000000',
        letterSpacing: 0,
        // outputPath: `./img/render/${name}.png`,
      }),
      name: name,
    }
  )));
}
