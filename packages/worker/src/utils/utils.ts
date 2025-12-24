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

// Визуальная транслитерация кириллицы в похожие латинские буквы
// Например: "Кирилл" → "Kupunn"
const transliterateCyrillicToSimilarLatin = (text: string): string => {
  const cyrillicToLatin: Record<string, string> = {
    // Заглавные буквы
    А: 'A',
    В: 'B',
    С: 'C',
    Е: 'E',
    К: 'K',
    М: 'M',
    Н: 'H',
    О: 'O',
    Р: 'P',
    Т: 'T',
    У: 'Y',
    Х: 'X',
    // Строчные буквы
    а: 'a',
    в: 'v',
    е: 'e',
    и: 'u',
    к: 'k',
    м: 'm',
    н: 'n',
    о: 'o',
    р: 'p',
    с: 'c',
    т: 't',
    у: 'y',
    х: 'x',
    л: 'n',
    г: 'r',
    д: 'g',
    з: '3',
    ч: '4',
    б: '6',
    ж: 'x',
    э: 'e',
    ю: 'io',
    я: 'r',
    // Заглавные дополнительные
    Л: 'N',
    Г: 'r',
    Д: 'G',
    З: '3',
    Ч: '4',
    Б: '6',
    Ж: 'X',
    Э: 'E',
    Ю: 'IO',
    Я: 'R',
    И: 'U',
    // Ё и ё
    Ё: 'E',
    ё: 'e',
    // Ы, ы, Ь, ь, Ъ, ъ - пропускаем или заменяем на похожие
    Ы: 'bl',
    ы: 'bl',
    Ь: '',
    ь: '',
    Ъ: '',
    ъ: '',
    // Ц, ц
    Ц: 'C',
    ц: 'c',
    // Ш, ш, Щ, щ
    Ш: 'W',
    ш: 'w',
    Щ: 'W',
    щ: 'w',
    // Ф, ф
    Ф: 'F',
    ф: 'f',
    // Й, й
    Й: 'u',
    й: 'u',
  }

  return text
    .split('')
    .map((char) => cyrillicToLatin[char] ?? char)
    .join('')
}

// Проверяет, содержит ли текст кириллицу
const containsCyrillic = (text: string): boolean => {
  return /[а-яА-ЯёЁ]/.test(text)
}

export function fuzzySearchNames(name: string, allNames: string[]): string | null {
  const cleanName = removeNonLatin(name.trim())
  const cleanNameTransliterated = containsCyrillic(cleanName)
    ? transliterateCyrillicToSimilarLatin(cleanName)
    : cleanName

  // Создаём массив для поиска: оригинальные имена + транслитерированные варианты
  const searchNames: Array<{ original: string; cleaned: string; transliterated: string }> = []

  for (const originalName of allNames) {
    const cleaned = removeNonLatin(originalName).trim()

    // Если имя содержит кириллицу, добавляем транслитерированный вариант
    if (containsCyrillic(cleaned)) {
      const transliterated = transliterateCyrillicToSimilarLatin(cleaned)
      searchNames.push({
        original: originalName,
        cleaned,
        transliterated,
      })
    } else {
      // Если кириллицы нет, добавляем только оригинал
      searchNames.push({
        original: originalName,
        cleaned,
        transliterated: cleaned,
      })
    }
  }

  // Создаём два массива для поиска: оригинальные (с кириллицей) и транслитерированные
  const cleanedNames = searchNames.map((item) => item.cleaned)
  const transliteratedNames = searchNames.map((item) => item.transliterated)

  // Создаём два индекса Fuse: для оригинальных и транслитерированных имён
  const fuseOriginal = new Fuse(cleanedNames, {
    threshold: 0.4,
    ignoreLocation: true,
    isCaseSensitive: false,
    includeScore: true,
  })

  const fuseTransliterated = new Fuse(transliteratedNames, {
    threshold: 0.4,
    ignoreLocation: true,
    isCaseSensitive: false,
    includeScore: true,
  })

  // Ищем в оригинальных именах (с кириллицей)
  const resultOriginal = fuseOriginal.search(cleanName)

  // Ищем в транслитерированных именах (используем транслитерированный вариант name, если он был)
  const resultTransliterated = fuseTransliterated.search(cleanNameTransliterated)

  // Выбираем лучший результат из обоих поисков
  let bestIndex = resultOriginal[0]?.refIndex ?? -1

  if (resultTransliterated[0]) {
    const transliteratedScore = resultTransliterated[0].score ?? 1
    const originalScore = resultOriginal[0]?.score ?? 1

    // Если транслитерированный результат лучше, используем его
    if (transliteratedScore < originalScore) {
      bestIndex = resultTransliterated[0].refIndex ?? -1
    }
  } else if (resultOriginal[0]) {
    // Если есть только оригинальный результат, используем его
    bestIndex = resultOriginal[0].refIndex ?? -1
  }

  return bestIndex !== -1 && bestIndex < searchNames.length
    ? (searchNames[bestIndex]?.original ?? null)
    : null
}
