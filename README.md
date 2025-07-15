# Coder Utils

Coder 서비스를 통한 작업 자동화를 위한 유틸리티 모음집으로, GitHub API 연동과 Pull Request 관리를 위한 도구들을 제공합니다.

## 프로젝트 구조

이 프로젝트는 pnpm workspace를 사용하는 모노레포로 구성되어 있으며, 다음과 같은 패키지들을 포함합니다:

```
@softwarepark/coder-utils/
├── packages/
│   ├── mcp-github/          # GitHub API MCP Server
│   └── pull-request-watcher/ # PR 코멘트 자동 감시 도구
└── ...
```

## 패키지 소개

### 🐙 MCP GitHub (`@softwarepack/mcp-github`)

GitHub API를 위한 Model Context Protocol (MCP) 서버입니다. Claude나 다른 AI 모델이 GitHub과 상호작용할 수 있도록 도와줍니다.

**주요 기능:**
- 📁 파일 생성/수정/삭제
- 🌿 자동 브랜치 생성
- 🔍 코드, 이슈, PR 검색
- 📊 저장소 관리
- 🤝 Pull Request 관리
- 💾 배치 파일 업로드
- ⚡ 포괄적인 에러 핸들링

### 👀 Pull Request Watcher (`@softwarepack/pull-request-watcher`)

GitHub Pull Request의 새로운 리뷰 코멘트를 실시간으로 감시하고 자동으로 처리하는 도구입니다.

**주요 기능:**
- ⏰ 5분 주기로 새로운 review comment 자동 확인
- 🤖 Agent 상태 확인 및 작업 중일 때 대기
- 📝 새로운 댓글 발견 시 상세 정보 출력
- 🚀 Agent에게 HTTP 요청으로 댓글 내용 자동 전달
- 💾 상태 파일을 통한 지속성 (재시작해도 이전 상태 유지)
- 🔄 백그라운드에서 지속적으로 실행

## 시작하기

### 필요 조건

- Node.js 18 이상
- pnpm (패키지 매니저)
- GitHub Personal Access Token 또는 GitHub App 설정

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd mcp

# 의존성 설치
pnpm install

# 모든 패키지 빌드
pnpm run build
```

### 사용법

각 패키지는 독립적으로 사용할 수 있습니다:

#### MCP GitHub 서버 실행
```bash
cd packages/mcp-github
# 환경 변수 설정 후
pnpm start
```

#### Pull Request Watcher 실행
```bash
cd packages/pull-request-watcher
# 환경 변수 설정 후
pnpm start
```

## 개발

### 새 패키지 추가

```bash
# packages/ 디렉토리에 새 패키지 생성
mkdir packages/new-package
cd packages/new-package
pnpm init

# pnpm-workspace.yaml에 자동으로 포함됨
```

### 빌드 및 테스트

```bash
# 모든 패키지 빌드
pnpm run build

# 특정 패키지 빌드
pnpm --filter @softwarepack/mcp-github run build
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 각 패키지의 라이선스 파일을 참조하세요.

## 패키지 문서

각 패키지의 자세한 사용법은 해당 디렉토리의 README.md 파일을 참조하세요:

- [MCP GitHub 서버 문서](./packages/mcp-github/README.md)
- [Pull Request Watcher 문서](./packages/pull-request-watcher/README.md)
