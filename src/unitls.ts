import appDirs from "appdirsjs";
import Fuse from "fuse.js";
import { readdir } from "node:fs/promises";

export function wait(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

export const dirs = appDirs({ appName: "ovenStandoff" }).data;


export async function isFolderExists(path: string): Promise<boolean> {
  try {
    await readdir(path);
    return true;
  } catch (err) {
    return false;
  }
};


const removeNonLatin = (name: string) => name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '');

export function fuzzySearchNames(name: string, allNames: string[]): string | null {
  const cleanName = removeNonLatin(name);
  const cleanAllNames = allNames.map(removeNonLatin);

  const fuse = new Fuse(cleanAllNames, {threshold: 0.4});

  const result = fuse.search(cleanName);
  
  const bestResult = result[0];

  console.log({name, bestResult});

  if((bestResult?.refIndex !== undefined)) {
    return allNames[bestResult.refIndex];
  }

  return null;
}