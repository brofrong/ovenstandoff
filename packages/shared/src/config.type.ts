import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { configTable, runnerTable } from "./config.schema";
import type z from "zod";
import type { InferSelectModel } from "drizzle-orm";

export const insertRunnerSchema = createInsertSchema(runnerTable);
export const runnerSchema = createSelectSchema(runnerTable);

export const insertConfigSchemaSchema = createInsertSchema(configTable);
export const configSchema = createSelectSchema(configTable);

export type Config = InferSelectModel<typeof configTable>;
export type InsertConfigConfig = z.infer<typeof insertConfigSchemaSchema>;

export type Runner = InferSelectModel<typeof runnerTable>;
export type InsertRunnerRunner = z.infer<typeof insertRunnerSchema>;

export type ConfigWithRunners = Config & { runners: Runner[] };
