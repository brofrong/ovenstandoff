import sharp from 'sharp';
import { anchors } from '../anchors';
import { findAnchorV2 } from '../img-proccesing/img-proccesing';
import { getPlayerName, playerNameCoords } from '../img-proccesing/player-name-detection';
import { log } from '../utils/log';
import { fuzzySearchNames } from '../utils/utils';
import { client } from '../ws/ws';
import type { StateManager, Teams } from './state-manager';
import { runSteps } from './steps';

async function isMatchExpired(stateManager: StateManager): Promise<boolean> {
  // check if match startedTimestamp is set
  if (!stateManager.matchStartedTimestamp) {
    stateManager.matchStartedTimestamp = Date.now()
  }

  // check if match startedTimestamp is more expired in 5 minutes
  if (
    stateManager.matchStartedTimestamp &&
    stateManager.matchStartedTimestamp + 7 * 60 * 1000 < Date.now()
  ) {
    if (!client) {
      console.error('Client not found!!!!!!!!')
    }

    client?.send.matchEnded({
      winner: 'player dont connect to the lobby',
    })

    // write message before leave lobby
    await runSteps(
      [
        { step: 'click', data: { x: 668, y: 683 } },
        { step: 'write', data: { text: 'Player dont connect to the lobby' } },
        { step: 'wait', data: { amount: 1000 } },
        { step: 'click', data: { x: 306, y: 672 } },
      ],
      stateManager
    )

    return true
  }
  return false
}

const spectatorSlots = [
  anchors.spectatorSlot2,
  anchors.spectatorSlot3,
  anchors.spectatorSlot4,
  anchors.spectatorSlot5,
  anchors.spectatorSlot6,
] as const

async function kickSpectators(stateManager: StateManager) {
  for (const slot of spectatorSlots) {
    if (!(await findAnchorV2(stateManager.currentImg, slot))) {
      // kick player
      await runSteps(
        [
          { step: 'click', data: { anchor: slot } },
          {
            step: 'clickOccurrence',
            data: { anchor: anchors.lobbyKick },
          },
        ],
        stateManager
      )
    }
  }
}

export const slotsNames = [
  'free_slot_1',
  'free_slot_2',
  'free_slot_3',
  'free_slot_4',
  'free_slot_5',
  'free_slot_6',
  'free_slot_7',
  'free_slot_8',
  'free_slot_9',
  'free_slot_10',
] as const

const CT_COLOR = [131, 154, 202]
const T_COLOR = [233, 175, 77]

async function isPlayerInTeam(slot: (typeof slotsNames)[number], img: string | Buffer | null) {
  const coords = TEAM_COLORS_COORDS[slot]
  if (!img) {
    return false
  }

  const imgBuffer = await sharp(img).raw().toBuffer()
  if (!imgBuffer) {
    return false
  }

  const bufferIndex = (coords.x + coords.y * 960) * 4
  const r = imgBuffer[bufferIndex]
  const g = imgBuffer[bufferIndex + 1]
  const b = imgBuffer[bufferIndex + 2]

  if (r === CT_COLOR[0] && g === CT_COLOR[1] && b === CT_COLOR[2]) {
    return 'ct'
  }
  if (r === T_COLOR[0] && g === T_COLOR[1] && b === T_COLOR[2]) {
    return 't'
  }
  return false
}

function getNamesFromTeam(teams: Teams): string[] {
  const AllNames: string[] = []
  teams.ct.forEach((it) => AllNames.push(it))
  teams.t.forEach((it) => AllNames.push(it))
  return AllNames
}

export const TEAM_COLORS_COORDS: Record<(typeof slotsNames)[number], { x: number; y: number }> = {
  free_slot_1: { x: 560, y: 74 },
  free_slot_2: { x: 677, y: 74 },
  free_slot_3: { x: 795, y: 74 },
  free_slot_4: { x: 912, y: 74 },
  free_slot_5: { x: 1025, y: 74 },

  free_slot_6: { x: 560, y: 167 },
  free_slot_7: { x: 677, y: 167 },
  free_slot_8: { x: 795, y: 167 },
  free_slot_9: { x: 912, y: 167 },
  free_slot_10: { x: 1025, y: 167 },
} as const;



export const USER_NAME_COORDS = playerNameCoords;

async function getJoinedPlayersCountKickPlayersNotInList(
  stateManager: StateManager
): Promise<number> {
  const allPlayers = getNamesFromTeam(stateManager.teams)
  const playersJoined: string[] = []

  // get occupied slots to check
  const occupiedSlots = slotsNames;

  for (const slot of occupiedSlots) {
    log.info(`slot: ${slot} is cheking`)
    await stateManager.takeScreenshot()
    const slotName = slot
    const imgPlayerName = await getPlayerName(slotName, stateManager.currentImg);
    console.log('imgPlayerName', imgPlayerName);

    const imgPlayerNameLength = (imgPlayerName?.ru.length ?? 0) + (imgPlayerName?.eng.length ?? 0)

    if (!imgPlayerName || imgPlayerNameLength < 2) {
      log.info(`slot: name in ${slot} is not found`)
      continue
    }

    const playerName = fuzzySearchNames(imgPlayerName, allPlayers);
    console.log('find name', slotName, 'playerName', playerName);

    if (!playerName) {
      //kick player
      await runSteps(
        [
          { step: 'click', data: { x: USER_NAME_COORDS[slotName]?.x, y: USER_NAME_COORDS[slotName]?.y } },
          {
            step: 'clickOccurrence',
            data: { anchor: anchors.lobbyKick },
          },
        ],
        stateManager
      )
      continue
    }

    const playerTeam = stateManager.teams.ct.includes(playerName) ? 'ct' : 't'
    const currentTeam = await isPlayerInTeam(slotName, stateManager.currentImg)
    if (currentTeam !== playerTeam) {
      const teamKey =
        playerTeam === 'ct' ? anchors.lobbyToCT : anchors.lobbyToTR;
      try {
        await runSteps(
          [
            { step: 'click', data: { x: USER_NAME_COORDS[slotName]?.x, y: USER_NAME_COORDS[slotName]?.y } },
            { step: 'clickOccurrence', data: { anchor: teamKey } },
            { step: 'click', data: { x: 30, y: 342 } }, // Нейтральный клик, что бы убрать все контекстные окна если они есть по какой либо причине
          ],
          stateManager
        )
      } catch (_error) {
        console.error('catch error in move to team')
        continue
      }
    }

    playersJoined.push(playerName)
  }

  return allPlayers.length - playersJoined.length
}

async function startGame(stateManager: StateManager) {
  await runSteps(
    [
      { step: 'click', data: { x: 642, y: 681 } },
      { step: 'wait', data: { amount: 1000 } },
      { step: 'write', data: { text: 'Start match in 5 seconds' } },
      { step: 'wait', data: { amount: 1000 } },
      { step: 'click', data: { x: 1166, y: 659 } },
      { step: 'wait', data: { amount: 1000 } },
      { step: 'click', data: { x: 1166, y: 659 } },
    ],
    stateManager
  )
}

export const waitForPlayers = {
  isMatchExpired,
  kickSpectators,
  getJoinedPlayersCountKickPlayersNotInList,
  isPlayerInTeam,
  startGame,
}
