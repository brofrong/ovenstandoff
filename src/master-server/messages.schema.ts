import { z } from "zod";
import { AllStates } from "../worker/state-manager/states";

const availableMessagesTypesMaster = ["startMatch", "matchEnded", "runnersUpdate"] as const;
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

export const runnersUpdateSchema = z.object({
  runners: z.array(z.object({
    name: z.string(),
    state: z.enum(AllStates),
    matchID: z.string().nullable(),
    callbackUrl: z.string().nullable(),
  })),
});

export const registerClientsSchema = z.object({
  count: z.number(),
});

export const registerClientsResponseSchema = z.array(z.object({
  name: z.string(),
  nameIsChanged: z.boolean(),
  lowSettings: z.boolean(),
  email: z.string(),
  password: z.string(),
}));

export type RegisterClientsResponse = z.infer<typeof registerClientsResponseSchema>;

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

export type SendMessageFromMaster =
  | {
    type: "startMatch";
    data: z.infer<typeof startMatchSchema>;
  }
  | {
    type: "matchEnded";
    data: z.infer<typeof matchEndedSchema>;
  }
  | {
    type: "runnersUpdate";
    data: z.infer<typeof runnersUpdateSchema>;
  };
