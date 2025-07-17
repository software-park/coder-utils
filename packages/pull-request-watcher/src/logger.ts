import { pino } from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    targets: [
      {
        level: "info",
        target: "pino-pretty",
      },
      {
        level: "trace",
        target: "pino/file",
        options: { destination: `/tmp/pull-request-watcher.log`, mkdir: true },
      },
    ],
  },
});
