import { z } from "zod";

const envSchema = z.object({
  BUN_PUBLIC_WS_HOST: z.string(),
});

console.log(import.meta.env);

export const env = envSchema.parse({
  BUN_PUBLIC_WS_HOST: 'localhost:3001',
});
