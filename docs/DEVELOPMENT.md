# ChatGPT Portfolio Builder - 개발 과정 문서

> 개발 기간: 2025-01-19
> 최종 업데이트: 2025-01-19
> 개발자: wine_ny

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [Phase 1: MCP 서버 위젯 등록](#phase-1-mcp-서버-위젯-등록)
4. [Phase 2: 위젯 UI 완성](#phase-2-위젯-ui-완성)
5. [Phase 3: SDK 제약사항 해결](#phase-3-sdk-제약사항-해결)
6. [Phase 4: ngrok 배포 및 ChatGPT 연동](#phase-4-ngrok-배포-및-chatgpt-연동)
7. [주요 트러블슈팅](#주요-트러블슈팅)
8. [기술적 의사결정](#기술적-의사결정)
9. [배운 점과 개선 사항](#배운-점과-개선-사항)

---

## 프로젝트 개요

### 목표

ChatGPT 대화 중 "포트폴리오 만들어줘"라고 하면 인터랙티브 위젯이 표시되어 사용자 정보를 입력받고, AI가 자동으로 포트폴리오 텍스트를 생성하는 시스템 구축.

### 핵심 가치

- **사용자 경험**: ChatGPT 대화 흐름을 끊지 않고 자연스럽게 정보 입력
- **AI 활용**: 단순 폼이 아닌, AI가 입력 데이터를 기반으로 포트폴리오 텍스트 자동 생성
- **확장 가능성**: Phase 1 MVP를 기반으로 블록 시스템, 템플릿 등으로 확장 가능

### 개발 철학

1. **MVP 우선**: 최소 기능(이름, 회사명)으로 빠르게 검증
2. **문서 기반**: 코드보다 먼저 상세 명세서 작성
3. **단계별 검증**: Phase별로 테스트 후 다음 단계 진행

---

## 기술 스택

### Frontend

- **React 19**: UI 컴포넌트 개발
- **Tailwind CSS 4**: 스타일링 (CSP 호환 방식)
- **Vite 7**: 빌드 도구
- **TypeScript 5**: 타입 안정성

### Backend

- **Node.js**: MCP 서버 런타임
- **@modelcontextprotocol/sdk**: OpenAI MCP 프로토콜 구현
- **Zod**: 스키마 검증

### Deployment

- **ngrok**: 로컬 서버 외부 노출 (무료 플랜)
- **serve**: 정적 파일 서버

### Tools

- **pnpm**: 패키지 매니저
- **tsx**: TypeScript 실행

---

## Phase 1: MCP 서버 위젯 등록

### 목표

MCP 서버에 portfolio-builder 위젯을 등록하고 기본 동작을 확인한다.

### 작업 내용

#### 1. MCP 서버 구조 설정

**파일**: `mcp-server/src/server.ts`

```typescript
// 위젯 툴 등록
server.tool(
  "portfolio-builder",
  "Open portfolio builder widget to collect user information",
  {
    name: z.string().optional().describe("User's name"),
    company: z.string().optional().describe("Company name"),
  },
  async ({ name, company }) => {
    const widgetHtml = readWidgetHtml("portfolio-builder");

    return {
      content: [
        {
          type: "text" as const,
          text: "Opening portfolio builder widget...",
        },
        {
          type: "resource" as const,
          resource: {
            uri: "widget://portfolio-builder",
            mimeType: "text/html",
            text: widgetHtml,
          },
        },
      ],
      _meta: {
        progressState: {
          profile: { name, company },
        },
      },
    };
  }
);
```

**핵심 설계**:
- `progressState`를 통해 위젯 상태를 ChatGPT에 저장
- `text/html` 리소스로 위젯 HTML 전달
- Zod 스키마로 파라미터 검증

#### 2. 위젯 HTML 읽기 함수

```typescript
function readWidgetHtml(componentName: string): string {
  const ASSETS_DIR = path.resolve(__dirname, "../../assets");

  // CSS, JS 파일 찾기
  const cssFiles = fs.readdirSync(ASSETS_DIR)
    .filter(file => file.startsWith(`${componentName}-`) && file.endsWith(".css"))
    .sort();

  const jsFiles = fs.readdirSync(ASSETS_DIR)
    .filter(file => file.startsWith(`${componentName}-`) && file.endsWith(".js"))
    .sort();

  const cssFile = cssFiles[cssFiles.length - 1];
  const jsFile = jsFiles[jsFiles.length - 1];

  // 파일 경로 반환 (Phase 1)
  return `<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="http://localhost:4444/${cssFile}" />
</head>
<body>
  <div id="${componentName}-root"></div>
  <script type="module" src="http://localhost:4444/${jsFile}"></script>
</body>
</html>`;
}
```

**주의사항**:
- 빌드 결과물은 해시가 포함된 파일명 (예: `portfolio-builder-abc123.js`)
- 최신 파일을 찾기 위해 정렬 후 마지막 파일 선택

### 테스트 결과

✅ **성공**:
- MCP 서버 시작: `http://localhost:8000`
- 위젯 툴 등록 확인
- SSE 엔드포인트 응답 확인 (`/mcp`)

---

## Phase 2: 위젯 UI 완성

### 목표

React로 포트폴리오 빌더 위젯 UI를 구현하고, 회사명 필드와 검증 로직을 추가한다.

### 작업 내용

#### 1. 기본 컴포넌트 구조

**파일**: `src/portfolio-builder/portfolio-builder.jsx`

```jsx
import React, { useState, useEffect } from "react";
import { useWidgetState } from "../shared/use-widget-state";
import { useOpenAIGlobal } from "../shared/use-openai-global";
import "./portfolio-builder.css";

export function PortfolioBuilder() {
  const [widgetState, setWidgetState] = useWidgetState({
    profile: { name: "", company: "" },
  });

  const [localName, setLocalName] = useState("");
  const [localCompany, setLocalCompany] = useState("");
  const openai = useOpenAIGlobal();

  // 초기 상태 로드
  useEffect(() => {
    if (widgetState.profile) {
      setLocalName(widgetState.profile.name || "");
      setLocalCompany(widgetState.profile.company || "");
    }
  }, []);

  const handleSubmit = () => {
    if (!localName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    setWidgetState({
      ...widgetState,
      profile: { name: localName, company: localCompany },
    });

    openai?.requestCompletion?.({
      messages: [
        {
          role: "user",
          content: `다음 정보로 포트폴리오를 작성해주세요:\n이름: ${localName}\n회사명: ${localCompany || "미입력"}`,
        },
      ],
    });
  };

  return (
    <div className="portfolio-builder">
      <h2>포트폴리오 빌더</h2>

      <div className="form-group">
        <label>이름 *</label>
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="홍길동"
        />
      </div>

      <div className="form-group">
        <label>회사명</label>
        <input
          type="text"
          value={localCompany}
          onChange={(e) => setLocalCompany(e.target.value)}
          placeholder="테크 스타트업 (선택)"
        />
      </div>

      <button onClick={handleSubmit}>생성하기</button>
    </div>
  );
}
```

#### 2. 상태 관리 훅

**파일**: `src/shared/use-widget-state.ts`

```typescript
import { useState, useEffect } from "react";
import { useOpenAIGlobal } from "./use-openai-global";

export function useWidgetState<T>(initialState: T): [T, (newState: T) => void] {
  const openai = useOpenAIGlobal();
  const [state, setState] = useState<T>(initialState);

  // 초기 상태 로드
  useEffect(() => {
    const savedState = openai?.getWidgetState?.();
    if (savedState) {
      setState(savedState as T);
    }
  }, [openai]);

  // 상태 업데이트 함수
  const updateState = (newState: T) => {
    setState(newState);
    openai?.setWidgetState?.(newState);
  };

  return [state, updateState];
}
```

**핵심 로직**:
- `openai.getWidgetState()`: 저장된 상태 불러오기
- `openai.setWidgetState()`: 상태를 ChatGPT에 저장
- React 상태와 ChatGPT 상태 자동 동기화

#### 3. 스타일링

**파일**: `src/portfolio-builder/portfolio-builder.css`

```css
.portfolio-builder {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #2563eb;
}
```

### 테스트 결과

✅ **성공**:
- 위젯 빌드: `pnpm run build`
- 로컬 브라우저 확인: `http://localhost:4444/portfolio-builder-[hash].html`
- 이름, 회사명 입력 및 검증 동작 확인

---

## Phase 3: SDK 제약사항 해결

### 목표

ChatGPT Apps SDK의 제약사항(CSP, 테마)을 해결한다.

### 작업 내용

#### 1. CSP 메타데이터 추가

**문제**: ChatGPT 샌드박스는 `unsafe-inline` 스타일을 허용하지 않음.

**해결**: Vite 빌드 설정에 CSP 메타 태그 추가

**파일**: `vite.config.mts`

```typescript
export default defineConfig({
  plugins: [
    react(),
    {
      name: "insert-csp-meta",
      transformIndexHtml(html) {
        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';" />`
        );
      },
    },
  ],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: `${componentName}-[hash].js`,
        chunkFileNames: `${componentName}-chunk-[hash].js`,
        assetFileNames: `${componentName}-[hash].[ext]`,
      },
    },
  },
});
```

#### 2. 테마 감지 및 다크모드 대응

**파일**: `src/shared/use-theme.ts`

```typescript
import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const detectTheme = () => {
      // 1. ChatGPT 부모 윈도우 테마 감지 (추후 구현)
      // 2. 시스템 테마 감지
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDark ? "dark" : "light");
    };

    detectTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", detectTheme);

    return () => mediaQuery.removeEventListener("change", detectTheme);
  }, []);

  return theme;
}
```

**스타일 적용**:

```css
/* 라이트 모드 (기본) */
.portfolio-builder {
  background: white;
  color: #111827;
}

