import { v4 as uuidv4 } from 'uuid'
import z from 'zod'

export const incomingTransportMessageSchema = z.object({
  event: z.string(),
  data: z.unknown(),
  messageId: z.string().optional(),
  success: z.boolean().default(true),
})

export type TransportMessage = z.infer<typeof incomingTransportMessageSchema>

export const createTransportMessage = ({
  event,
  data,
}: Pick<TransportMessage, 'event' | 'data'>): TransportMessage & { messageId: string } => {
  const messageId = uuidv4()
  return { messageId, event, data, success: true }
}

export const createRequestAnswer = (requestData: TransportMessage): TransportMessage => {
  return requestData
}
