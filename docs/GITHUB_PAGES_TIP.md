# GitHub Pages를 활용한 리소스 배포 전략

> ngrok 무료 플랜의 제약을 극복하고, 인라인 방식의 단점을 해결하는 우아한 대안

---

## 🎯 문제 상황

### Phase 4에서 직면한 CORS 이슈

Apps in ChatGPT로 UI를 띄울 때, HTML에서 불러오는 JS/CSS 리소스가 ChatGPT 환경 내에서 404 에러를 발생시키는 문제가 있었습니다.

```
Access to CSS stylesheet at 'http://localhost:4444/portfolio-builder.css'
from origin 'https://chatgpt.com' has been blocked by CORS policy
```

### 우리의 임시 해결책: 인라인 방식

**구현 방법**:
- MCP 서버에서 CSS/JS 파일을 읽어 HTML에 `<style>`, `<script>` 태그로 직접 삽입
- 외부 리소스 로드 불필요 → CORS 문제 완전 해결

**장점**:
- ✅ CORS 이슈 완전 해결
- ✅ 단일 HTML 파일로 완결
- ✅ 네트워크 요청 감소

**단점**:
- ❌ **HTML 파일 크기 증가** (CSS + JS 포함 → ~200KB)
- ❌ **코드 재사용성 저하** (매번 전체 코드 인라인화)
- ❌ **브라우저 캐싱 불가능** (리소스 변경 시 전체 다시 로드)
- ❌ **개발/디버깅 어려움** (빌드 없이 CSS/JS만 수정 불가)

---

## 💡 더 나은 해결책: GitHub Pages 활용

친구가 공유해준 방법으로, ngrok 무료 플랜의 제약을 극복하면서도 인라인 방식의 단점을 모두 해결할 수 있습니다.

### 아키텍처

```
┌─────────────────────┐
│   ChatGPT Widget    │
│                     │
│  HTML (from MCP)    │
└──────────┬──────────┘
           │
           ├─────────────────────────┐
           │                         │
           v                         v
┌──────────────────┐      ┌──────────────────────┐
│  MCP Server      │      │  GitHub Pages        │
│  (ngrok)         │      │  (Static Hosting)    │
│                  │      │                      │
│  - Tool logic    │      │  - portfolio.css     │
│  - Widget state  │      │  - portfolio.js      │
└──────────────────┘      └──────────────────────┘
```

### 구현 방법

#### 1. GitHub Pages 설정

**리포지토리 구조**:

```
portfolio-builder-chatgpt/
├── assets/                    # 빌드 결과물
│   ├── portfolio-builder.css
│   └── portfolio-builder.js
├── docs/                      # GitHub Pages 소스
└── .github/
    └── workflows/
        └── deploy-pages.yml   # 자동 배포 워크플로우
```

**GitHub Pages 활성화**:
1. GitHub 리포지토리 → Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main`, Folder: `/assets`
4. 저장

**결과 URL**:
```
https://[username].github.io/portfolio-builder-chatgpt/portfolio-builder.css
https://[username].github.io/portfolio-builder-chatgpt/portfolio-builder.js
```

#### 2. MCP 서버 수정

**파일**: `mcp-server/src/server.ts`

```typescript
function readWidgetHtml(componentName: string): string {
  // GitHub Pages URL (배포 후 실제 URL로 변경)
  const GITHUB_PAGES_BASE = "https://[username].github.io/portfolio-builder-chatgpt";

  // 로컬 개발용 빌드 파일 확인
  const ASSETS_DIR = path.resolve(__dirname, "../../assets");

  // CSS, JS 파일 찾기 (최신 해시 파일)
  const cssFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((file) => file.startsWith(`${componentName}-`) && file.endsWith(".css"))
    .sort();

  const jsFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((file) => file.startsWith(`${componentName}-`) && file.endsWith(".js"))
    .sort();

  if (cssFiles.length === 0 || jsFiles.length === 0) {
    throw new Error(
      `Widget assets for "${componentName}" not found. Run "pnpm run build".`
    );
  }

  const cssFile = cssFiles[cssFiles.length - 1];
  const jsFile = jsFiles[jsFiles.length - 1];

  // GitHub Pages에서 리소스 참조
  return `<!doctype html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline' ${GITHUB_PAGES_BASE}; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${GITHUB_PAGES_BASE};" />
  <link rel="stylesheet" href="${GITHUB_PAGES_BASE}/${cssFile}" crossorigin="anonymous" />
</head>
<body>
  <div id="${componentName}-root"></div>
  <script type="module" src="${GITHUB_PAGES_BASE}/${jsFile}" crossorigin="anonymous"></script>
</body>
</html>
`;
}
```

**주요 변경사항**:
- CSS/JS를 인라인하지 않고 GitHub Pages URL로 외부 참조
- CSP 메타 태그에 GitHub Pages 도메인 허용
- `crossorigin="anonymous"` 속성으로 CORS 명시

#### 3. GitHub Actions 자동 배포 (선택)

**파일**: `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'assets/**'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './assets'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**자동화 효과**:
- `assets/` 디렉토리 변경 시 자동 배포
- 빌드 후 커밋하면 즉시 GitHub Pages에 반영

