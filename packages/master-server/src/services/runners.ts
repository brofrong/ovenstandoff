import { wsContract } from "@ovenstandoff/contract";
import { type State } from "@ovenstandoff/shared";
import type { createServerSocket } from "@ovenstandoff/type-safe-socket";


export const openConnections: Map<Bun.ServerWebSocket<unknown>, ReturnType<typeof createServerSocket<typeof wsContract, unknown>>> = new Map();

export let runners: {
  name: string;
  ws: Bun.ServerWebSocket<unknown>;
  state: State;
  matchID: string | null;
  callbackUrl: string | null;
}[] = [];


export function setRunners(newRunners: { name: string; ws: Bun.ServerWebSocket<unknown>; state: State; matchID: string | null; callbackUrl: string | null }[]) {
  runners = newRunners;
}
