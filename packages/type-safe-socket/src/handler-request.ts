import type z from 'zod';
import type { Contract, keysWithBothEnv, NotCurrentEnv, ServerOrClient, WSLike } from './contract.helpers';
import type { RequestHandlerHandlers, RequestWaitList } from './listeners';
import type { ErrorOrData, Prettify, Without } from './type-utils';
import { changeEnv } from './contract.helpers';
import { createTransportMessage } from './transport-message';

type RequestHandler<T extends Contract, ENV extends ServerOrClient> = {
  [TKey in keyof Without<keysWithBothEnv<T>, undefined>]: T[TKey][ENV] extends z.ZodTypeAny
    ? T[TKey][NotCurrentEnv<ENV>] extends z.ZodTypeAny
      ? (data: z.infer<T[TKey][ENV]>) => Promise<ErrorOrData<z.infer<T[TKey][NotCurrentEnv<ENV>]>, string>>
      : never
    : never;
};

type RequestHandlerHandler<T extends Contract, ENV extends ServerOrClient> = {
  [TKey in keyof Without<keysWithBothEnv<T>, undefined>]: T[TKey][ENV] extends z.ZodTypeAny
    ? T[TKey][NotCurrentEnv<ENV>] extends z.ZodTypeAny
      ? (
          callback: (
            data: z.infer<T[TKey][NotCurrentEnv<ENV>]>,
            accept: (data: z.infer<T[TKey][ENV]>) => void,
            reject: (error: string) => void,
          ) => void,
        ) => void
      : never
    : never;
};

export const buildRequestHandler = <T extends Contract, ENV extends ServerOrClient>(
  contract: T,
  serverOrClient: ENV,
  ws: WSLike,
  requestWaitList: RequestWaitList,
): Prettify<RequestHandler<T, ENV>> => {
  const handler = {} as any;

  const reverseEnv = changeEnv(serverOrClient);

  Object.entries(contract).forEach(([key, value]) => {
    if (value[serverOrClient] && value[reverseEnv]) {
      handler[key] = (data: unknown) => {
        const schema = value[serverOrClient];
        if (!schema) {
          throw new Error(`Event ${key} not found in ${serverOrClient} contract`);
        }
        const validatedData = schema.safeParse(data);
        if (!validatedData.success) {
          throw new Error(`Invalid data for event ${key}: ${validatedData.error.message}`);
        }
        const message = createTransportMessage({ event: key, data: validatedData.data });
        ws.send(JSON.stringify(message));

        return new Promise((resolve) => {
          requestWaitList.set(message.messageId, (data: unknown) => resolve(data));
        });
      };
    }
  });

  return handler;
};

export const buildRequestHandlerHandler = <T extends Contract, ENV extends ServerOrClient>(
  contract: T,
  serverOrClient: ENV,
  ws: WSLike,
  requestHandlerHandlers: RequestHandlerHandlers,
): RequestHandlerHandler<T, ENV> => {
  const handler = {} as any;

  const reverseEnv = changeEnv(serverOrClient);

  Object.entries(contract).forEach(([key, value]) => {
    if (value[serverOrClient] && value[reverseEnv]) {
      handler[key] = (callback: (data: unknown, accept?: unknown, reject?: unknown) => void) => {
        const currentRequestHandlerHandlers = requestHandlerHandlers.get(key);
        if (currentRequestHandlerHandlers) {
          throw new Error(`Request handler can only be set once`);
        } else {
          requestHandlerHandlers.set(key, callback);
        }
      };
    }
  });

  return handler;
};
