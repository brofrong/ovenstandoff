import { env } from "./utils/env";
import { guard } from "./utils/guard";
import { close, message, open } from "./master-ws";



// if (env.MOCK) {
//   for (let i = 0; i < env.MOCK; i++) {
//     runners.push(
//       {
//         name: `mock-${i}`, ws: {
//           send: () => 0,
//           close: () => { },
//           ping: () => 0,
//           pong: () => 0,
//           sendText: () => 0,
//           sendBinary: () => 0,
//           terminate: () => { },
//           publish: () => 0,
//           publishText: () => 0,
//           publishBinary: () => 0,
//           subscribe: () => 0,
//           unsubscribe: () => 0,
//           isSubscribed: () => false,
//           cork: (a) => a as any,
//           remoteAddress: "127.0.0.1",
//           readyState: 1,
//           data: null,
//           getBufferedAmount: () => 0,
//         }, state: "readyForCreateLobby", matchID: null, callbackUrl: null
//       },
//     );
//   }
// }

const server = Bun.serve({
  port: env.WS_PORT,
  fetch: async (req, server) => {
    const url = new URL(req.url);
    if (!guard(req)) {
      console.log(`Unauthorized request ${req.url}`);
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("Upgrade failed", { status: 500 });
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open: open,
    message: message,
    close: close,
  },
});



// const server = Bun.serve({
//   port: env.WS_PORT,
//   fetch: async (req, server) => {

//     const url = new URL(req.url);

//     if (url.pathname === "/") {
//       try {
//         const htmlPath = join(import.meta.dir, "html", "index.html");
//         const htmlContent = readFileSync(htmlPath, "utf-8");
//         return new Response(htmlContent, {
//           headers: {
//             "Content-Type": "text/html; charset=utf-8",
//           },
//         });
//       } catch (error) {
//         console.error("Error reading HTML file:", error);
//         return new Response("Error loading page", { status: 500 });
//       }
//     }

//     if (!guard(req)) {
//       console.log(`Unauthorized request ${req.url}`);
//       return new Response("Unauthorized", { status: 401 });
//     }

//     if (url.pathname === "/start-match") {
//       return startMatch(req);
//     }

//     if (url.pathname === "/api/runners") {
//       return new Response(JSON.stringify(runners), {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//     }

//     if (url.pathname === "/api/end-match") {
//       return handleEndMatch(req);
//     }

//     if (url.pathname === "/api/send-match-code") {
//       return handleSendMatchCode(req);
//     }

//     if (url.pathname === "/ws") {
//       if (server.upgrade(req)) {
//         return;
//       }
//       return new Response("Upgrade failed", { status: 500 });
//     }

//     return new Response("Not found", { status: 404 });
//   },
//   websocket: {
//     open: open,
//     message: message,
//     close: close,
//   },
// });

console.log(`WebSocket server listening on port ${server.port}`);

// const reqMatchStartSchema = z.object({
//   matchID: z.string(),
//   map: z.string().optional(),
//   callbackUrl: z.string(),
//   teams: z.object({
//     ct: z.array(z.string()),
//     t: z.array(z.string()),
//   }),
// });

// const endMatchSchema = z.object({
//   runner: z.string(),
//   winner: z.enum(["ct", "t", "error"]),
// });

// const sendMatchCodeSchema = z.object({
//   runner: z.string(),
// });


// async function handleSendMatchCode(req: Request) {
//   try {
//     const body = await req.json();
//     const parsedBody = sendMatchCodeSchema.safeParse(body);

//     if (!parsedBody.success) {
//       return new Response("Invalid request", { status: 400 });
//     }

//     const { runner: runnerName } = parsedBody.data;

//     // Находим runner по имени
//     const runner = runners.find(r => r.name === runnerName);
//     if (!runner) {
//       return new Response("Runner not found", { status: 404 });
//     }

//     if (!runner.matchID) {
//       return new Response("Runner is not in a match", { status: 400 });
//     }

//     // Отправляем код матча через callback URL
//     const matchCode = `https://ovenstandoff.brofrong.ru/`;
//     const callbackUrl = runner.callbackUrl;

//     if (callbackUrl) {
//       await reportMatchCode(runner.matchID, matchCode, callbackUrl);
//     }

//     // Обновляем статус runner на inGame (матч запущен)
//     runner.state = "inGame";

//     broadcastRunnersUpdate();

//     return new Response("Match code sent successfully", { status: 200 });
//   } catch (error) {
//     console.error("Error sending match code:", error);
//     return new Response("Internal server error", { status: 500 });
//   }
// }
