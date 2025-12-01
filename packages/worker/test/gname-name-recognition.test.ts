import { expect, test } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getPlayerName } from '../src/img-proccesing/player-name-detection';
import { fuzzySearchNames } from '../src/utils/utils';
import { en, Faker } from '@faker-js/faker';

const faker = new Faker({ locale: [en] });

function getNameFromImgFileName(imgFileName: string) {
  const name = imgFileName.split('-')[0];
  return name;
}

function generateNames(correctName: string): string[] {
  const names = [correctName];
  for (let i = 0; i < 19; i++) {
    const name = Math.random() > 0.5 ? faker.person.firstName() : faker.person.lastName();
    if (name === correctName) {
      continue;
    }
    names.push(name);
  }

  return names;
}
test('gname name recognition', async () => {
  const imgFolder = path.join(process.cwd(), '../../img/gnames');
  const imgFiles = await fs.readdir(imgFolder);
  for (const imgFile of imgFiles) {
    const imgPath = path.join(imgFolder, imgFile);
    const img = await fs.readFile(imgPath);
    const name = await getNameFromImgFileName(imgFile);
    if (!name) {
      throw new Error(`Name not found in ${imgFile}`);
    }

    const recognizedName = await getPlayerName('gnames', img);
    if (!recognizedName) {
      throw new Error(`Recognized name not found in ${imgFile}`);
    }

    const allPlayers = generateNames(name)

    const finedName = fuzzySearchNames(recognizedName, allPlayers)
    expect(finedName).toBe(name);
  }

  expect(true).toBe(true)
})
