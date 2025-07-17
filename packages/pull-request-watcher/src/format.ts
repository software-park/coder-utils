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

  const commentSections = comments
    .map(
      (comment, index) => `
=== Comment ${index + 1} ===
작성자: ${comment.user}
파일: ${comment.path}
작성 시간: ${comment.created_at}

댓글 내용:
${comment.body}

Diff:
${comment.diff_hunk}
`
    )
    .join("\n");

  return `${header}${commentSections}

이 댓글들에 대해 적절한 작업을 수행해주세요.`;
}
