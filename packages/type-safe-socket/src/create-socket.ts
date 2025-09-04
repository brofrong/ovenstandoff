import type { Contract, ServerOrClient, WSLike } from './contract.helpers';
import type { Listeners, RequestHandlerHandlers, RequestWaitList } from './listeners';
import { buildNewEventHandler } from './handler-new-event';
import { buildOnceHandler, buildOnHandler } from './handler-on';
import { buildRequestHandler, buildRequestHandlerHandler } from './handler-request';
import { buildSendHandler } from './handler-send';

const buildServerOrClientEvents = <T extends Contract, ENV extends ServerOrClient, Context>(
  contract: T,
  ws: WSLike,
  context: Context = {} as Context,
  serverOrClient: ENV,
) => {
  const listeners: Listeners = new Map();
  const requestWaitList: RequestWaitList = new Map();
  const requestHandlerHandlers: RequestHandlerHandlers = new Map();

  const on = buildOnHandler(contract, serverOrClient, listeners);
  const once = buildOnceHandler(contract, serverOrClient, listeners);
  const newEvent = buildNewEventHandler(
    contract,
    serverOrClient,
    listeners,
    requestWaitList,
    requestHandlerHandlers,
    ws,
  );
  const send = buildSendHandler(contract, serverOrClient, ws);
  const request = buildRequestHandler(contract, serverOrClient, ws, requestWaitList);
  const requestHandler = buildRequestHandlerHandler(contract, serverOrClient, ws, requestHandlerHandlers);

  return {
    listeners,
    context,
    on,
    send,
    once,
    request,
    requestHandler,
    requestHandlerHandlers,
    newEvent,
    close: () => ws.close,
  };
};

export const createClientSocket = <T extends Contract, Context>(contract: T, ws: WSLike, context?: Context) => {
  return buildServerOrClientEvents(contract, ws, context, 'client');
};

export const createServerSocket = <T extends Contract, Context>(contract: T, ws: WSLike, context?: Context) => {
  return buildServerOrClientEvents(contract, ws, context, 'server');
};
