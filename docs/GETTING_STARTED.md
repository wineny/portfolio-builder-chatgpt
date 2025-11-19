# Getting Started - Portfolio Builder Widget

포트폴리오 빌더 위젯 개발을 시작하기 위한 빠른 가이드

---

## 📋 목차

1. [환경 설정](#1-환경-설정)
2. [프로젝트 구조 이해](#2-프로젝트-구조-이해)
3. [첫 번째 위젯 만들기](#3-첫-번째-위젯-만들기)
4. [로컬 테스트](#4-로컬-테스트)
5. [ChatGPT 연동](#5-chatgpt-연동)
6. [다음 단계](#6-다음-단계)

---

## 1. 환경 설정

### 1.1 필수 요구사항 확인

```bash
# Node.js 버전 확인 (18 이상 필요)
node -v

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 버전 확인
pnpm -v
```

### 1.2 프로젝트 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd portfolio-builder-chatgpt

# 의존성 설치 (루트)
pnpm install

# MCP 서버 의존성 설치
cd mcp-server
pnpm install
cd ..
```

### 1.3 Chrome 설정 (필수!)

**이 단계를 건너뛰면 위젯이 렌더링되지 않습니다!**

1. Chrome 브라우저 열기
2. 주소창에 `chrome://flags/` 입력
3. 검색창에 `local-network-access-check` 입력
4. **Disabled**로 설정
5. **Chrome 완전히 종료 후 재시작** (매우 중요!)

---

## 2. 프로젝트 구조 이해

```
portfolio-builder-chatgpt/
│
├── docs/                          # 📚 모든 문서가 여기에
│   ├── CHATGPT_APPS_GUIDE.md      # Apps SDK 완전 가이드
│   ├── PORTFOLIO_BUILDER_SPEC.md  # 개발 상세 명세
│   └── GETTING_STARTED.md         # 이 파일
│
├── src/                           # 위젯 소스 코드
│   ├── portfolio-builder/         # 여기에 코드 작성!
│   │   ├── index.jsx
│   │   ├── portfolio-builder.jsx
│   │   └── portfolio-builder.css
│   ├── shared/                    # 공통 유틸리티
│   └── index.css                  # 전역 스타일
│
├── mcp-server/                    # MCP 서버 (백엔드)
│   └── src/server.ts
│
└── assets/                        # 빌드 결과 (자동 생성)
```

### 핵심 파일 설명

| 파일 | 역할 |
|------|------|
| `src/portfolio-builder/portfolio-builder.jsx` | 위젯 UI 컴포넌트 (React) |
| `src/portfolio-builder/portfolio-builder.css` | 위젯 스타일 |
| `mcp-server/src/server.ts` | MCP 서버 (ChatGPT 연동) |
| `build-all.mts` | 빌드 스크립트 |
| `package.json` | 프로젝트 설정 |

---

## 3. 첫 번째 위젯 만들기

### 3.1 위젯 파일 생성

**Step 1**: `src/portfolio-builder/` 디렉토리 확인

```bash
ls -la src/portfolio-builder/
```

아직 파일이 없다면 다음 파일들을 생성하세요.

### 3.2 최소 위젯 코드

#### `src/portfolio-builder/index.jsx`

```jsx
import { createRoot } from "react-dom/client";
import App from "./portfolio-builder";

createRoot(document.getElementById("portfolio-builder-root")).render(<App />);

export { App };
export default App;
```

#### `src/portfolio-builder/portfolio-builder.jsx`

```jsx
import { useState } from "react";
import { useWidgetState } from "../shared/use-widget-state";
import "./portfolio-builder.css";

function PortfolioBuilder() {
  const [widgetState, setWidgetState] = useWidgetState({
    profile: { name: "", company: "" }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("제출:", widgetState.profile);
  };

  return (
    <div className="portfolio-container">
      <h1>포트폴리오 생성</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="이름"
          value={widgetState.profile.name}
          onChange={(e) => setWidgetState({
            ...widgetState,
            profile: { ...widgetState.profile, name: e.target.value }
          })}
        />
        <button type="submit">생성하기</button>
      </form>
    </div>
  );
}

export default PortfolioBuilder;
```

#### `src/portfolio-builder/portfolio-builder.css`

```css
.portfolio-container {
  padding: 2rem;
  max-width: 480px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
}

.portfolio-container h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.portfolio-container input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.portfolio-container button {
  width: 100%;
  padding: 0.75rem;
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
```

### 3.3 빌드 스크립트 수정

#### `build-all.mts` (일부 수정)

```typescript
// targets 배열 찾아서 추가
const targets: string[] = [
  "portfolio-builder"  // 이 줄 추가
];
```

### 3.4 빌드 실행

```bash
# 위젯 빌드
pnpm run build

# 빌드 결과 확인
ls -la assets/portfolio-builder*
```

**예상 결과**:
```
assets/portfolio-builder-[hash].html
assets/portfolio-builder-[hash].js
assets/portfolio-builder-[hash].css
assets/portfolio-builder.html  (심볼릭 링크)
```

---

## 4. 로컬 테스트

### 4.1 서버 시작 (2개 터미널 필요)

**터미널 1: 정적 파일 서버**
```bash
pnpm run serve

# 출력 예시:
# Serving ./assets on http://localhost:4444
```

**터미널 2: MCP 서버**
```bash
cd mcp-server
pnpm start

# 출력 예시:
# Pizzaz MCP server listening on http://localhost:8000
```

### 4.2 브라우저에서 확인

브라우저에서 다음 URL 열기:
```
http://localhost:4444/portfolio-builder.html
```

**예상 결과**:
- 흰색 배경의 위젯 표시
- "포트폴리오 생성" 제목
- 입력 필드 및 버튼

**문제 발생 시**:
- Chrome 플래그 비활성화 확인
- Chrome 재시작 확인
- 브라우저 콘솔 에러 확인 (F12)

---

## 5. ChatGPT 연동

### 5.1 MCP 서버에 위젯 등록

#### `mcp-server/src/server.ts` 수정

```typescript
// widgets 배열에 추가
const widgets: PizzazWidget[] = [
  // ... 기존 위젯들
  {
    id: "portfolio-builder",
    title: "Create Portfolio",
    templateUri: "ui://widget/portfolio-builder.html",
    invoking: "Building your portfolio...",
    invoked: "Portfolio created!",
    html: readWidgetHtml("portfolio-builder"),
    responseText: "Successfully created your portfolio!"
  }
];
```

### 5.2 ngrok으로 외부 노출

**터미널 3: ngrok**
```bash
ngrok http 8000

# 출력 예시:
# Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

**중요**: `https://abc123.ngrok-free.app` URL 복사

### 5.3 ChatGPT 커넥터 등록

1. **ChatGPT 열기** → Settings → Connectors
2. **Developer Mode 활성화**
3. **커넥터 추가**:
   - URL: `https://abc123.ngrok-free.app/mcp`
   - (ngrok URL + `/mcp`)
4. **저장**

### 5.4 ChatGPT에서 테스트

ChatGPT 대화창에서:
```
포트폴리오 만들어줘
```

**예상 동작**:
1. ChatGPT가 `portfolio-builder` 툴 실행
2. 위젯 팝업 표시
3. 이름, 회사명 입력 가능
4. "생성하기" 버튼 클릭 시 ChatGPT 응답

---

## 6. 다음 단계

### 6.1 문서 읽기

**필독 문서** (순서대로):
1. [**PORTFOLIO_BUILDER_SPEC.md**](./PORTFOLIO_BUILDER_SPEC.md)
   - 완전한 구현 코드 (복붙 가능)
   - UI/UX 디자인
   - 검증 로직

2. [**CHATGPT_APPS_GUIDE.md**](./CHATGPT_APPS_GUIDE.md)
   - Apps SDK 전체 가이드
   - React Hooks 활용법
   - 베스트 프랙티스

### 6.2 기능 추가

**간단한 개선 아이디어**:
- [ ] 회사명 필드 추가
- [ ] 입력 검증 (빈 값 체크)
- [ ] 에러 메시지 표시
- [ ] 다크 모드 지원
- [ ] 애니메이션 추가 (Framer Motion)

**Phase 2 준비**:
- [ ] 이력 블록 추가
- [ ] 프로젝트 블록 추가
- [ ] 템플릿 시스템

### 6.3 디버깅 팁

**브라우저 콘솔 확인**:
```javascript
// F12 → Console
console.log("Widget state:", window.openai.widgetState);
console.log("Tool output:", window.openai.toolOutput);
```

**MCP 서버 로그 확인**:
```typescript
// mcp-server/src/server.ts
console.log("Received tool call:", request.params.name);
console.log("Arguments:", request.params.arguments);
```

**자주 발생하는 문제**:
| 문제 | 해결 방법 |
|------|----------|
| 위젯이 안 보임 | Chrome 플래그 비활성화 + 재시작 |
| `window.openai` undefined | ngrok + ChatGPT 커넥터 필요 |
| 상태가 안 저장됨 | `useWidgetState` 사용 확인 |
| 빌드 실패 | `pnpm install` 다시 실행 |

---

## 7. 체크리스트

### 환경 설정
- [ ] Node.js 18+ 설치
- [ ] pnpm 설치
- [ ] 프로젝트 의존성 설치
- [ ] Chrome 플래그 비활성화
- [ ] Chrome 재시작

### 개발
- [ ] 위젯 파일 생성 (jsx, css)
- [ ] 빌드 스크립트 수정
- [ ] `pnpm run build` 성공

### 로컬 테스트
- [ ] 정적 파일 서버 시작 (4444)
- [ ] MCP 서버 시작 (8000)
- [ ] 브라우저에서 위젯 확인

### ChatGPT 연동
- [ ] MCP 서버에 위젯 등록
- [ ] ngrok 시작
- [ ] ChatGPT 커넥터 등록
- [ ] "포트폴리오 만들어줘" 테스트

---

## 8. 도움이 필요하신가요?

### 문서 위치
- **이 파일**: `docs/GETTING_STARTED.md`
- **상세 명세**: `docs/PORTFOLIO_BUILDER_SPEC.md`
- **완전 가이드**: `docs/CHATGPT_APPS_GUIDE.md`
- **README**: `README.md`

### 참고 코드
- **샘플 위젯**: 원본 프로젝트의 `src/pizzaz-shop/`, `src/todo/`
- **MCP 서버 예시**: `mcp-server/src/server.ts`

### 외부 자료
- [OpenAI Apps SDK Docs](https://developers.openai.com/apps-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [React Docs](https://react.dev/)

---

**Happy Coding! 🚀**
