import { env } from "./env";


export function reportMatchEnded(matchID: string, winner: number | null, error: string | null) {
  return sendToCH({
    type: "matchEnded",
    matchID,
    winner,
    error,
  });
}

async function sendToCH(body: Record<string, unknown>) {
  const response = await fetch(env.CH_SERVER_HOST, {
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