#### 4. 빌드 및 배포 프로세스

```bash
# 1. 위젯 빌드
pnpm run build
# assets/portfolio-builder-[hash].css
# assets/portfolio-builder-[hash].js 생성

# 2. Git 커밋 및 푸시
git add assets/
git commit -m "Update widget assets"
git push origin main

# 3. GitHub Actions가 자동으로 GitHub Pages에 배포
# (약 1-2분 소요)

# 4. MCP 서버 재시작
cd mcp-server
pnpm start

# 5. ngrok 터널 생성
ngrok http 8000 --host-header=rewrite

# 6. ChatGPT에서 테스트
```

---

## 📊 비교 분석

### 인라인 방식 vs GitHub Pages 방식

| 항목 | 인라인 방식 | GitHub Pages 방식 |
|------|------------|------------------|
| **CORS 해결** | ✅ 완전 해결 | ✅ 완전 해결 |
| **HTML 크기** | ❌ ~200KB | ✅ ~1KB |
| **브라우저 캐싱** | ❌ 불가능 | ✅ 가능 |
| **코드 재사용성** | ❌ 낮음 | ✅ 높음 |
| **개발 속도** | ❌ 느림 (매번 빌드) | ✅ 빠름 (CSS/JS만 수정) |
| **ngrok 터널** | ✅ 1개 (MCP만) | ✅ 1개 (MCP만) |
| **추가 설정** | ✅ 없음 | ❌ GitHub Pages 설정 필요 |
| **배포 복잡도** | ✅ 단순 | ⚠️ 약간 복잡 |

### 언제 어떤 방식을 사용할까?

| 상황 | 권장 방식 | 이유 |
|------|----------|------|
| **프로토타입/POC** | 인라인 | 빠른 검증, 설정 불필요 |
| **개발/테스트** | GitHub Pages | 빠른 반복 개발 |
| **프로덕션** | GitHub Pages | 성능, 캐싱, 확장성 |
| **오프라인 데모** | 인라인 | 외부 의존성 없음 |

---

## 🚀 Phase 2 적용 계획

### 1. GitHub Pages 설정

```bash
# 리포지토리 생성 (이미 존재하면 스킵)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/portfolio-builder-chatgpt.git
git push -u origin main

# GitHub Pages 활성화
# Settings → Pages → Source: main → Folder: /assets → Save
```

### 2. MCP 서버 업데이트

- `readWidgetHtml` 함수를 GitHub Pages 방식으로 변경
- CSP 정책에 GitHub Pages 도메인 추가
- `crossorigin="anonymous"` 속성 추가

### 3. 개발 워크플로우

```bash
# 위젯 수정
vi src/portfolio-builder/portfolio-builder.jsx

# 빌드
pnpm run build

# 커밋 (GitHub Actions가 자동 배포)
git add assets/
git commit -m "Update widget UI"
git push

# MCP 서버 재시작 (GitHub Pages 반영 대기: ~1-2분)
sleep 120
cd mcp-server
pnpm start

# ChatGPT에서 테스트
```

---

## 🔍 트러블슈팅

### 문제 1: GitHub Pages에서 404 에러

**원인**: GitHub Pages가 아직 배포되지 않음

**해결**:
```bash
# GitHub Actions 상태 확인
gh run list

# 배포 완료 대기
gh run watch
```

### 문제 2: CSP 정책 위반

**에러**:
```
Refused to load the stylesheet 'https://[username].github.io/...'
because it violates the following Content Security Policy directive
```

**해결**: CSP 메타 태그에 GitHub Pages 도메인 추가
```html
<meta http-equiv="Content-Security-Policy"
      content="style-src 'self' https://[username].github.io;
               script-src 'self' https://[username].github.io;" />
```

### 문제 3: 캐싱으로 인한 이전 버전 로드

**원인**: GitHub Pages가 파일을 캐싱함

**해결**:
1. 파일명에 해시 포함 (Vite 기본 설정)
   ```
   portfolio-builder-abc123.js → portfolio-builder-xyz789.js
   ```
2. 또는 쿼리 파라미터 추가
   ```html
   <script src="https://[...]/portfolio.js?v=2"></script>
   ```

---

## 📝 요약

### 핵심 인사이트

1. **ngrok 무료 플랜 제약 극복**
   - MCP 서버만 ngrok으로 노출
   - 정적 리소스는 GitHub Pages 활용

2. **인라인 방식의 단점 해결**
   - HTML 크기 200KB → 1KB (99% 감소)
   - 브라우저 캐싱 활성화
   - 코드 재사용성 향상

3. **개발 생산성 향상**
   - CSS/JS만 수정 후 즉시 테스트
   - 빌드 → 푸시 → 자동 배포

### 다음 단계

Phase 2에서 GitHub Pages 방식을 적용하여:
- 블록 시스템 개발 속도 향상
- 프로덕션 배포 준비
- 사용자 경험 개선 (로딩 속도, 캐싱)

---

**작성일**: 2025-01-19
**기여자**: 친구 팁 + wine_ny 문서화
**적용 예정**: Phase 2
