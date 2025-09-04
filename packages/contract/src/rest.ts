import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();


const reqMatchStartSchema = z.object({
  matchID: z.string(),
  map: z.string().optional(),
  callbackUrl: z.string(),
  teams: z.object({
    ct: z.array(z.string()),
    t: z.array(z.string()),
  }),
});

const registerClientsSchema = z.object({
  count: z.number(),
});

export const masterContract = c.router({
  startMatch: {
    method: 'POST',
    path: '/start-match',
    summary: 'Start a match',
    body: reqMatchStartSchema,
    responses: {
      503: z.literal('No free manager'),
      200: z.literal('Match started'),
    },
  },
  registerClients: {
    method: 'POST',
    path: '/register-clients',
    summary: 'Register client for workers',
    body: registerClientsSchema,
    responses: {
      200: z.array(z.object({
        id: z.number(),
        name: z.string(),
        nameIsChanged: z.number(),
        lowSettings: z.number(),
        email: z.string(),
        password: z.string(),
      })),
    },
  }
});
