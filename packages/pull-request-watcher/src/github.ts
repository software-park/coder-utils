import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

interface PullRequestReview {
  id: number;
  diff_hunk: string;
  path: string;
  body: string;
  user: string;
  created_at: string;
  updated_at: string;
}

const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    installationId: process.env.GITHUB_APP_INSTALLATION_ID,
  },
});

export const getLatestCommitAtFromPullRequest = async (
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string | undefined> => {
  const pullRequest = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const latestCommit = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: pullRequest.data.head.sha,
  });

  if (latestCommit.data) {
    return latestCommit.data.commit.committer?.date;
  }
};

export const getPullRequestReviewComments = async (
  owner: string,
  repo: string,
  since: string | undefined,
  pullNumber: number
): Promise<PullRequestReview[]> => {
  const params: any = {
    owner,
    repo,
    pull_number: pullNumber,
    direction: "desc",
    sort: "created",
  };

  // since 파라미터가 있을 때만 추가
  if (since) {
    params.since = since;
  }

  const comments = await octokit.rest.pulls.listReviewComments(params);

  return comments.data.map((comment) => ({
    id: comment.id,
    body: comment.body,
    path: comment.path,
    diff_hunk: comment.diff_hunk,
    user: comment.user?.login || "unknown",
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  }));
};
