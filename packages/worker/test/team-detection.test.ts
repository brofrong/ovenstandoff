import { expect, test } from 'bun:test';
import { isPlayerInTeam } from '../src/state-manager/waiting-for-players';


test('team detection', async () => {

  const slotsAndTeam = [{ slot: 'free_slot_1', team: 'ct' }, { slot: 'free_slot_2', team: 'ct' }, { slot: 'free_slot_3', team: 't' }, { slot: 'free_slot_4', team: 't' }, { slot: 'free_slot_5', team: 't' }] as const;

  for (const slotAndTeam of slotsAndTeam) {
    const check = await isPlayerInTeam(slotAndTeam.slot, './test-img/team.png');
    console.log('check', slotAndTeam.slot, check);
    expect(check).toBe(slotAndTeam.team);
  }
})
