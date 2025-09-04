import type { Contract, ServerOrClient, WSLike } from './contract.helpers';
import type { Listeners, RequestHandlerHandlers, RequestWaitList } from './listeners';
import type { TransportMessage } from './transport-message';
import type { ErrorOrData } from './type-utils';
import { changeEnv } from './contract.helpers';
import { createRequestAnswer, incomingTransportMessageSchema } from './transport-message';
import { safeJsonParse } from './utilts';

const wsSendRequestAnswer = ({
  ws,
  messageId,
  dataToSend,
  event,
}: {
  ws: WSLike;
  messageId: string;
  event: string;
  dataToSend: ErrorOrData<unknown, string>;
}) => {
  const data = dataToSend.success ? dataToSend.data : dataToSend.error;
  ws.send(JSON.stringify(createRequestAnswer({ messageId, event, data, success: dataToSend.success })));
};

const handleRequestHandler = (
  ws: WSLike,
  event: string,
  messageId: string | undefined,
  requestHandlerHandlers: RequestHandlerHandlers,
  data: TransportMessage,
) => {
  if (!messageId) {
    return { error: `messageId is required` };
  }
  const requestHandlerHandler = requestHandlerHandlers.get(event);
  if (!requestHandlerHandler) {
    return { error: `Request handler for event ${event} not found` };
  }

  function accept(answer: unknown) {
    wsSendRequestAnswer({ ws, messageId: messageId!, event, dataToSend: { success: true, data: answer } });
  }

  function reject(error: string) {
    wsSendRequestAnswer({ ws, messageId: messageId!, event, dataToSend: { success: false, error } });
  }

  requestHandlerHandler(data, accept, reject);
};

const handleRequestWaitListItem = (
  requestWaitList: RequestWaitList,
  messageId: string | undefined,
  message: TransportMessage,
  data: unknown,
) => {
  // handle request events
  if (!messageId) {
    return { error: `Message id is required` };
  }
  const requestWaitListItem = requestWaitList.get(messageId);
  if (requestWaitListItem) {
    requestWaitListItem(
      message.success
        ? { data, error: false, success: true }
        : { error: (message?.data as string) || 'Unknown error', data: null, success: false },
    );
    requestWaitList.delete(messageId);
  }
};

export const buildNewEventHandler = <T extends Contract, ENV extends ServerOrClient>(
  contract: T,
  serverOrClient: ENV,
  listeners: Listeners,
  requestWaitList: RequestWaitList,
  requestHandlerHandlers: RequestHandlerHandlers,
  ws: WSLike,
) => {
  return (newEvent: string) => {
    const eventJson = safeJsonParse(newEvent);
    if (!eventJson) {
      console.error('eventJson', eventJson);
      return { error: `Event ${newEvent} is not a valid JSON` };
    }

    const validatedEvent = incomingTransportMessageSchema.safeParse(eventJson);
    if (validatedEvent.error) {
      console.error('validatedEvent', validatedEvent);
      return { error: `Event ${newEvent} is not a valid event: ${validatedEvent.error.message}` };
    }

    const event = validatedEvent.data.event;
    const messageId = validatedEvent.data.messageId;
    const data = validatedEvent.data.data;
    const requestSuccess = validatedEvent.data.success;

    const notCurrentEnv = changeEnv(serverOrClient);

    const contractEvent = contract[event];
    if (!contractEvent) {
      console.error('contractEvent', contractEvent);
      return { error: `Event ${event} not found in contract` };
    }

    const schema = contractEvent[notCurrentEnv];
    if (!schema) {
      console.error('schema', schema);
      return { error: `Event ${event} not found in ${notCurrentEnv} contract` };
    }

    const validatedData = schema.safeParse(data);

    if (!validatedData.success && requestSuccess) {
      console.error('validatedData', validatedData);
      return { error: `Event ${event} data is not valid: ${validatedData.error}` };
    }

    if (validatedData.success) {
      // handel on and once events
      const currentListeners = listeners.get(event);
      if (currentListeners?.length) {
        currentListeners.forEach((event) => event(validatedData.data));
      }

      // handle request handler
      handleRequestHandler(ws, event, messageId, requestHandlerHandlers, validatedData.data);
    }

    // handle request wait list item
    handleRequestWaitListItem(requestWaitList, messageId, validatedEvent.data, validatedData.data);

    return { error: false };
  };
};