/* 다크 모드 */
@media (prefers-color-scheme: dark) {
  .portfolio-builder {
    background: #1f2937;
    color: #f9fafb;
  }

  .form-group input {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }
}
```

### 테스트 결과

✅ **성공**:
- CSP 메타 태그가 HTML에 포함됨
- 시스템 다크모드 변경 시 위젯 스타일 자동 전환
- `unsafe-inline` 없이 Tailwind CSS 정상 동작

---

## Phase 4: ngrok 배포 및 ChatGPT 연동

### 목표

로컬 서버를 ngrok으로 외부에 노출하고 ChatGPT에서 실제 위젯을 테스트한다.

### 작업 내용

#### 1. ngrok 설정

```bash
# MCP 서버 시작 (터미널 1)
cd mcp-server
pnpm start
# http://localhost:8000

# 정적 파일 서버 시작 (터미널 2)
pnpm run serve
# http://localhost:4444

# ngrok 터널 생성 (터미널 3)
ngrok http 8000 --host-header=rewrite
# https://<random>.ngrok-free.app
```

**주의사항**:
- ngrok 무료 플랜은 재시작 시 URL 변경
- `--host-header=rewrite` 플래그로 호스트 헤더 문제 해결

#### 2. ChatGPT 커넥터 등록

1. ChatGPT → Settings → Connectors
2. Developer Mode 활성화
3. Add Connector
4. URL: `https://<ngrok-url>/mcp`
5. 저장 및 활성화

