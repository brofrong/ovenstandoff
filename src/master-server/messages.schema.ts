import { z } from "zod";
import { AllStates } from "../state-manager/states";

const availableMessagesTypesMaster = ["startMatch"] as const;
const availableMessagesTypesClient = [
  "registerRunners",
  "lobbyCode",
  "changeState",
  "matchEnded",
] as const;
export type MessageTypeMaster = (typeof availableMessagesTypesMaster)[number];
const messagesTypeMasterSchema = z.enum(availableMessagesTypesMaster);

export type MessageTypeClient = (typeof availableMessagesTypesClient)[number];
const messagesTypeClientSchema = z.enum(availableMessagesTypesClient);

export const messagesMasterSchema = z.object({
  type: messagesTypeMasterSchema,
  data: z.any(),
});

export const messagesClientSchema = z.object({
  type: messagesTypeClientSchema,
  data: z.any(),
});

// data schemas
export const registerRunnersSchema = z.object({
  runners: z.array(z.object({ runner: z.string(), state: z.enum(AllStates) })),
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

export const lobbyCodeSchema = z.object({
  code: z.string(),
});

export const matchEndedSchema = z.object({
  winner: z.enum(["ct", "t", "error", "player dont connect to the lobby"]),
});

export type SendMessageFromClient =
  | {
      type: "registerRunners";
      data: z.infer<typeof registerRunnersSchema>;
    }
  | {
      type: "lobbyCode";
      data: z.infer<typeof lobbyCodeSchema>;
    }
  | {
      type: "changeState";
      data: z.infer<typeof changeStateSchema>;
    }
  | {
      type: "matchEnded";
      data: z.infer<typeof matchEndedSchema>;
    };

export type SendMessageFromMaster = {
  type: "startMatch";
  data: z.infer<typeof startMatchSchema>;
};
