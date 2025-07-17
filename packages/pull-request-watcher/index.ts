import { CronJob } from "cron";
import { argv } from "process";
import { checkAgentStatus, sendToAgent } from "./src/agent.js";
import { formatCommentsForAgent } from "./src/format.js";
import { getPullRequestReviewComments } from "./src/github.js";
import { logger } from "./src/logger.js";
import { loadLastCheckTime, saveLastCheckTime } from "./src/state-manger.js";

const owner = argv[2] || process.env.GITHUB_OWNER;
const repo = argv[3] || process.env.GITHUB_REPO;
const pullNumber = parseInt(argv[4] || process.env.PULL_NUMBER || "");
const agentUrl = "http://localhost:3284";

if (!owner || !repo || isNaN(pullNumber)) {
  logger.error("Usage: node index.js <owner> <repo> <pullNumber>");
  process.exit(1);
}

let lastCheckTime = loadLastCheckTime(owner, repo, pullNumber);

logger.info(`🚀 Pull Request Watcher가 시작되었습니다.`);
logger.info(`📋 감시 대상: ${owner}/${repo} PR #${pullNumber}`);
logger.info(`🤖 Agent URL: ${agentUrl}`);
logger.info(`⏰ 5분마다 새로운 review comment를 확인합니다.`);
logger.info(`📅 시작 시간: ${lastCheckTime}`);

const job = new CronJob("*/5 * * * *", async function () {
  try {
    logger.info(
      `\n🔍 새로운 review comment 확인 중... (${new Date().toISOString()})`
    );

    // Agent 상태 확인
    const { status, isRunning } = await checkAgentStatus(agentUrl);

    if (isRunning) {
      logger.warn(
        `⏸️ Agent가 현재 작업 중입니다 (상태: ${status}). 이번 주기를 건너뜁니다.`
      );
      return;
    }

    // lastCheckTime 이후의 새로운 comment들을 가져옴
    const comments = await getPullRequestReviewComments(
      owner,
      repo,
      lastCheckTime,
      pullNumber
    );

    if (comments.length > 0) {
      logger.info(
        `✨ ${comments.length}개의 새로운 review comment를 발견했습니다!`
      );

      // 각 댓글을 출력
      comments.forEach((comment, index) => {
        logger.info(`\n📝 Comment ${index + 1}:`);
        logger.info(`   👤 작성자: ${comment.user}`);
        logger.info(`   📂 파일: ${comment.path}`);
        logger.info(`   💬 내용: ${comment.body}`);
        logger.info(`   📅 작성 시간: ${comment.created_at}`);
        logger.info(`   🔗 diff: ${comment.diff_hunk}`);
      });

      // 모든 댓글을 한번에 Agent에게 전달
      logger.info(`\n🤖 모든 댓글을 Agent에게 전달 중...`);
      const formattedMessage = formatCommentsForAgent(
        comments,
        owner,
        repo,
        pullNumber
      );
      const success = await sendToAgent(formattedMessage, agentUrl);

      if (success) {
        logger.info(
          `✅ ${comments.length}개의 댓글이 Agent에게 성공적으로 전달되었습니다.`
        );
      } else {
        logger.error(`❌ Agent 전달 실패`);
      }

      // 마지막 확인 시간을 가장 최신 댓글의 시간으로 업데이트
      const latestCommentTime = comments[0].created_at;
      lastCheckTime = latestCommentTime;
      saveLastCheckTime(lastCheckTime, owner, repo, pullNumber);
      logger.info(`⏰ 마지막 확인 시간 업데이트: ${lastCheckTime}`);
    } else {
      logger.info(`💤 새로운 review comment가 없습니다.`);
    }
  } catch (error) {
    logger.error(`❌ 오류 발생:`, error);
  }
});

logger.info(`\n⏰ Cron job이 시작됩니다. (Ctrl+C로 종료)`);

job.start();
