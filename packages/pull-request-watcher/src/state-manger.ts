import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { logger } from "./logger.js";

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
function getStateFilePath(
  owner: string,
  repo: string,
  pullNumber: number
): string {
  return path.join("/tmp", `.pr-watcher-${owner}-${repo}-${pullNumber}.json`);
}

/**
 * 마지막 확인 시간을 파일에서 로드하거나 현재 시간으로 초기화합니다.
 */
export function loadLastCheckTime(
  owner: string,
  repo: string,
  pullNumber: number
): string {
  try {
    const stateFilePath = getStateFilePath(owner, repo, pullNumber);

    if (existsSync(stateFilePath)) {
      const stateData: StateData = JSON.parse(
        readFileSync(stateFilePath, "utf8")
      );

      logger.info(`📁 이전 상태를 불러왔습니다: ${stateData.lastCheckTime}`);

      return stateData.lastCheckTime;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`⚠️ 상태 파일을 읽는 중 오류 발생: ${errorMessage}`);
  }

  const initialTime = new Date().toISOString();
  logger.info(`🆕 새로운 세션을 시작합니다: ${initialTime}`);
  return initialTime;
}

/**
 * 마지막 확인 시간을 파일에 저장합니다.
 */
export function saveLastCheckTime(
  timestamp: string,
  owner: string,
  repo: string,
  pullNumber: number
): void {
  try {
    const stateFilePath = getStateFilePath(owner, repo, pullNumber);
    const stateData: StateData = {
      lastCheckTime: timestamp,
      owner,
      repo,
      pullNumber,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(stateFilePath, JSON.stringify(stateData, null, 2));

    logger.info(`💾 상태가 저장되었습니다: ${stateFilePath}`);
  } catch (error) {
    logger.error(`❌ 상태 저장 중 오류 발생:`, error);
  }
}
