import { CronJob } from "cron";
import {
  getLatestCommitAtFromPullRequest,
  getPullRequestReviewComments,
} from "./src/github.js";
import {
  getStateFilePath,
  loadLastCheckTime,
  saveLastCheckTime,
  sendToAgent,
  formatCommentsForAgent,
  checkAgentStatus,
} from "./src/utils.js";
import { argv } from "process";

const owner = argv[2] || process.env.GITHUB_OWNER;
const repo = argv[3] || process.env.GITHUB_REPO;
const pullNumber = parseInt(argv[4] || process.env.PULL_NUMBER || "");
const agentUrl = "http://localhost:3284";

if (!owner || !repo || isNaN(pullNumber)) {
  console.error("Usage: node index.js <owner> <repo> <pullNumber>");
  process.exit(1);
}

// 상태 파일 경로 설정
const stateFilePath = getStateFilePath(owner, repo, pullNumber);

let lastCheckTime = loadLastCheckTime(stateFilePath);

console.log(`🚀 Pull Request Watcher가 시작되었습니다.`);
console.log(`📋 감시 대상: ${owner}/${repo} PR #${pullNumber}`);
console.log(`🤖 Agent URL: ${agentUrl}`);
console.log(`⏰ 5분마다 새로운 review comment를 확인합니다.`);
console.log(`📅 시작 시간: ${lastCheckTime}`);

const job = new CronJob("*/5 * * * *", async function () {
  try {
    console.log(
      `\n🔍 새로운 review comment 확인 중... (${new Date().toISOString()})`
    );

    // Agent 상태 확인
    const { status, isRunning } = await checkAgentStatus(agentUrl);

    if (isRunning) {
      console.log(
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
      console.log(
        `✨ ${comments.length}개의 새로운 review comment를 발견했습니다!`
      );

      // 각 댓글을 출력
      comments.forEach((comment, index) => {
        console.log(`\n📝 Comment ${index + 1}:`);
        console.log(`   👤 작성자: ${comment.user}`);
        console.log(`   📂 파일: ${comment.path}`);
        console.log(`   💬 내용: ${comment.body}`);
        console.log(`   📅 작성 시간: ${comment.created_at}`);
        console.log(`   🔗 diff: ${comment.diff_hunk}`);
      });

      // 모든 댓글을 한번에 Agent에게 전달
      console.log(`\n🤖 모든 댓글을 Agent에게 전달 중...`);
      const formattedMessage = formatCommentsForAgent(
        comments,
        owner,
        repo,
        pullNumber
      );
      const success = await sendToAgent(formattedMessage, agentUrl);

      if (success) {
        console.log(
          `✅ ${comments.length}개의 댓글이 Agent에게 성공적으로 전달되었습니다.`
        );
      } else {
        console.log(`❌ Agent 전달 실패`);
      }

      // 마지막 확인 시간을 가장 최신 댓글의 시간으로 업데이트
      const latestCommentTime = comments[0].created_at;
      lastCheckTime = latestCommentTime;
      saveLastCheckTime(stateFilePath, lastCheckTime, owner, repo, pullNumber);
      console.log(`⏰ 마지막 확인 시간 업데이트: ${lastCheckTime}`);
    } else {
      console.log(`💤 새로운 review comment가 없습니다.`);
    }
  } catch (error) {
    console.error(`❌ 오류 발생:`, error);
  }
});

console.log(`\n⏰ Cron job이 시작됩니다. (Ctrl+C로 종료)`);

job.start();
