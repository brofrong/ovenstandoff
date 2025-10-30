import { runners } from './services/runners'
import { env } from './utils/env'

export function enableMockWorkers() {
  if (env.MOCK) {
    for (let i = 0; i < env.MOCK; i++) {
      runners.push({
        name: `mock-${i}`,
        ws: {
          send: () => 0,
          close: () => {},
          ping: () => 0,
          pong: () => 0,
          sendText: () => 0,
          sendBinary: () => 0,
          terminate: () => {},
          publish: () => 0,
          publishText: () => 0,
          publishBinary: () => 0,
          subscribe: () => 0,
          unsubscribe: () => 0,
          isSubscribed: () => false,
          cork: (a) => a as any,
          remoteAddress: '127.0.0.1',
          readyState: 1,
          data: null,
          getBufferedAmount: () => 0,
        },
        state: 'readyForCreateLobby',
        code: null,
        matchID: null,
        callbackUrl: null,
        team: null,
      })
    }
  }
}
