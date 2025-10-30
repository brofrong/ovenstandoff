import { expect, it } from 'bun:test'
import { z } from 'zod'
import { createContract } from './contract'
import { createClientSocket, createServerSocket } from './create-socket'

export const testContract = createContract({
  event1: {
    server: z.object({
      foo: z.string(),
    }),
  },
  event2: {
    server: z.object({
      foo: z.string(),
      bar: z.string(),
    }),
    client: z.object({
      baz: z.string(),
    }),
  },
})

it('create listener and receive event', (done) => {
  const data = { foo: 'bar' }

  const client = createClientSocket(testContract, { send: (_data) => null, close: () => null })

  client.on.event1((newEventData) => {
    expect(newEventData).toEqual(data)
    done()
  })
  const ret = client.newEvent(JSON.stringify({ event: 'event1', data }))
  expect(ret).toEqual({ error: false })
}, 500)

it('create listeners and receive events', (done) => {
  const data = { foo: 'bar' }

  const client = createClientSocket(testContract, { send: (_data) => null, close: () => null })

  let calledTimes = 0
  const callback = (newEventData: any) => {
    calledTimes++
    expect(newEventData).toEqual(data)
    if (calledTimes === 3) {
      done()
    }
  }

  client.on.event1(callback)
  client.on.event1(callback)
  client.on.event1(callback)

  client.newEvent(JSON.stringify({ event: 'event1', data }))
})

it('send events', (done) => {
  const testData = { baz: 'baz' }
  const sendHandler = (data: string) => {
    const parsedData = JSON.parse(data)
    expect({ event: parsedData.event, data: parsedData.data }).toEqual({
      event: 'event2',
      data: testData,
    })
    done()
  }

  const client = createClientSocket(testContract, { send: sendHandler, close: () => null })

  client.send.event2(testData)
})

it('context', () => {
  const context = { foo: 'bar' }
  const client = createClientSocket(
    testContract,
    { send: (_data) => null, close: () => null },
    context
  )

  expect(client.context).toEqual(context)
  context.foo = 'baz'
  expect(client.context).toEqual(context)
})

it('server and client e2e', (done) => {
  const serverTestData = { foo: 'bar' }
  const clientTestData = { baz: 'baz' }

  const clientWSLike = { send: (_data: string) => {}, close: () => {} }

  const serverWSLike = { send: (_data: string) => {}, close: () => {} }

  const status = {
    server: false,
    client: false,
  }
  const checkIFServerAndClientAreReceivedMessage = (serverOrClient: 'server' | 'client') => {
    if (serverOrClient === 'server') {
      status.server = true
    } else {
      status.client = true
    }
    if (status.server && status.client) {
      done()
    }
  }

  const client = createClientSocket(testContract, clientWSLike)
  const server = createServerSocket(testContract, serverWSLike)

  clientWSLike.send = (data: string) => {
    server.newEvent(data)
  }

  serverWSLike.send = (data: string) => {
    client.newEvent(data)
  }

  client.on.event1((newEventData) => {
    expect(newEventData).toEqual(serverTestData)
    checkIFServerAndClientAreReceivedMessage('client')
  })
  server.on.event2((newEventData) => {
    expect(newEventData).toEqual(clientTestData)
    checkIFServerAndClientAreReceivedMessage('server')
  })

  client.send.event2(clientTestData)
  server.send.event1(serverTestData)
})

it('once', async (done) => {
  const clientTestData = { foo: 'bar' }

  const client = createClientSocket(testContract, { send: (_data) => null, close: () => null })
  let onCalledTimes = 0
  client.on.event1((newEventData) => {
    expect(newEventData).toEqual(clientTestData)
    onCalledTimes++
    if (onCalledTimes === 2) {
      done()
    }
  })
  client.once
    .event1((newEventData) => {
      expect(newEventData).toEqual(clientTestData)
    })
    .then((newEventData) => expect(newEventData).toEqual(clientTestData))
  let onceCalledTimes = 0
  client.once
    .event1((newEventData) => {
      expect(newEventData).toEqual(clientTestData)
      expect(onceCalledTimes).toEqual(0)
      onceCalledTimes++
    })
    .then((newEventData) => expect(newEventData).toEqual(clientTestData))

  client.newEvent(JSON.stringify({ event: 'event1', data: clientTestData }))
  client.newEvent(JSON.stringify({ event: 'event1', data: clientTestData }))
})

it('request success', (done) => {
  const serverTestData = { foo: 'bar', bar: 'bar' }
  const clientTestData = { baz: 'baz' }

  const clientWSLike = { send: (_data: string) => {}, close: () => {} }

  const serverWSLike = { send: (_data: string) => {}, close: () => {} }

  const client = createClientSocket(testContract, clientWSLike)
  const server = createServerSocket(testContract, serverWSLike)

  clientWSLike.send = (data: string) => {
    setTimeout(() => server.newEvent(data), 100)
  }

  serverWSLike.send = (data: string) => {
    setTimeout(() => client.newEvent(data), 100)
  }

  server.requestHandler.event2((data, accept, _reject) => {
    expect(data).toEqual(clientTestData)
    accept?.(serverTestData)
  })

  async function asyncRiveDataFromServerToClient() {
    const data = await client.request.event2(clientTestData)
    if (!data.success) {
      throw new Error(data.error)
    }
    expect(data.data).toEqual(serverTestData)
    done()
  }

  asyncRiveDataFromServerToClient().then(() => null)
})

it('request reject', (done) => {
  const clientTestData = { baz: 'baz' }

  const clientWSLike = { send: (_data: string) => {}, close: () => {} }

  const serverWSLike = { send: (_data: string) => {}, close: () => {} }

  const client = createClientSocket(testContract, clientWSLike)
  const server = createServerSocket(testContract, serverWSLike)

  clientWSLike.send = (data: string) => {
    setTimeout(() => server.newEvent(data), 100)
  }

  serverWSLike.send = (data: string) => {
    setTimeout(() => client.newEvent(data), 100)
  }

  server.requestHandler.event2((data, _accept, reject) => {
    expect(data).toEqual(clientTestData)
    reject('test Error')
  })

  async function asyncRiveDataFromServerToClient() {
    const data = await client.request.event2(clientTestData)
    expect(data.success).toEqual(false)
    expect(data.error).toEqual('test Error')
    done()
  }

  asyncRiveDataFromServerToClient().then(() => null)
})
