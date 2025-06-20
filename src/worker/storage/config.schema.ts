import { z } from "zod";

export const configSchema = z.object({
  ldPath: z.string(),
  masterServerHost: z.string(),
  secret: z.string(),
  debug: z.boolean().default(false),
  runners: z.array(
    z.object({
      name: z.string(),
      nameIsChanged: z.boolean().default(false),
      lowSettings: z.boolean().default(false),
      email: z.string(),
      password: z.string(),
    })
  ),
});

export type Config = z.infer<typeof configSchema>;
