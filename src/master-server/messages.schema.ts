import { z } from "zod";
import { AllStates } from "../state-manager/states";

const availableMessagesTypes = ["registerRunners", "changeState", "startMatch"] as const;
export type MessageType = (typeof availableMessagesTypes)[number];
const messagesTypeSchema = z.enum(availableMessagesTypes);

export const messagesSchema = z.object({
  type: messagesTypeSchema,
  data: z.any(),
});

export const registerRunnersSchema = z.object({
  runners: z.array(z.object({runner: z.string(), state: z.enum(AllStates)})),
});

export const changeStateSchema = z.object({
  runner: z.string(),
  state: z.enum(AllStates),
});

export const startMatchSchema = z.object({
  runner: z.string(),
  teams: z.object({
    ct: z.array(z.string()),
    t: z.array(z.string()),
  }),
});

export type SendMessage =
  | {
      type: "registerRunners";
      data: z.infer<typeof registerRunnersSchema>;
    }
  | {
      type: "changeState";
      data: z.infer<typeof changeStateSchema>;
    }
    | {
      type: "startMatch";
      data: z.infer<typeof startMatchSchema>;
    };