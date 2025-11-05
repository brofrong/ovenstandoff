import { renderTextToImage, quickRender } from './src/generate';

const names = [
  'BalaganSky',
  'Pupo4ek',
  'pen1b',
  'Militriss',
  'Relax',
  'Dracula',
  'Michaka',
  'Dracula1',
  'MiХАЛЫ4'
];

for (const name of names) {
  await example(name);
}

async function example(name: string) {
  try {
    // Простой рендеринг с настройками по умолчанию
    // console.log('Rendering "TEST TEXT" with default settings...');
    // await quickRender('TEST TEXT', './test-output.png');

    // Рендеринг с кастомными настройками
    console.log(`Rendering ${name} with custom settings...`);
    await renderTextToImage({
      text: name,
      fontSize: 12,
      fontColor: '#ffffff',
      backgroundColor: '#000000',
      padding: 5,
      outputPath: `./img/${name}.png`
    });

    // Рендеринг без сохранения файла (только в память)
    console.log('Rendering to memory buffer...');
    // const buffer = await renderTextToImage({
    //   text: 'MEMORY TEXT',
    //   fontSize: 8,
    //   fontColor: '#00ff00'
    // });

    // console.log(`Buffer size: ${buffer.length} bytes`);
    // console.log('All examples completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}
