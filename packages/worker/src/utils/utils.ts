import appDirs from "appdirsjs";
import Fuse, { type FuseResult } from "fuse.js";
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
}

const removeNonLatin = (name: string) =>
  name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, "");

export function fuzzySearchNames(
  name: { ru: string, eng: string },
  allNames: string[]
): string | null {
  ;
  const cleanAllNames = allNames.map(removeNonLatin);

  const fuse = new Fuse(cleanAllNames, { threshold: 0.4, ignoreLocation: true, isCaseSensitive: false, includeScore: true, });

  let bestNames: FuseResult<string>[] = [];

  if (name.ru) {
    const result = fuse.search(name.ru);

    const bestResult = result[0];
    if (bestResult) {
      bestNames.push(bestResult);
    }
  }
  if (name.eng) {
    const result = fuse.search(name.eng);
    const bestResult = result[0];
    if (bestResult) {
      bestNames.push(bestResult);
    }
  }

  const bestResult = bestNames.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  if (bestResult?.refIndex !== undefined) {
    return allNames[bestResult.refIndex] ?? null;
  }

  return null;
}
