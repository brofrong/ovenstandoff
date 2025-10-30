import type z from 'zod'

interface EventSchema {
  client?: z.ZodTypeAny
  server?: z.ZodTypeAny
}

export type ServerOrClient = 'server' | 'client'

export interface Contract {
  [key: string]: EventSchema // TODO:  Contract | EventSchema; я пытался но тяжко сейчас
}

export type NotCurrentEnv<ENV extends ServerOrClient> = ENV extends 'server' ? 'client' : 'server'

export type keysWithBothEnv<T extends Contract> = {
  [K in keyof T]-?: T[K] extends EventSchema
    ? T[K]['client'] extends z.ZodTypeAny
      ? T[K]['server'] extends z.ZodTypeAny
        ? K
        : never
      : never
    : never
}

export type keysWithOnlyOneEnv<T extends Contract, ENV extends ServerOrClient> = {
  [K in keyof T]-?: T[K] extends EventSchema ? (T[K][ENV] extends z.ZodTypeAny ? K : never) : never
}

export const changeEnv = <ENV extends ServerOrClient>(env: ENV): NotCurrentEnv<ENV> =>
  env === 'server' ? ('client' as NotCurrentEnv<ENV>) : ('server' as NotCurrentEnv<ENV>)

export interface WSLike {
  send: (data: string) => void
  close: () => void
}
