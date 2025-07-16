import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface StateData {
  lastCheckTime: string;
  owner: string;
  repo: string;
  pullNumber: number;
  updatedAt: string;
}

/**
 * 상태 파일 경로를 생성합니다.
 */
export function getStateFilePath(owner: string, repo: string, pullNumber: number): string {
  return join('/tmp', `.pr-watcher-${owner}-${repo}-${pullNumber}.json`);
}

/**
 * 마지막 확인 시간을 파일에서 로드하거나 현재 시간으로 초기화합니다.
 */
export function loadLastCheckTime(stateFilePath: string): string {
  try {
    if (existsSync(stateFilePath)) {
      const stateData: StateData = JSON.parse(readFileSync(stateFilePath, 'utf8'));
      console.log(`📁 이전 상태를 불러왔습니다: ${stateData.lastCheckTime}`);
      return stateData.lastCheckTime;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ 상태 파일을 읽는 중 오류 발생: ${errorMessage}`);
  }
  
  const initialTime = new Date().toISOString();
  console.log(`🆕 새로운 세션을 시작합니다: ${initialTime}`);
  return initialTime;
}

/**
 * 마지막 확인 시간을 파일에 저장합니다.
 */
export function saveLastCheckTime(
  stateFilePath: string,
  timestamp: string,
  owner: string,
  repo: string,
  pullNumber: number
): void {
  try {
    const stateData: StateData = {
      lastCheckTime: timestamp,
      owner,
      repo,
      pullNumber,
      updatedAt: new Date().toISOString()
    };
    writeFileSync(stateFilePath, JSON.stringify(stateData, null, 2));
    console.log(`💾 상태가 저장되었습니다: ${stateFilePath}`);
  } catch (error) {
    console.error(`❌ 상태 저장 중 오류 발생:`, error);
  }
}

/**
 * Agent에게 HTTP 요청을 보냅니다.
 */
export async function sendToAgent(content: string, agentUrl: string = "http://localhost:3284"): Promise<boolean> {
  try {
    const response = await fetch(`${agentUrl}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        type: 'user'
      })
    });

    if (response.ok) {
      console.log(`🤖 Agent에게 메시지를 성공적으로 전달했습니다.`);
      return true;
    } else {
      console.error(`❌ Agent 요청 실패: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Agent 요청 중 오류 발생: ${errorMessage}`);
    return false;
  }
}

/**
 * Review comment를 Agent가 이해할 수 있는 형태로 포맷팅합니다.
 */
export function formatCommentForAgent(
  comment: any,
  owner: string,
  repo: string,
  pullNumber: number
): string {
  return `새로운 Pull Request Review Comment가 발견되었습니다:

Repository: ${owner}/${repo}
Pull Request: #${pullNumber}
작성자: ${comment.user}
파일: ${comment.path}
작성 시간: ${comment.created_at}

댓글 내용:
${comment.body}

Diff:
${comment.diff_hunk}

이 댓글에 대해 적절한 작업을 수행해주세요.`;
}

/**
 * 여러 Review comment들을 Agent가 이해할 수 있는 형태로 묶어서 포맷팅합니다.
 */
export function formatCommentsForAgent(
  comments: any[],
  owner: string,
  repo: string,
  pullNumber: number
): string {
  const header = `${comments.length}개의 새로운 Pull Request Review Comment가 발견되었습니다:

Repository: ${owner}/${repo}
Pull Request: #${pullNumber}
`;

  const commentSections = comments.map((comment, index) => `
=== Comment ${index + 1} ===
작성자: ${comment.user}
파일: ${comment.path}
작성 시간: ${comment.created_at}

댓글 내용:
${comment.body}

Diff:
${comment.diff_hunk}
`).join('\n');

  return `${header}${commentSections}

이 댓글들에 대해 적절한 작업을 수행해주세요.`;
}

/**
 * Agent의 현재 상태를 확인합니다.
 */
export async function checkAgentStatus(agentUrl: string = "http://localhost:3284"): Promise<{ status: string; isRunning: boolean }> {
  try {
    const response = await fetch(`${agentUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      const status = data.status || 'unknown';
      const isRunning = status === 'running';
      
      console.log(`🔍 Agent 상태 확인: ${status}`);
      return { status, isRunning };
    } else {
      console.error(`❌ Agent 상태 확인 실패: ${response.status} ${response.statusText}`);
      return { status: 'error', isRunning: false };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Agent 상태 확인 중 오류 발생: ${errorMessage}`);
    return { status: 'error', isRunning: false };
  }
}
