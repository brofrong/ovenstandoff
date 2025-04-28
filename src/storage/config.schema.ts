import { z } from "zod";

export const configSchema = z.object({
  ldconsolePath: z.string(),
  runners: z.array(z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
  }))
})