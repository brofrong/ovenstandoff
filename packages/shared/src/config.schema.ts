import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const configTable = sqliteTable('config_table', {
  id: int().primaryKey({ autoIncrement: true }),
  ldPath: text().notNull(),
  masterServerRestHost: text().notNull(),
  masterServerWsHost: text().notNull(),
  secret: text().notNull(),
  debug: int().default(0),
})

export const runnerTable = sqliteTable('runner_table', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  nameIsChanged: int().default(0),
  lowSettings: int().default(0),
  email: text().notNull(),
  password: text().notNull(),
})
