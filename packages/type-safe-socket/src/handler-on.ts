import type z from 'zod';
import type { Contract, keysWithOnlyOneEnv, NotCurrentEnv, ServerOrClient } from './contract.helpers';
import type { Listeners } from './listeners';
import type { Prettify, Without } from './type-utils';
import { changeEnv } from './contract.helpers';

type OnHandler<T extends Contract, ENV extends ServerOrClient> = {
  [TKey in keyof Without<
    keysWithOnlyOneEnv<T, NotCurrentEnv<ENV>>,
    undefined
  >]: T[TKey][NotCurrentEnv<ENV>] extends z.ZodTypeAny
    ? (callback: (data: z.infer<T[TKey][NotCurrentEnv<ENV>]>) => void) => void
    : never;
};

type OnceHandler<T extends Contract, ENV extends ServerOrClient> = {
  [TKey in keyof Without<
    keysWithOnlyOneEnv<T, NotCurrentEnv<ENV>>,
    undefined
  >]: T[TKey][NotCurrentEnv<ENV>] extends z.ZodTypeAny
    ? (callback: (data: z.infer<T[TKey][NotCurrentEnv<ENV>]>) => void) => Promise<z.infer<T[TKey][NotCurrentEnv<ENV>]>>
    : never;
};

export const buildOnHandler = <T extends Contract, ENV extends ServerOrClient>(
  contract: T,
  serverOrClient: ENV,
  listeners: Listeners,
): Prettify<OnHandler<T, ENV>> => {
  const handler = {} as any;
  const notCurrentEnv = changeEnv(serverOrClient);

  Object.entries(contract).forEach(([key, value]) => {
    if (value[notCurrentEnv]) {
      handler[key] = (callback: unknown) => {
        const currentListeners = listeners.get(key);
        if (!currentListeners) {
          listeners.set(key, [callback as (data: unknown) => void]);
        } else {
          currentListeners.push(callback as (data: unknown) => void);
        }
      };
    }
  });

  return handler;
};

export const buildOnceHandler = <T extends Contract, ENV extends ServerOrClient>(
  contract: T,
  serverOrClient: ENV,
  listeners: Listeners,
): Prettify<OnceHandler<T, ENV>> => {
  const handler = {} as any;
  const notCurrentEnv = changeEnv(serverOrClient);

  Object.entries(contract).forEach(([key, value]) => {
    if (value[notCurrentEnv]) {
      handler[key] = (callback: (data: unknown) => void) => {
        return new Promise<any>((resolve, _reject) => {
          function wrappedCallback(data: unknown) {
            callback(data);
            const currentListeners = listeners.get(key);
            if (currentListeners) {
              const newListeners = currentListeners.filter((listener) => listener !== wrappedCallback);
              if (newListeners.length) {
                listeners.set(key, newListeners);
              } else {
                listeners.delete(key);
              }
            }
            resolve(data as any);
          }
          const currentListeners = listeners.get(key);
          if (!currentListeners) {
            listeners.set(key, [wrappedCallback]);
          } else {
            currentListeners.push(wrappedCallback);
          }
        });
      };
    }
  });

  return handler;
};
