import { db } from './src/config'
import { configTable, runnerTable } from './src/config.schema'
import type { ConfigWithRunners, InsertConfigConfig, InsertRunnerRunner } from './src/config.type'

export * from './src/ld-command'

export const configDB = db

export const AllStates = [
  'booting',
  'android',
  'launching',
  'readyForCreateLobby',
  'createLobby',
  'waitingForPlayers',
  'lowSettings',
  'changeName',
  'inGame',
  'debug',
  'updateGame',
  'pictureName',
] as const

export type State = (typeof AllStates)[number]

export const getConfig = async (): Promise<ConfigWithRunners> => {
  const configArray = await configDB.select().from(configTable).limit(1)
  let config = configArray.at(0)

  if (!config) {
    const newConfigArray = await configDB
      .insert(configTable)
      .values({
        ldPath: 'C:\\Program Files (x86)\\ldplayer\\ldconsole.exe',
        masterServerRestHost: 'localhost',
        masterServerWsHost: 'localhost',
        secret: 'secret',
        debug: 0,
      })
      .returning({
        id: configTable.id,
        ldPath: configTable.ldPath,
        masterServerRestHost: configTable.masterServerRestHost,
        masterServerWsHost: configTable.masterServerWsHost,
        secret: configTable.secret,
        debug: configTable.debug,
      })

    const newConfig = newConfigArray.at(0)
    if (!newConfig) {
      throw new Error('New config not created')
    }

    config = newConfig
  }

  const runners = await configDB.select().from(runnerTable)

  const configWithRunners = Object.assign({}, config, { runners })

  return configWithRunners
}

export const updateConfig = async (config: InsertConfigConfig, runners: InsertRunnerRunner[]) => {
  await configDB.update(configTable).set(config)
  // delete all runners
  await configDB.delete(runnerTable)
  // insert new runners
  await configDB.insert(runnerTable).values(runners)
}
