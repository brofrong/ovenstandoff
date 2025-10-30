import { z } from 'zod'

const envSchema = z.object({
  CH_TOKEN: z.string(),
  SECRET: z.string(),
  PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(3001),
  EMAILS: z.string().transform((val) => val.split(',')),
  PASSWORDS: z.string().transform((val) => val.split(',')),
  MOCK: z.coerce.number().default(0),
})

export const env = envSchema.parse(process.env)
