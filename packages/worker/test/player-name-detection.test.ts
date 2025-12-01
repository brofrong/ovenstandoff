import { expect, test } from 'bun:test'
import { slotsNames, waitForPlayers } from '../src/state-manager/waiting-for-players'
import { fuzzySearchNames } from '../src/utils/utils'
import { loadBuffer } from '../src/img-proccesing/memo-img'
import { getPlayerName } from '../src/img-proccesing/player-name-detection'

// test('find player names', async () => {
//   const slotsNames = [
//     'free_slot_1',
//     'free_slot_2',
//     'free_slot_3',
//     'free_slot_4',
//     'free_slot_5',
//     'free_slot_6',
//     'free_slot_7',
//     'free_slot_8',
//     'free_slot_9',
//     'free_slot_10',
//   ]

//   const teams = {
//     teams: {
//       ct: ['Balagan', 'Midoria', 'Dan1x', 'l1mboo', 'Funny'],
//       t: ['Dracula', 'Militriss', 'Sneepy', 'YT: DEHICUA', 'Pishtolet'],
//     },
//   }

//   const allPlayers = [...teams.teams.ct, ...teams.teams.t]
//   const img = await loadBuffer('./test-img/img-names.png')

//   for (const slot of slotsNames) {
//     const index = slotsNames.indexOf(slot)
//     const name = await getPlayerName(slot, img)
//     console.log(name)

//     if (!name) {
//       throw new Error(`${slot} not found`)
//     }
//     const expectedName = fuzzySearchNames(name, allPlayers)
//     if (!expectedName) {
//       console.log(`${name} not found in ${allPlayers}`)
//     }
//     expect(expectedName).toBe(allPlayers[index] ?? null)
//   }

//   expect(true).toBe(true)
// })

// test('find player names 2', async () => {
//   const slotsNames = ['free_slot_1', 'free_slot_2']

//   const teams = {
//     teams: {
//       ct: ['CH Auto 1'],
//       t: ['CH Auto 2'],
//     },
//   }

//   const allPlayers = [...teams.teams.ct, ...teams.teams.t]
//   const img = await loadBuffer('./test-img/img-names-2.png')

//   for (const slot of slotsNames) {
//     const index = slotsNames.indexOf(slot)
//     const name = await getPlayerName(slot, img)
//     console.log(name)

//     if (!name) {
//       throw new Error(`${slot} not found`)
//     }
//     const expectedName = fuzzySearchNames(name, allPlayers)
//     if (!expectedName) {
//       console.log(`${name} not found in ${allPlayers}`)
//     }
//     expect(expectedName).toBe(allPlayers[index] ?? null)
//   }

//   expect(true).toBe(true)
// })

// test('find player names 3', async () => {
//   const slotsNames = ['free_slot_1', 'free_slot_2']

//   const teams = {
//     teams: {
//       ct: ['Андикон'],
//       t: ['1234'],
//     },
//   }

//   const allPlayers = [...teams.teams.ct, ...teams.teams.t]
//   const img = await loadBuffer('./test-img/img-names-3.png')

//   for (const slot of slotsNames) {
//     const index = slotsNames.indexOf(slot)
//     const name = await getPlayerName(slot, img)
//     console.log(name)

//     if (!name) {
//       throw new Error(`${slot} not found`)
//     }
//     const expectedName = fuzzySearchNames(name, allPlayers)
//     if (!expectedName) {
//       console.log(`${name} not found in ${allPlayers}`)
//     }
//     expect(expectedName).toBe(allPlayers[index] ?? null)
//   }

//   expect(true).toBe(true)
// })

// const slotsTeams = ['ct', 'ct', 'ct', 'ct', 'ct', 't', 't', 't', 't', false] as const

// test('get team color', async () => {
//   const img = await loadBuffer('./test-img/img-colors.png')

//   for (let i = 0; i < slotsNames.length; i++) {
//     const slot = slotsNames[i]
//     const team = slotsTeams[i]
//     const teamColor = await waitForPlayers.isPlayerInTeam(slot ?? 'free_slot_1', img)
//     expect(teamColor).toBe(team ?? false)
//   }

//   expect(true).toBe(true)
// })

// CT:
// Relax
// Militriss
// MiXAЛЫ4
// Pupo4ek
// Milichka
// T:
// pen1lo
// Dracula1
// l1mboo
// Dracula
// BalaganSky
