import { createContract } from "@ovenstandoff/type-safe-socket";
import { AllStates } from "@ovenstandoff/shared";
import { z } from "zod";

export const wsContract = createContract({
  registerRunners: {
    client: z.object({
      runners: z.array(z.object({ runner: z.string(), state: z.enum(AllStates) })),
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
});
