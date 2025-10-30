import { z } from 'zod'

const envSchema = z.object({
  DB_FILE_PATH: z.string(),
})

export const env = envSchema.parse(process.env)
