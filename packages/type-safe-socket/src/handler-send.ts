import type z from 'zod'
import type { Contract, keysWithOnlyOneEnv, ServerOrClient, WSLike } from './contract.helpers'
import { createTransportMessage } from './transport-message'
import type { Prettify, Without } from './type-utils'

type SendHandler<T extends Contract, ENV extends ServerOrClient> = {
  [TKey in keyof Without<keysWithOnlyOneEnv<T, ENV>, undefined>]: T[TKey][ENV] extends z.ZodTypeAny
    ? (data: z.infer<T[TKey][ENV]>) => void
    : never
}

export const buildSendHandler = <T extends Contract, ENV extends ServerOrClient>(
  contract: T,
  serverOrClient: ENV,
  ws: WSLike
): Prettify<SendHandler<T, ENV>> => {
  const handler = {} as any

  Object.entries(contract).forEach(([key, value]) => {
    if (value[serverOrClient]) {
      handler[key] = (data: unknown) => {
        const schema = value[serverOrClient]
        if (!schema) {
          throw new Error(`Event ${key} not found in ${serverOrClient} contract`)
        }
        const validatedData = schema.safeParse(data)
        if (!validatedData.success) {
          throw new Error(`Invalid data for event ${key}: ${validatedData.error.message}`)
        }

        ws.send(JSON.stringify(createTransportMessage({ event: key, data: validatedData.data })))
      }
    }
  })

  return handler
}
