import { expect, test } from 'bun:test'
import path from 'node:path'
import sharp from 'sharp'
import { findNameMSE, findNameSimilar } from '../src/find_name'

async function _testImage(path: string, names: string[]) {
  const img = await sharp(path).toBuffer()
  for (let i = 0; i < names.length; i++) {
    const result = await findNameSimilar(img, names, i)
    console.log(result)
    expect(result?.name).toBe(names[i])
  }
}

async function testImageMSE(path: string, names: string[]) {
  const img = await sharp(path).toBuffer()
  for (let i = 0; i < names.length; i++) {
    const result = await findNameMSE(img, names, i)
    console.log(`MSE result for ${names[i]}:`, result)
    expect(result?.name).toBe(names[i])
  }
}

// test("find names in img-names-1.png", async () => {
//   const names = ["Balagan", "Midoria", "Danix", 'I1mboo', "Funny", "Dracula", "Militiss", "Sneepy", "YD:DEHICUA", "Pushtolet"];
//   await testImage(path.join(process.cwd(), "./test-images/img-names-1.png"), names);
// });

test('find names in img-names-1.png using MSE', async () => {
  const names = [
    'Balagan',
    'Midoria',
    'Danix',
    'I1mboo',
    'Funny',
    'Dracula',
    'Militiss',
    'Sneepy',
    'YD:DEHICUA',
    'Pushtolet',
  ]
  await testImageMSE(path.join(process.cwd(), './test-images/img-names-1.png'), names)
})

// test("find names in img-names-2.png", async () => {
//   const names = ["CH Auto 1", "CH Auto 2"];
//   await testImage(path.join(process.cwd(), "./test-images/img-names-2.png"), names);
// });

// test("find names in img-names-3.png", async () => {
//   const names = ["Андикон", "1234"];
//   await testImage(path.join(process.cwd(), "./test-images/img-names-3.png"), names);
// });

// test("find names in img-names-6.png", async () => {
//   const names = [
//     "Balagan",
//     "Midoria",
//     "Dan1x",
//     "I1mboo",
//     "Militriss",
//     "YT:DEHICUA",
//     "Pishtolet",
//     "Pen1lo",
//     "Sneppy",
//     "Funny",
//   ];
//   await testImage(path.join(process.cwd(), "./test-images/img-names-4.png"), names);
// });
