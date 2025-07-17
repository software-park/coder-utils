import { logger } from "./logger.js";

/**
 * Agent에게 HTTP 요청을 보냅니다.
 */
export async function sendToAgent(
  content: string,
  agentUrl: string = "http://localhost:3284"
): Promise<boolean> {
  try {
    const response = await fetch(`${agentUrl}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        type: "user",
      }),
    });

    if (response.ok) {
      logger.info(`🤖 Agent에게 메시지를 성공적으로 전달했습니다.`);
      return true;
    } else {
      logger.error(
        `❌ Agent 요청 실패: ${response.status} ${response.statusText}`
      );
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Agent 요청 중 오류 발생: ${errorMessage}`);
    return false;
  }
}

/**
 * Agent의 현재 상태를 확인합니다.
 */
export async function checkAgentStatus(
  agentUrl: string = "http://localhost:3284"
): Promise<{ status: string; isRunning: boolean }> {
  try {
    const response = await fetch(`${agentUrl}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const status = data.status || "unknown";
      const isRunning = status === "running";

      logger.info(`🔍 Agent 상태 확인: ${status}`);
      return { status, isRunning };
    } else {
      logger.error(
        `❌ Agent 상태 확인 실패: ${response.status} ${response.statusText}`
      );
      return { status: "error", isRunning: false };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Agent 상태 확인 중 오류 발생: ${errorMessage}`);
    return { status: "error", isRunning: false };
  }
}