#### 3. CORS 이슈 해결

**문제**: ChatGPT 샌드박스에서 외부 CSS/JS 로드 실패

```
Access to CSS stylesheet at 'http://localhost:4444/portfolio-builder-abc123.css'
from origin 'https://chatgpt.com' has been blocked by CORS policy
```

**원인**:
- ChatGPT 샌드박스는 외부 리소스 로드에 엄격한 CORS 정책 적용
- `localhost:4444`는 CORS 헤더를 설정해도 브라우저 보안 정책에 의해 차단

**해결**: CSS/JS를 HTML에 인라인으로 포함

**파일**: `mcp-server/src/server.ts`

```typescript
function readWidgetHtml(componentName: string): string {
  const ASSETS_DIR = path.resolve(__dirname, "../../assets");

  // 파일 찾기
  const cssFiles = fs.readdirSync(ASSETS_DIR)
    .filter(file => file.startsWith(`${componentName}-`) && file.endsWith(".css"))
    .sort();

  const jsFiles = fs.readdirSync(ASSETS_DIR)
    .filter(file => file.startsWith(`${componentName}-`) && file.endsWith(".js"))
    .sort();

  if (cssFiles.length === 0 || jsFiles.length === 0) {
    throw new Error(
      `Widget assets for "${componentName}" not found. Run "pnpm run build".`
    );
  }

  const cssFile = cssFiles[cssFiles.length - 1];
  const jsFile = jsFiles[jsFiles.length - 1];

  // 파일 내용 읽기
  const cssContent = fs.readFileSync(path.join(ASSETS_DIR, cssFile), "utf8");
  const jsContent = fs.readFileSync(path.join(ASSETS_DIR, jsFile), "utf8");

  // 인라인 HTML 생성
  return `<!doctype html>
