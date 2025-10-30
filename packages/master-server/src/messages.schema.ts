import { z } from 'zod'

export const registerClientsResponseSchema = z.array(
  z.object({
    name: z.string(),
    nameIsChanged: z.boolean(),
    lowSettings: z.boolean(),
    email: z.string(),
    password: z.string(),
  })
)
