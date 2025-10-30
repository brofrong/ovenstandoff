export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type ExcludeKeysWithTypeOf<T, V> = {
  [K in keyof T]-?: [Exclude<T[K], undefined>] extends [V] ? never : K
}[keyof T]

type ExcludeKeysWithoutTypeOf<T, V> = {
  [K in keyof T]-?: [Exclude<T[K], undefined>] extends [V] ? K : never
}[keyof T]

export type Without<T, V> = Pick<T, ExcludeKeysWithTypeOf<T, V>>
export type With<T, V> = Pick<T, ExcludeKeysWithoutTypeOf<T, V>>

export type ErrorOrData<DATA, ERROR> =
  | {
      success: false
      error: ERROR
      data?: null
    }
  | { success: true; error?: null; data: DATA }
