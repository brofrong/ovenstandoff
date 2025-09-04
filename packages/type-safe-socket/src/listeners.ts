export type Listeners = Map<string, ((data: unknown) => unknown)[]>;
export type RequestWaitList = Map<string, (data: unknown) => unknown>;
export type RequestHandlerHandlers = Map<string, (data: unknown, accept: unknown, reject: unknown) => void>;
