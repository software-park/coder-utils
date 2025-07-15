# Pull Request Watcher

5분 주기로 GitHub Pull Request의 새로운 ## 기능

- 🔍 5분마다 새로운 review comment 확인
- � Agent 상태 확인 및 작업 중일 때 대기
- �📝 새로운 댓글 발견시 상세 정보 출력
- 🤖 Agent에게 HTTP 요청으로 댓글 내용 자동 전달
- ⏰ 마지막 확인 시간 추적
- 💾 상태 파일을 통한 지속성 (재시작해도 이전 상태 유지)
- 🚀 백그라운드에서 지속적으로 실행

## Agent 상태 확인

매 주기마다 Agent의 상태를 확인하여 작업 중인지 체크합니다:

```bash
curl -X GET http://localhost:3284/status
```

응답 예시:
```json
{
  "$schema": "http://localhost:3284/schemas/StatusResponseBody.json",
  "status": "stable"
}
```

- `status: "running"`: Agent가 작업 중 → 이번 주기 건너뛰기
- `status: "stable"`: Agent가 대기 중 → 댓글 확인 및 전달 진행
- 기타 상태: Agent가 대기 중으로 간주

## Agent 통합

새로운 review comment가 발견되면 모든 댓글을 하나의 HTTP 요청으로 묶어서 agent에게 전송합니다:

```bash
curl -X POST http://localhost:3284/message \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"3개의 새로운 Pull Request Review Comment가 발견되었습니다: ...\",
    \"type\": \"user\"
  }"
```

Agent URL은 `AGENT_URL` 환경 변수로 설정할 수 있으며, 기본값은 `http://localhost:3284`입니다.

여러 댓글이 한번에 발견된 경우 각각 개별적으로 보내지 않고 하나의 메시지로 묶어서 전송하므로 agent가 전체 컨텍스트를 이해하고 효율적으로 처리할 수 있습니다.comment를 감시하고 알림을 제공하는 도구입니다.

## 설정

### 환경 변수

다음 환경 변수들을 설정해야 합니다:

```bash
# GitHub App 설정
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY=your_private_key
GITHUB_APP_INSTALLATION_ID=your_installation_id

# 기본 설정 (선택사항, 명령행 인수로 대체 가능)
GITHUB_OWNER=repository_owner
GITHUB_REPO=repository_name
PULL_NUMBER=pull_request_number

# Agent 설정
AGENT_URL=http://localhost:3284  # 기본값, 생략 가능
```

### GitHub App 생성

1. GitHub에서 새로운 App을 생성합니다
2. 다음 권한을 부여합니다:
   - Repository permissions:
     - Pull requests: Read
     - Contents: Read
3. Private key를 생성하고 다운로드합니다
4. 해당 repository에 App을 설치합니다

## 사용법

### 명령행 인수로 실행

```bash
npm run build
node dist/index.js <owner> <repo> <pull_number>
```

예시:
```bash
node dist/index.js microsoft vscode 12345
```

### 환경 변수로 실행

```bash
export GITHUB_OWNER=microsoft
export GITHUB_REPO=vscode
export PULL_NUMBER=12345
node dist/index.js
```

## 기능

- 🔍 5분마다 새로운 review comment 확인
- 📝 새로운 댓글 발견시 상세 정보 출력
- ⏰ 마지막 확인 시간 추적
- � 상태 파일을 통한 지속성 (재시작해도 이전 상태 유지)
- �🚀 백그라운드에서 지속적으로 실행

## 상태 파일

프로그램은 마지막 확인 시간을 JSON 파일로 저장합니다:
- 파일명: `.pr-watcher-{owner}-{repo}-{pullNumber}.json`
- 위치: 실행 디렉토리
- 내용: 마지막 확인 시간, repository 정보, 업데이트 시간

예시:
```json
{
  "lastCheckTime": "2025-07-16T10:05:00.000Z",
  "owner": "microsoft",
  "repo": "vscode",
  "pullNumber": 12345,
  "updatedAt": "2025-07-16T10:05:30.000Z"
}
```

프로그램을 재시작하면 이 파일에서 마지막 확인 시간을 불러와서 중단된 지점부터 다시 시작합니다.

## 출력 예시

```
🚀 Pull Request Watcher가 시작되었습니다.
📋 감시 대상: microsoft/vscode PR #12345
🤖 Agent URL: http://localhost:3284
⏰ 5분마다 새로운 review comment를 확인합니다.
📅 시작 시간: 2025-07-16T10:00:00.000Z

🔍 새로운 review comment 확인 중... (2025-07-16T10:05:00.000Z)
🔍 Agent 상태 확인: stable
✨ 2개의 새로운 review comment를 발견했습니다!

📝 Comment 1:
   👤 작성자: john-doe
   📂 파일: src/main.ts
   💬 내용: This function could be optimized
   📅 작성 시간: 2025-07-16T10:03:00.000Z
   🔗 diff: @@ -10,7 +10,7 @@ function main() {

📝 Comment 2:
   👤 작성자: jane-smith
   📂 파일: src/utils.ts
   💬 내용: Consider adding error handling here
   📅 작성 시간: 2025-07-16T10:04:00.000Z
   🔗 diff: @@ -25,3 +25,3 @@ export function utils() {

🤖 모든 댓글을 Agent에게 전달 중...
🤖 Agent에게 메시지를 성공적으로 전달했습니다.
✅ 2개의 댓글이 Agent에게 성공적으로 전달되었습니다.
⏰ 마지막 확인 시간 업데이트: 2025-07-16T10:04:00.000Z

🔍 새로운 review comment 확인 중... (2025-07-16T10:10:00.000Z)
🔍 Agent 상태 확인: running
⏸️ Agent가 현재 작업 중입니다 (상태: running). 이번 주기를 건너뜁니다.
```

## 개발

```bash
# 빌드
npm run build

# 개발 모드로 실행
npm run prepare
```
