import { z } from "zod";
import { env } from "./env";

const matchEndedSchema = z.object({
  type: z.enum(["matchEnded"]),
  matchID: z.string(),
  winner: z.enum(["ct", "t"]).nullable(),
  error: z.string().nullable(),
});

const matchCodeSchema = z.object({
  type: z.enum(["matchCode"]),
  matchID: z.string(),
  code: z.string(),
});

export function reportMatchCode(matchID: string, code: string, callbackUrl: string | null) {
  return sendToCH(callbackUrl, {
    type: "matchCode",
    matchID,
    code,
  });
}

export function reportMatchEnded(matchID: string, winner: "ct" | "t" | null, error: string | null, callbackUrl: string | null) {
  return sendToCH(callbackUrl, {
    type: "matchEnded",
    matchID,
    winner,
    error,
  });
}

async function sendToCH(callbackUrl: string | null, body: Record<string, unknown>) {
  if (!callbackUrl) {
    return;
  }
  const response = await fetch(callbackUrl, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${env.CH_TOKEN}`,
    },
  });
  if (!response.ok) {
    console.error(`failed to send message to CH: ${response.statusText}`);
  }
}
