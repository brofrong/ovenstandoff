export const AllStates = [
    "booting",
     "android",
     "launching",
     "readyForCreateLobby",
     "createLobby",
     "waitingForPlayers",
     "lowSettings",
     "inGame",
     "debug",
  ] as const;
  
  export type State = (typeof AllStates)[number];