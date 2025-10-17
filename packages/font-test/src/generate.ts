import { createCanvas, registerFont } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { canvasSize } from './coords';

// Регистрируем шрифт Eurostile
const fontPath = join(__dirname, '../font/Eurostile-Med.ttf');
registerFont(fontPath, { family: 'Eurostile' });

export interface RenderTextOptions {
  text: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  padding?: number;
  outputPath?: string;
  letterSpacing?: number; // Интервал после первого символа в пикселях
}



export async function renderTextToImage(options: RenderTextOptions): Promise<Buffer> {
  const {
    text,
    fontSize = 8,
    fontColor = '#ffffff',
    backgroundColor = 'transparent',
    outputPath,
    letterSpacing = 0
  } = options;

  // // Создаем временный canvas для измерения текста
  const measureCanvas = createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = `${fontSize}px Eurostile`;

  const metrics = measureCtx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = fontSize;

  // Создаем основной canvas с размерами текста + отступы
  const canvas = createCanvas(textWidth, textHeight);
  const ctx = canvas.getContext('2d');

  // Устанавливаем фон
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Настраиваем шрифт и цвет текста
  ctx.font = `${fontSize}px Eurostile`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; // Изменяем на left для ручного позиционирования

  // Рендерим текст с межсимвольным интервалом
  if (letterSpacing === 0) {
    // Если интервал не задан, рендерим обычным способом
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, Math.round(canvas.height / 2) + 1);
  } else {
    // Рендерим каждый символ отдельно с letterSpacing только для первого символа
    const chars = text.split('');
    let totalWidth = 0;

    // Вычисляем общую ширину текста с интервалами
    for (let i = 0; i < chars.length; i++) {
      const charWidth = ctx.measureText(chars[i]).width;
      totalWidth += charWidth;
      // Добавляем letterSpacing только после первого символа
      if (i === 0) {
        totalWidth += letterSpacing;
      }
    }

    // Начинаем рендеринг с центра, смещаясь влево на половину ширины
    let currentX = (canvas.width - totalWidth) / 2;

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], currentX, Math.round(canvas.height / 2) + 1);
      currentX += ctx.measureText(chars[i]).width;
      // Добавляем letterSpacing только после первого символа
      if (i === 0) {
        currentX += letterSpacing;
      }
    }
  }

  // Получаем буфер изображения
  const buffer = canvas.toBuffer('image/png');

  // Сохраняем файл если указан путь
  if (outputPath) {
    writeFileSync(outputPath, buffer);
  }

  return buffer;
}

export async function slimRenderTextToImage(options: RenderTextOptions): Promise<Buffer> {
  const {
    text,
    fontSize = 8,
    fontColor = '#ffffff',
    backgroundColor = 'transparent',
    outputPath
  } = options;

  // Создаем временный canvas для измерения текста
  const measureCanvas = createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = `${fontSize}px Eurostile`;

  const metrics = measureCtx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = fontSize;

  // Создаем основной canvas с размерами текста + отступы
  const canvas = createCanvas(textWidth, textHeight);
  const ctx = canvas.getContext('2d');

  // Устанавливаем фон
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Настраиваем шрифт и цвет текста
  ctx.font = `${fontSize}px Eurostile`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Рендерим текст
  ctx.fillText(text, canvas.width / 2, Math.round(canvas.height / 2) + 1);

  // Получаем буфер изображения
  const buffer = canvas.toBuffer('image/png');

  // Сохраняем файл если указан путь
  if (outputPath) {
    writeFileSync(outputPath, buffer);
  }

  return buffer;
}

// Функция для быстрого рендеринга с настройками по умолчанию
export async function quickRender(text: string, outputPath?: string, letterSpacing?: number): Promise<Buffer> {
  return renderTextToImage({
    text,
    fontSize: 8,
    fontColor: '#ffffff',
    backgroundColor: 'transparent',
    outputPath,
    letterSpacing
  });
}
