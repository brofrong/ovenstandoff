import pino from "pino";
import path from 'path';

export const log = pino({
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
      {
        target: 'pino/file',
        options: {
          destination: path.join(process.cwd(), 'logs/master-ws.log'),
        },
      }
    ]
  }
});