<html>
<head>
  <style>${cssContent}</style>
</head>
<body>
  <div id="${componentName}-root"></div>
  <script type="module">${jsContent}</script>
</body>
</html>
`;
}
```

**장점**:
- ✅ 외부 리소스 로드 불필요 → CORS 문제 완전 해결
- ✅ 단일 HTML 파일로 완결 → 배포 간소화
- ✅ 네트워크 요청 감소 → 로딩 속도 향상

**단점**:
- ❌ HTML 파일 크기 증가 (CSS + JS 포함)
- ❌ 브라우저 캐싱 불가능

**의사결정**: 위젯 크기가 작고(~50KB) CORS 문제 해결이 우선이므로 인라인 방식 채택.

#### 4. 서버 재시작 및 테스트

```bash
# MCP 서버 재시작
cd mcp-server
pkill -9 node  # 기존 프로세스 종료
pnpm start

# ngrok 재시작
pkill -9 ngrok
ngrok http 8000 --host-header=rewrite

# 새 ngrok URL 확인
# 예: https://3a815e0810b9.ngrok-free.app
```

**ChatGPT 테스트**:

```
사용자: "포트폴리오 만들어줘"

ChatGPT: [위젯 팝업]

사용자: 이름: 김철수, 회사명: 테크 스타트업 입력 후 생성하기 클릭

ChatGPT: "김철수님의 포트폴리오가 생성되었습니다!

## 김철수 | 테크 스타트업

안녕하세요, 저는 테크 스타트업에서 근무하는 김철수입니다. ..."
```

### 테스트 결과

✅ **Phase 4 완료**:
- ngrok 터널 정상 작동
- ChatGPT 커넥터 등록 성공
- 위젯이 ChatGPT에서 정상 렌더링
- CORS 이슈 완전 해결
- E2E 플로우 성공

---

## 주요 트러블슈팅

### 1. CORS 이슈 (중요!)

**문제**:
```
Access to CSS stylesheet at 'http://localhost:4444/...' has been blocked by CORS policy
```

**시도한 해결책**:
1. ❌ `serve --cors` 플래그 사용 → 실패 (브라우저 보안 정책)
2. ❌ ngrok으로 정적 파일 서버 노출 → 실패 (추가 복잡도)
3. ✅ **CSS/JS 인라인화** → 성공

**최종 해결**:
- MCP 서버에서 CSS/JS 파일을 읽어 HTML에 `<style>`, `<script>` 태그로 삽입
- 외부 리소스 로드 불필요 → CORS 문제 근본 해결

**교훈**:
- ChatGPT 샌드박스는 외부 리소스 로드에 매우 제한적
- 위젯은 가능한 자기 완결적(self-contained)으로 설계해야 함

### 2. ngrok URL 변경 문제

**문제**: ngrok 무료 플랜은 재시작 시 URL이 매번 변경됨.

**해결**:
- 개발 중에는 ngrok URL 변경 시 ChatGPT 커넥터 재등록
- 프로덕션에서는 ngrok 유료 플랜 또는 고정 도메인 사용 권장

