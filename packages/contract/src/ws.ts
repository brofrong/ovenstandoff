import { createContract } from "@ovenstandoff/type-safe-socket";
import { z } from "zod";
import { gameMaps } from './rest';

export const AllStates = [
  "booting",
  "android",
  "launching",
  "readyForCreateLobby",
  "createLobby",
  "waitingForPlayers",
  "lowSettings",
  "changeName",
  "inGame",
  "debug",
  "updateGame",
] as const;

export const runner = z.object({
  name: z.string(),
  state: z.enum(AllStates),
  matchID: z.string().nullable(),
  callbackUrl: z.string().nullable(),
  code: z.string().nullable(),
  map: z.enum(gameMaps).nullable(),
  team: z.object({
    ct: z.array(z.string()),
    t: z.array(z.string()),
  }).nullable(),
});
export type Runner = z.infer<typeof runner>;

export const wsContract = createContract({
  registerRunners: {
    client: z.object({
      runners: z.array(runner),
    }),
  },
  changeState: {
    client: z.object({
      runner: z.string(),
      state: z.enum(AllStates),
    }),
  },
  startMatch: {
    server: z.object({
      teams: z.object({
        ct: z.array(z.string()),
        t: z.array(z.string()),
      }),
      runner: z.string(),
      matchID: z.string().nullable(),
      callbackUrl: z.string().nullable(),
      map: z.enum(gameMaps).nullable(),
    }),
  },
  lobbyCode: {
    client: z.object({
      code: z.string(),
    }),
  },
  matchEnded: {
    client: z.object({
      winner: z.enum(["ct", "t", "error", "player dont connect to the lobby"]),
    }),
    server: z.object({
      winner: z.enum(["ct", "t", "error", "player dont connect to the lobby"]),
    }),
  },
  // front-end
  registerView: {
    client: z.object({
      view: z.boolean(),
    }),
    server: z.object({
      runners: z.array(runner),
    }),
  },
  updateRunners: {
    server: z.object({
      runners: z.array(runner),
    }),
  },
  // Screen streaming
  startScreenStream: {
    client: z.object({
      runner: z.string(),
    }),
    server: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  stopScreenStream: {
    client: z.object({
      runner: z.string(),
    }),
    server: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  screenFrame: {
    server: z.object({
      runner: z.string(),
      frame: z.string(), // base64 encoded image
      timestamp: z.number(),
    }),
  },
  // State management
  changeRunnerState: {
    client: z.object({
      runner: z.string(),
      state: z.enum(AllStates),
    }),
    server: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  // Master-server to Runner commands
  startScreenStreamCommand: {
    server: z.object({
      runner: z.string(),
    }),
    client: z.object({
      runner: z.string(),
    }),
  },
  stopScreenStreamCommand: {
    server: z.object({
      runner: z.string(),
    }),
    client: z.object({
      runner: z.string(),
    }),
  },
  changeStateCommand: {
    server: z.object({
      runner: z.string(),
      state: z.enum(AllStates),
    }),
    client: z.object({
      runner: z.string(),
      state: z.enum(AllStates),
    }),
  },
  // Worker to Master-server screen frame
  sendScreenFrame: {
    client: z.object({
      runner: z.string(),
      frame: z.string(), // base64 encoded image
      timestamp: z.number(),
    }),
  },
  // Click command from front-end to worker
  clickCommand: {
    client: z.object({
      runner: z.string(),
      x: z.number(),
      y: z.number(),
    }),
    server: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  // Click command from master-server to worker
  clickCommandToRunner: {
    server: z.object({
      runner: z.string(),
      x: z.number(),
      y: z.number(),
    }),
    client: z.object({
      runner: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  },
  ping: {
    client: z.string(),
    server: z.string(),
  },
});
