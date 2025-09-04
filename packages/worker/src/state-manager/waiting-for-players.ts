import sharp from "sharp";
import { findAnchor } from "../img-proccesing/img-proccesing";
import { getPlayerName } from "../img-proccesing/player-name-detection";
import { fuzzySearchNames } from "../utils/utils";
import { client } from "../ws/ws";
import { StateManager, type Teams } from "./state-manager";
import { runSteps } from "./steps";


async function isMatchExpired(stateManager: StateManager): Promise<boolean> {
  // check if match startedTimestamp is set
  if (!stateManager.matchStartedTimestamp) {
    stateManager.matchStartedTimestamp = Date.now();
  }

  // check if match startedTimestamp is more expired in 5 minutes
  if (
    stateManager.matchStartedTimestamp &&
    stateManager.matchStartedTimestamp + 5 * 60 * 1000 < Date.now()
  ) {

    if (!client) {
      console.error("Client not found!!!!!!!!");
    }

    client?.send.matchEnded({
      winner: "player dont connect to the lobby",
    });

    // write message before leave lobby
    await runSteps(
      [
        { step: "click", data: { x: 432, y: 507 } },
        { step: "write", data: { text: "Player dont connect to the lobby" } },
        { step: "wait", data: { amount: 1000 } },
        { step: "click", data: { x: 564, y: 249 } },
      ],
      stateManager
    );

    return true;
  }
  return false;
}

const spectatorSlots = [
  "wait_for_payers_spectator_slot_2",
  "wait_for_payers_spectator_slot_3",
  "wait_for_payers_spectator_slot_4",
  "wait_for_payers_spectator_slot_5",
  "wait_for_payers_spectator_slot_6",
] as const;

async function kickSpectators(stateManager: StateManager) {
  for (const slot of spectatorSlots) {
    if (!(await findAnchor(stateManager.currentImg, slot))) {
      // kick player
      await runSteps(
        [
          { step: "click", data: { anchorKey: slot } },
          {
            step: "clickOccurrence",
            data: { anchorKey: "wait_for_payers_spectator_kick" },
          },
        ],
        stateManager
      );
    }
  }
}

export const slotsNames = [
  "free_slot_1",
  "free_slot_2",
  "free_slot_3",
  "free_slot_4",
  "free_slot_5",
  "free_slot_6",
  "free_slot_7",
  "free_slot_8",
  "free_slot_9",
  "free_slot_10",
] as const;

const CT_COLOR = [131, 154, 202];
const T_COLOR = [233, 175, 77];

async function isPlayerInTeam(
  slot: (typeof slotsNames)[number],
  img: string | Buffer | null
) {
  const coords = TEAM_COLORS_COORDS[slot];
  if (!img) {
    return false;
  }

  const imgBuffer = await sharp(img).raw().toBuffer();
  if (!imgBuffer) {
    return false;
  }

  const bufferIndex = (coords.x + coords.y * 960) * 4;
  const r = imgBuffer[bufferIndex];
  const g = imgBuffer[bufferIndex + 1];
  const b = imgBuffer[bufferIndex + 2];

  if (r === CT_COLOR[0] && g === CT_COLOR[1] && b === CT_COLOR[2]) {
    return "ct";
  }
  if (r === T_COLOR[0] && g === T_COLOR[1] && b === T_COLOR[2]) {
    return "t";
  }
  return false;
}

function getNamesFromTeam(teams: Teams): string[] {
  const AllNames: string[] = [];
  teams.ct.forEach((it) => AllNames.push(it));
  teams.t.forEach((it) => AllNames.push(it));
  return AllNames;
}

export const TEAM_COLORS_COORDS: Record<
  (typeof slotsNames)[number],
  { x: number; y: number }
> = {
  free_slot_1: { x: 422, y: 56 },
  free_slot_2: { x: 509, y: 56 },
  free_slot_3: { x: 597, y: 56 },
  free_slot_4: { x: 685, y: 56 },
  free_slot_5: { x: 770, y: 56 },

  free_slot_6: { x: 422, y: 128 },
  free_slot_7: { x: 509, y: 128 },
  free_slot_8: { x: 597, y: 128 },
  free_slot_9: { x: 685, y: 128 },
  free_slot_10: { x: 770, y: 128 },
};

async function getJoinedPlayersCountKickPlayersNotInList(
  stateManager: StateManager
): Promise<number> {
  const allPlayers = getNamesFromTeam(stateManager.teams);
  const playersJoined: string[] = [];

  // get occupied slots to check
  const occupiedSlots = (
    await Promise.all(
      slotsNames.map(async (slot) => ({
        fined: !(await findAnchor(stateManager.currentImg, slot)),
        slot,
      }))
    )
  ).filter((it) => it.fined);

  for (const slot of occupiedSlots) {
    console.log(`slot: ${slot.slot} is cheking`);
    await stateManager.takeScreenshot();
    const slotName = slot.slot;
    const imgPlayerName = await getPlayerName(
      slotName,
      stateManager.currentImg
    );

    if (!imgPlayerName) {
      console.log(`slot: name in ${slot.slot} is not found`);
      continue;
    }

    const playerName = fuzzySearchNames(imgPlayerName, allPlayers);

    if (!playerName) {
      //kick player
      await runSteps(
        [
          { step: "click", data: { anchorKey: slotName } },
          {
            step: "clickOccurrence",
            data: { anchorKey: "wait_for_payers_spectator_kick" },
          },
        ],
        stateManager
      );
      continue;
    }

    playersJoined.push(playerName);

    const playerTeam = stateManager.teams.ct.includes(playerName) ? "ct" : "t";
    const currentTeam = await isPlayerInTeam(slotName, stateManager.currentImg);
    if (currentTeam !== playerTeam) {
      const teamKey =
        playerTeam === "ct"
          ? "wait_for_payers_move_to_ct"
          : "wait_for_payers_move_to_t";
      await runSteps(
        [
          { step: "click", data: { anchorKey: slotName } },
          { step: "clickOccurrence", data: { anchorKey: teamKey } },
        ],
        stateManager
      );
    }
  }

  return allPlayers.length - playersJoined.length;
}

async function startGame(stateManager: StateManager) {
  await runSteps(
    [
      { step: "click", data: { x: 433, y: 507 } },
      { step: "wait", data: { amount: 1000 } },
      { step: "write", data: { text: "Start match in 5 seconds" } },
      { step: "wait", data: { amount: 1000 } },
      { step: "click", data: { x: 865, y: 494 } },
      { step: "wait", data: { amount: 1000 } },
      { step: "click", data: { x: 865, y: 494 } },
    ],
    stateManager
  );
}

export const waitForPlayers = {
  isMatchExpired,
  kickSpectators,
  getJoinedPlayersCountKickPlayersNotInList,
  isPlayerInTeam,
  startGame,
};