### 3. 위젯 빌드 파일 찾기

**문제**: Vite 빌드 결과물에 해시가 포함되어 파일명이 동적임.

**해결**:
```typescript
const cssFiles = fs.readdirSync(ASSETS_DIR)
  .filter(file => file.startsWith(`${componentName}-`) && file.endsWith(".css"))
  .sort();

const cssFile = cssFiles[cssFiles.length - 1]; // 최신 파일
```

### 4. `window.openai` undefined

**문제**: 로컬 브라우저에서 직접 HTML을 열면 `window.openai`가 없음.

**해결**:
- 로컬 테스트는 UI만 확인 (상태 동기화는 테스트 불가)
- ChatGPT 샌드박스에서만 `window.openai` 사용 가능
- 개발 중에는 조건부 체크 추가:
  ```typescript
  if (openai) {
    openai.setWidgetState(state);
  }
  ```

---

## 기술적 의사결정

### 1. 인라인 CSS/JS vs 외부 파일

| 방식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| 외부 파일 | 캐싱 가능, HTML 크기 작음 | CORS 이슈, 추가 서버 필요 | ❌ |
| 인라인 | CORS 없음, 단일 파일 배포 | 캐싱 불가, 파일 크기 증가 | ✅ |

**결정**: 인라인 방식 채택
- 위젯 크기가 작음 (~50KB)
- CORS 문제 완전 해결
- 배포 단순화

### 2. 상태 관리: 로컬 상태 vs ChatGPT 상태

**설계**:
- **로컬 상태**: `useState`로 실시간 입력 관리
- **ChatGPT 상태**: 제출 시에만 `setWidgetState` 호출

**이유**:
- 타이핑할 때마다 ChatGPT에 저장하면 성능 저하
- 제출 시점에만 상태를 저장하면 충분

### 3. Tailwind CSS vs Vanilla CSS

**선택**: Vanilla CSS

**이유**:
- Phase 1 MVP는 스타일이 단순함
- Tailwind 설정 복잡도 불필요
- CSP 호환성 문제 가능성

**향후 계획**: Phase 2 이후 Tailwind 도입 고려

---

## 배운 점과 개선 사항

### 배운 점

1. **ChatGPT Apps SDK 제약사항 이해**
   - CORS 정책이 매우 엄격함
   - 자기 완결적 위젯 설계가 중요

2. **MCP 프로토콜 구조**
   - `progressState`로 상태 관리
   - `text/html` 리소스로 위젯 전달
   - Zod 스키마로 타입 안전성

3. **ngrok 활용**
   - 무료 플랜의 한계 (URL 변경)
   - `--host-header=rewrite` 플래그 필요성

4. **React Hooks 패턴**
   - `useWidgetState`로 ChatGPT 상태 추상화
   - `useOpenAIGlobal`로 전역 객체 안전하게 사용

### 개선 사항

1. **Phase 2: 블록 시스템**
   - 이력, 프로젝트, 기술 스택 블록 추가
   - 드래그 앤 드롭으로 블록 순서 변경

2. **템플릿 시스템**
   - 미니멀, 전문가, 크리에이티브 템플릿
   - 사용자 커스터마이징 옵션

3. **내보내기 기능**
   - Markdown, PDF, HTML, JSON 지원
   - 클립보드 복사 기능

4. **저장 및 불러오기**
   - 로컬 스토리지 활용
   - 클라우드 동기화 (선택)

5. **AI 기능 강화**
   - 자동 완성 (이름만 입력하면 LinkedIn에서 정보 추천)
   - 스마트 추천 (산업별 맞춤 포트폴리오 구조)

---

## 참고 자료

- [OpenAI Apps SDK 공식 문서](https://developers.openai.com/apps-sdk)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [Vite 공식 문서](https://vitejs.dev/)
- [React 공식 문서](https://react.dev/)

---

**개발 완료일**: 2025-01-19
**다음 단계**: Phase 2 블록 시스템 설계 및 구현
