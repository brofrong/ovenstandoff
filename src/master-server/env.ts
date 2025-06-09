import { z } from "zod";

const envSchema = z.object({
  CH_SERVER_HOST: z.string(),
  CH_TOKEN: z.string(),
  SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
