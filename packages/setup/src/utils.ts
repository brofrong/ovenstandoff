import { readdir } from 'node:fs/promises'

export function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

export async function isFolderExists(path: string): Promise<boolean> {
  try {
    await readdir(path)
    return true
  } catch (_err) {
    return false
  }
}
