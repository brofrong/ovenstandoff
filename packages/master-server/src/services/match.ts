import type { masterContract } from '@ovenstandoff/contract'
import type {
  ClientInferResponseBody,
  ServerInferRequest,
  ServerInferResponses,
} from '@ts-rest/core'
import { broadcastRunnersUpdate } from '../master-ws'
import { registerClients } from '../register-client'
import { env } from '../utils/env'
import { openConnections, runners } from './runners'

export async function startMatchHandler(
  request: ServerInferRequest<typeof masterContract.startMatch>
): Promise<ServerInferResponses<typeof masterContract.startMatch>> {
  const log = (request as any).request?.log!
  log.info(`startMatchHandler: ${JSON.stringify(request.body)}`)
  const body = request.body

  const { teams, matchID } = body

  const runnerWithCurrentMatchID = runners.find((it) => it.matchID === matchID)
  if (runnerWithCurrentMatchID) {
    log.info(`startMatchHandler: Match already started`)
    return { status: 200, body: 'Match started' }
  }

  const freeManager = Object.values(runners).find((it) => it.state === 'readyForCreateLobby')
  if (!freeManager) {
    return { status: 503, body: 'No free manager' }
  }
  freeManager.state = 'createLobby'
  freeManager.callbackUrl = body.callbackUrl
  freeManager.matchID = body.matchID
  freeManager.team = body.teams
  freeManager.map = body.map

  const socket = openConnections.get(freeManager.ws)

  if (!socket) {
    return { status: 503, body: 'No free manager' }
  }

  socket.send.startMatch({
    teams,
    runner: freeManager.name,
    matchID: freeManager.matchID,
    callbackUrl: freeManager.callbackUrl,
    map: freeManager.map,
  })

  broadcastRunnersUpdate()

  log.info(`startMatchHandler: ${JSON.stringify({ status: 200, body: 'Match started' })}`)
  return { status: 200, body: 'Match started' }
}

export async function registerClientsHandler(
  request: ServerInferRequest<typeof masterContract.registerClients>
): Promise<ServerInferResponses<typeof masterContract.registerClients>> {
  const log = (request as any).request?.log!
  log.info(`registerClientsHandler: ${JSON.stringify(request.body)}`)
  const { count } = request.body

  console.log(`register ${count} clients`)

  const resData = await registerClients(count)

  const returnData: ClientInferResponseBody<typeof masterContract.registerClients, 200> = []

  const emails = env.EMAILS
  const emailsLength = emails.length
  const passwords = env.PASSWORDS
  const passwordsLength = passwords.length

  for (let i = resData.startID; i < resData.endID; i++) {
    returnData.push({
      id: i,
      name: `CH auto ${i + 1}`,
      nameIsChanged: 0,
      lowSettings: 0,
      email: env.EMAILS[i % emailsLength]!,
      password: env.PASSWORDS[i % passwordsLength]!,
    })
  }
  log.info(`registerClientsHandler: ${JSON.stringify({ status: 200, body: returnData })}`)
  return { status: 200, body: returnData }
}
