import { z } from "zod";

const envSchema = z.object({
  CH_SERVER_HOST: z.string(),
  CH_TOKEN: z.string(),
  SECRET: z.string(),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
