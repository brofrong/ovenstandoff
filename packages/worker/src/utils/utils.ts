import appDirs from 'appdirsjs'
import Fuse from 'fuse.js'
import { readdir } from 'node:fs/promises'

export function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

export const dirs = appDirs({ appName: 'ovenStandoff' }).data

export async function isFolderExists(path: string): Promise<boolean> {
  try {
    await readdir(path)
    return true
  } catch (_err) {
    return false
  }
}

const removeNonLatin = (name: string) => name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '')

export function fuzzySearchNames(
  name: string,
  allNames: string[]
): string | null {
  const cleanAllNames = allNames.map(removeNonLatin)

  const fuse = new Fuse(cleanAllNames, {
    threshold: 0.4,
    ignoreLocation: true,
    isCaseSensitive: false,
    includeScore: true,
  })

  const result = fuse.search(name)

  return result[0]?.item ?? null
}
