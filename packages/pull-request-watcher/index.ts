#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { schedulePullRequestCheck } from "./src/schedule.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CronJob } from "cron";
import fetch from "node-fetch";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const agentUrl = "http://localhost:3284";

// If fetch doesn't exist in global scope, add it
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

const server = new Server(
  {
    name: "pull-request-watcher",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_watch",
        description: "Start pull request watche scheduler",
        inputSchema: zodToJsonSchema(
          z.object({
            owner: z.string().describe("Repository owner"),
            repo: z.string().describe("Repository name"),
            pullNumber: z.number().describe("Pull request number"),
          })
        ),
      },
    ],
  };
});

// 실행 중인 스케줄러를 추적하는 Map
const activeSchedulers = new Map<string, CronJob>();

// 스케줄러 키 생성 함수
function getSchedulerKey(
  owner: string,
  repo: string,
  pullNumber: number
): string {
  return `${owner}/${repo}/pr/${pullNumber}`;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "start_watch": {
        const args = z
          .object({
            owner: z.string(),
            repo: z.string(),
            pullNumber: z.number(),
          })
          .parse(request.params.arguments);

        const schedulerKey = getSchedulerKey(
          args.owner,
          args.repo,
          args.pullNumber
        );

        // 이미 실행 중인 스케줄러가 있는지 확인
        if (activeSchedulers.has(schedulerKey)) {
          return {
            content: [
              {
                type: "text",
                text: `Pull request watcher for ${schedulerKey} is already running. Use stop_watch to stop it first.`,
              },
            ],
          };
        }

        // Start the pull request watcher
        const job = schedulePullRequestCheck(
          args.owner,
          args.repo,
          args.pullNumber,
          agentUrl
        );

        // 활성 스케줄러 맵에 추가
        activeSchedulers.set(schedulerKey, job);

        return {
          content: [
            {
              type: "text",
              text: `Pull request watcher started for ${schedulerKey}`,
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }

    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Pull request watcher MCP Server running on stdio");
}

// 프로세스 종료 시 모든 활성 스케줄러 정리
process.on("SIGINT", () => {
  console.log("\n📦 Shutting down pull request watcher...");
  activeSchedulers.forEach((job, key) => {
    console.log(`🛑 Stopping scheduler for ${key}`);
    job.stop();
  });
  activeSchedulers.clear();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n📦 Shutting down pull request watcher...");
  activeSchedulers.forEach((job, key) => {
    console.log(`🛑 Stopping scheduler for ${key}`);
    job.stop();
  });
  activeSchedulers.clear();
  process.exit(0);
});

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
