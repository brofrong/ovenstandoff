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
] as const;

export type State = (typeof AllStates)[number];
