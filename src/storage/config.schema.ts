import { z } from "zod";

export const configSchema = z.object({
  ldconsolePath: z.string(),
  ldPath: z.string(),
  masterServerHost: z.string(),
  runners: z.array(z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    lowSettings: z.boolean().default(false)
  }))
})

export type Config = z.infer<typeof configSchema>;
