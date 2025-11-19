# Portfolio Builder Widget - 개발 명세서

ChatGPT 대화 중 포트폴리오를 생성할 수 있는 인터랙티브 위젯 개발 명세

**프로젝트명**: ChatGPT Portfolio Builder Widget
**버전**: 1.0 (MVP)
**작성일**: 2025-01-19

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [Phase 1: MVP 명세](#2-phase-1-mvp-명세)
3. [기술 아키텍처](#3-기술-아키텍처)
4. [UI/UX 설계](#4-uiux-설계)
5. [구현 가이드](#5-구현-가이드)
6. [테스트 시나리오](#6-테스트-시나리오)
7. [Phase 2: 확장 계획](#7-phase-2-확장-계획)

---

## 1. 프로젝트 개요

### 1.1 목적

ChatGPT와 대화하다가 "포트폴리오 만들어줘"라고 하면 간단한 위젯으로 정보를 입력받아 포트폴리오를 생성하는 서비스

### 1.2 핵심 가치

- **간편성**: 복잡한 에디터 없이 ChatGPT 대화 중 즉시 생성
- **단계적 접근**: 최소 기능으로 시작 → 점진적 확장
- **AI 통합**: 입력 데이터를 ChatGPT가 자연스러운 포트폴리오 텍스트로 변환

### 1.3 사용자 시나리오

```
[ChatGPT 대화 중]

사용자: "포트폴리오 만들어줘"

ChatGPT: "포트폴리오를 만들어드리겠습니다! 기본 정보를 입력해주세요."
         [Portfolio Builder 위젯 팝업]

사용자: [위젯에서 입력]
        이름: 김철수
        회사명: 테크 스타트업

        [생성하기 클릭]

ChatGPT: "김철수님의 포트폴리오가 생성되었습니다!

         ## 김철수 | 테크 스타트업

         안녕하세요, 저는 테크 스타트업에서 근무하는 김철수입니다.

         [추가 정보를 원하시면 '이력 추가해줘'라고 말씀해주세요!]"
```

---

## 2. Phase 1: MVP 명세

### 2.1 기능 범위

**포함**:
- ✅ 기본 프로필 입력 (이름, 회사명)
- ✅ 간단한 폼 UI
- ✅ ChatGPT로 데이터 전달
- ✅ 포트폴리오 텍스트 자동 생성

**제외** (Phase 2로 연기):
- ❌ 이력, 프로젝트 등 추가 블록
- ❌ 템플릿 선택
- ❌ PDF/Markdown 내보내기
- ❌ 저장 및 불러오기

### 2.2 데이터 구조

```typescript
// Phase 1 - 최소 데이터 모델
interface PortfolioProfile {
  name: string;        // 이름 (필수)
  company: string;     // 회사명 (필수)
}

interface PortfolioWidgetState {
  profile: PortfolioProfile;
  createdAt?: string;
}

interface PortfolioWidgetProps {
  profile?: PortfolioProfile;
  widgetState?: PortfolioWidgetState;
}
```

### 2.3 사용자 인터페이스

**입력 필드**:
1. **이름** (`name`)
   - 타입: 텍스트
   - 필수: 예
   - 최대 길이: 50자
   - 플레이스홀더: "홍길동"

2. **회사명** (`company`)
   - 타입: 텍스트
   - 필수: 예
   - 최대 길이: 100자
   - 플레이스홀더: "회사명 또는 소속"

**버튼**:
- **생성하기**: 데이터 제출 (primary action)
- **취소**: 위젯 닫기 (secondary action)

### 2.4 검증 규칙

```typescript
const validateProfile = (profile: PortfolioProfile): string | null => {
  if (!profile.name || profile.name.trim().length === 0) {
    return "이름을 입력해주세요.";
  }

  if (profile.name.length > 50) {
    return "이름은 50자 이내로 입력해주세요.";
  }

  if (!profile.company || profile.company.trim().length === 0) {
    return "회사명을 입력해주세요.";
  }

  if (profile.company.length > 100) {
    return "회사명은 100자 이내로 입력해주세요.";
  }

  return null; // 검증 통과
};
```

---

## 3. 기술 아키텍처

### 3.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                     ChatGPT Interface                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Tool Call: "portfolio-builder"
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP Server (Node.js, Port 8000)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tool Handler: portfolio-builder                      │   │
│  │  - Input: { name, company }                          │   │
│  │  - Output: structuredContent + widget HTML           │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Widget HTML + Metadata
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        Static File Server (Port 4444, CORS enabled)         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ assets/                                              │   │
│  │  ├── portfolio-builder-[hash].html                  │   │
│  │  ├── portfolio-builder-[hash].js                    │   │
│  │  └── portfolio-builder-[hash].css                   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Load Widget
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          ChatGPT Web Sandbox (Sandboxed iframe)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ React Widget: PortfolioBuilderWidget                 │   │
│  │  - User Input (name, company)                        │   │
│  │  - State Sync via window.openai.setWidgetState      │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Submit Data
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  ChatGPT Backend                             │
│  - Receive: { name: "김철수", company: "테크 스타트업" }     │
│  - Generate: AI-powered portfolio text                       │
│  - Display: Formatted portfolio in chat                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 기술 스택

| 레이어 | 기술 | 버전 | 용도 |
|--------|------|------|------|
| **프론트엔드** | React | 19.1.1 | UI 컴포넌트 |
| | TypeScript | 5.9.2 | 타입 안전성 |
| | Tailwind CSS | 4.1.11 | 스타일링 |
| | Framer Motion | 12.23.12 | 애니메이션 |
| **백엔드** | Node.js | 18+ | MCP 서버 |
| | @modelcontextprotocol/sdk | latest | MCP 프로토콜 |
| | Zod | 4.1.5 | 입력 검증 |
| **빌드** | Vite | 7.1.1 | 번들링 |
| | pnpm | 10.13.1 | 패키지 관리 |
| **배포** | ngrok | - | 로컬 개발 외부 노출 |

### 3.3 파일 구조

```
openai-apps-sdk-examples/
├── src/
│   ├── portfolio-builder/              # 새로 생성
│   │   ├── index.jsx                   # 엔트리 포인트
│   │   ├── portfolio-builder.jsx       # 메인 컴포넌트
│   │   └── portfolio-builder.css       # 스타일
│   ├── types.ts                        # 공통 타입 (기존)
│   ├── use-widget-state.ts             # 상태 훅 (기존)
│   └── use-widget-props.ts             # Props 훅 (기존)
├── assets/                             # 빌드 결과
│   ├── portfolio-builder-[hash].html
│   ├── portfolio-builder-[hash].js
│   └── portfolio-builder-[hash].css
├── pizzaz_server_node/
│   └── src/
│       └── server.ts                   # MCP 서버 (수정)
└── build-all.mts                       # 빌드 스크립트 (수정)
```

---

## 4. UI/UX 설계

### 4.1 와이어프레임

#### 기본 상태 (Inline Mode)
```
┌─────────────────────────────────────────────┐
│  📝 포트폴리오 생성                          │
├─────────────────────────────────────────────┤
│                                             │
│  👤 이름                                     │
│  ┌───────────────────────────────────────┐ │
│  │ 홍길동                                 │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  🏢 회사명                                   │
│  ┌───────────────────────────────────────┐ │
│  │ 회사명 또는 소속                        │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌─────────┐  ┌─────────────────────────┐ │
│  │  취소   │  │      생성하기 →          │ │
│  └─────────┘  └─────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

#### 입력 중 상태
```
┌─────────────────────────────────────────────┐
│  📝 포트폴리오 생성                          │
├─────────────────────────────────────────────┤
│                                             │
│  👤 이름 *                                   │
│  ┌───────────────────────────────────────┐ │
│  │ 김철수│                                │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  🏢 회사명 *                                 │
│  ┌───────────────────────────────────────┐ │
│  │ 테크 스타트업│                          │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌─────────┐  ┌─────────────────────────┐ │
│  │  취소   │  │      생성하기 →          │ │
│  └─────────┘  └─────────────────────────┘ │
│  (흐림)        (활성화, 파란색)            │
└─────────────────────────────────────────────┘
```

#### 에러 상태
```
┌─────────────────────────────────────────────┐
│  📝 포트폴리오 생성                          │
├─────────────────────────────────────────────┤
│                                             │
│  👤 이름 *                                   │
│  ┌───────────────────────────────────────┐ │
│  │                                        │ │
│  └───────────────────────────────────────┘ │
│  ⚠️ 이름을 입력해주세요.                     │
│                                             │
│  🏢 회사명 *                                 │
│  ┌───────────────────────────────────────┐ │
│  │ 테크 스타트업                           │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌─────────┐  ┌─────────────────────────┐ │
│  │  취소   │  │      생성하기 →          │ │
│  └─────────┘  └─────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 컬러 팔레트

```css
:root {
  /* Primary Colors */
  --color-primary: #0f766e;        /* Teal 700 - 메인 액션 */
  --color-primary-hover: #0d9488;  /* Teal 600 */

  /* Neutral Colors */
  --color-bg: #ffffff;
  --color-text: #1f2937;           /* Gray 800 */
  --color-text-secondary: #6b7280; /* Gray 500 */
  --color-border: #e5e7eb;         /* Gray 200 */

  /* Status Colors */
  --color-error: #dc2626;          /* Red 600 */
  --color-success: #059669;        /* Green 600 */

  /* Dark Mode */
  --color-dark-bg: #1f2937;
  --color-dark-text: #f9fafb;
}
```

### 4.3 타이포그래피

```css
.portfolio-title {
  font-size: 1.5rem;      /* 24px */
  font-weight: 600;
  line-height: 2rem;
}

.portfolio-label {
  font-size: 0.875rem;    /* 14px */
  font-weight: 500;
  line-height: 1.25rem;
}

.portfolio-input {
  font-size: 1rem;        /* 16px */
  line-height: 1.5rem;
}

.portfolio-error {
  font-size: 0.75rem;     /* 12px */
  line-height: 1rem;
}
```

### 4.4 반응형 디자인

```css
/* Mobile First */
.portfolio-container {
  padding: 1rem;          /* 16px */
  max-width: 100%;
}

/* Tablet (640px+) */
@media (min-width: 640px) {
  .portfolio-container {
    padding: 1.5rem;      /* 24px */
    max-width: 480px;
    margin: 0 auto;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .portfolio-container {
    padding: 2rem;        /* 32px */
    max-width: 560px;
  }
}
```

### 4.5 접근성 (Accessibility)

- **키보드 네비게이션**: Tab으로 이동, Enter로 제출
- **스크린 리더**: aria-label, aria-describedby 적용
- **WCAG 2.1 AA**: 색상 대비율 4.5:1 이상
- **포커스 표시**: 명확한 focus ring

---

## 5. 구현 가이드

### 5.1 Step 1: 위젯 파일 생성

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
import { useWidgetState } from "../use-widget-state";
import { useWidgetProps } from "../use-widget-props";
import "./portfolio-builder.css";

function PortfolioBuilder() {
  // ChatGPT와 동기화되는 상태
  const [widgetState, setWidgetState] = useWidgetState({
    profile: { name: "", company: "" },
    createdAt: null
  });

  // MCP 서버에서 전달받은 초기 데이터
  const props = useWidgetProps({});

  // 로컬 에러 상태
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setError(null); // 에러 초기화
    setWidgetState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const { name, company } = widgetState.profile;

    if (!name || name.trim().length === 0) {
      return "이름을 입력해주세요.";
    }
    if (name.length > 50) {
      return "이름은 50자 이내로 입력해주세요.";
    }
    if (!company || company.trim().length === 0) {
      return "회사명을 입력해주세요.";
    }
    if (company.length > 100) {
      return "회사명은 100자 이내로 입력해주세요.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 검증
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // 상태 저장 (ChatGPT 백엔드로 전달)
    setWidgetState({
      ...widgetState,
      createdAt: new Date().toISOString()
    });

    // ChatGPT에게 후속 메시지 전송 (선택 사항)
    try {
      await window.openai.sendFollowUpMessage({
        prompt: `다음 정보로 포트폴리오를 생성해주세요:\n이름: ${widgetState.profile.name}\n회사: ${widgetState.profile.company}`
      });
    } catch (err) {
      console.error("Failed to send follow-up message:", err);
    }
  };

  const handleCancel = () => {
    // 위젯 닫기 (모달인 경우) 또는 상태 초기화
    setWidgetState({
      profile: { name: "", company: "" },
      createdAt: null
    });
    setError(null);
  };

  const { name, company } = widgetState.profile;
  const isFormValid = name.trim() && company.trim();

  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <h1 className="portfolio-title">📝 포트폴리오 생성</h1>
      </header>

      <form onSubmit={handleSubmit} className="portfolio-form">
        {/* 이름 입력 */}
        <div className="portfolio-field">
          <label htmlFor="name" className="portfolio-label">
            👤 이름 <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="portfolio-input"
            placeholder="홍길동"
            value={name}
            onChange={(e) => handleChange("name", e.target.value)}
            aria-required="true"
            aria-describedby={error && !name ? "name-error" : undefined}
            maxLength={50}
          />
          {error && !name && (
            <p id="name-error" className="portfolio-error" role="alert">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* 회사명 입력 */}
        <div className="portfolio-field">
          <label htmlFor="company" className="portfolio-label">
            🏢 회사명 <span className="required">*</span>
          </label>
          <input
            id="company"
            type="text"
            className="portfolio-input"
            placeholder="회사명 또는 소속"
            value={company}
            onChange={(e) => handleChange("company", e.target.value)}
            aria-required="true"
            aria-describedby={error && !company ? "company-error" : undefined}
            maxLength={100}
          />
          {error && !company && (
            <p id="company-error" className="portfolio-error" role="alert">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="portfolio-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="portfolio-button portfolio-button-secondary"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className="portfolio-button portfolio-button-primary"
          >
            생성하기 →
          </button>
        </div>
      </form>
    </div>
  );
}

export default PortfolioBuilder;
```

#### `src/portfolio-builder/portfolio-builder.css`
```css
/* Container */
.portfolio-container {
  padding: 1.5rem;
  max-width: 480px;
  margin: 0 auto;
  background: var(--color-bg, #ffffff);
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Header */
.portfolio-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.portfolio-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #1f2937);
  margin: 0;
}

/* Form */
.portfolio-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Field */
.portfolio-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.portfolio-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #1f2937);
}

.portfolio-label .required {
  color: var(--color-error, #dc2626);
}

/* Input */
.portfolio-input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  background: #ffffff;
  transition: all 0.2s;
}

.portfolio-input:focus {
  outline: none;
  border-color: var(--color-primary, #0f766e);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
}

.portfolio-input::placeholder {
  color: var(--color-text-secondary, #6b7280);
}

/* Error */
.portfolio-error {
  font-size: 0.75rem;
  color: var(--color-error, #dc2626);
  margin: 0;
}

/* Actions */
.portfolio-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Button */
.portfolio-button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.portfolio-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.portfolio-button-primary {
  background: var(--color-primary, #0f766e);
  color: #ffffff;
}

.portfolio-button-primary:hover:not(:disabled) {
  background: var(--color-primary-hover, #0d9488);
}

.portfolio-button-secondary {
  background: var(--color-border, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.portfolio-button-secondary:hover {
  background: #d1d5db;
}

/* Responsive */
@media (max-width: 640px) {
  .portfolio-container {
    padding: 1rem;
  }

  .portfolio-actions {
    flex-direction: column;
  }
}
```

### 5.2 Step 2: MCP 서버 수정

#### `pizzaz_server_node/src/server.ts` (일부 수정)

```typescript
// 기존 코드에 추가

const widgets: PizzazWidget[] = [
  // ... 기존 위젯들
  {
    id: "portfolio-builder",
    title: "Create Portfolio",
    templateUri: "ui://widget/portfolio-builder.html",
    invoking: "Building your portfolio...",
    invoked: "Portfolio created!",
    html: readWidgetHtml("portfolio-builder"),
    responseText: "Successfully created your portfolio profile!"
  }
];

// 툴 입력 스키마 정의
const portfolioInputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "User's full name"
    },
    company: {
      type: "string",
      description: "Company name or affiliation"
    }
  },
  required: ["name", "company"],
  additionalProperties: false
} as const;

const portfolioInputParser = z.object({
  name: z.string().max(50),
  company: z.string().max(100)
});

// 도구 목록에 추가
const tools: Tool[] = widgets.map((widget) => {
  const inputSchema = widget.id === "portfolio-builder"
    ? portfolioInputSchema
    : toolInputSchema;

  return {
    name: widget.id,
    description: widget.title,
    inputSchema,
    title: widget.title,
    _meta: widgetDescriptorMeta(widget),
    annotations: {
      destructiveHint: false,
      openWorldHint: false,
      readOnlyHint: true
    }
  };
});

// 툴 호출 핸들러 수정
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const widget = widgetsById.get(request.params.name);

    if (!widget) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    // portfolio-builder 전용 로직
    if (widget.id === "portfolio-builder") {
      const args = portfolioInputParser.parse(request.params.arguments ?? {});

      return {
        content: [
          {
            type: "text",
            text: `Created portfolio for ${args.name} at ${args.company}!`
          }
        ],
        structuredContent: {
          profile: {
            name: args.name,
            company: args.company
          },
          createdAt: new Date().toISOString()
        },
        _meta: widgetInvocationMeta(widget)
      };
    }

    // 기존 위젯 로직
    const args = toolInputParser.parse(request.params.arguments ?? {});
    return {
      content: [{ type: "text", text: widget.responseText }],
      structuredContent: { pizzaTopping: args.pizzaTopping },
      _meta: widgetInvocationMeta(widget)
    };
  }
);
```

### 5.3 Step 3: 빌드 스크립트 수정

#### `build-all.mts` (일부 수정)

```typescript
// targets 배열에 추가
const targets: string[] = [
  "todo",
  "solar-system",
  "pizzaz",
  "pizzaz-carousel",
  "pizzaz-list",
  "pizzaz-albums",
  "pizzaz-shop",
  "portfolio-builder"  // 추가
];
```

### 5.4 Step 4: 빌드 및 실행

```bash
# 1. 위젯 빌드
pnpm run build

# 2. 정적 파일 서버 시작 (터미널 1)
pnpm run serve

# 3. MCP 서버 시작 (터미널 2)
cd pizzaz_server_node
pnpm start

# 4. ngrok으로 외부 노출 (터미널 3)
ngrok http 8000
```

---

## 6. 테스트 시나리오

### 6.1 기본 플로우 테스트

**시나리오 1: 정상 생성**
```
준비:
- ChatGPT 커넥터에 ngrok URL 등록
- MCP 서버 및 정적 파일 서버 실행

단계:
1. ChatGPT에서 "포트폴리오 만들어줘" 입력
2. portfolio-builder 위젯 팝업 확인
3. 이름: "김철수" 입력
4. 회사명: "테크 스타트업" 입력
5. "생성하기" 버튼 클릭

예상 결과:
- ChatGPT가 "김철수님의 포트폴리오가 생성되었습니다!" 응답
- 자연스러운 포트폴리오 텍스트 생성
- 위젯 상태가 ChatGPT에 저장됨
```

**시나리오 2: 검증 에러**
```
단계:
1. 위젯 팝업
2. 이름: (빈 값)
3. 회사명: "테크 스타트업" 입력
4. "생성하기" 버튼 클릭

예상 결과:
- "⚠️ 이름을 입력해주세요." 에러 메시지 표시
- 폼 제출되지 않음
```

**시나리오 3: 길이 제한**
```
단계:
1. 위젯 팝업
2. 이름: "가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하" (50자 초과)
3. "생성하기" 버튼 클릭

예상 결과:
- "⚠️ 이름은 50자 이내로 입력해주세요." 에러 메시지
```

### 6.2 접근성 테스트

```
키보드 테스트:
1. Tab 키로 "이름" 필드 포커스
2. Tab 키로 "회사명" 필드 포커스
3. Tab 키로 "취소" 버튼 포커스
4. Tab 키로 "생성하기" 버튼 포커스
5. Enter 키로 폼 제출

스크린 리더 테스트:
- 각 필드의 label이 올바르게 읽히는지 확인
- 에러 메시지가 aria-describedby로 연결되는지 확인
- 필수 필드가 aria-required로 표시되는지 확인
```

### 6.3 반응형 테스트

```
디바이스:
- Mobile (375px): 세로 레이아웃
- Tablet (768px): 중앙 정렬, 고정 너비
- Desktop (1440px): 중앙 정렬, 최대 너비 560px

확인 사항:
- 모든 해상도에서 폼이 깨지지 않음
- 터치 타겟 크기 충분 (최소 44x44px)
- 버튼이 적절한 크기로 표시됨
```

---

## 7. Phase 2: 확장 계획

### 7.1 블록 시스템

**목표**: 사용자가 원하는 섹션을 동적으로 추가

```typescript
// Phase 2 데이터 구조
interface PortfolioBlock {
  id: string;
  type: "profile" | "experience" | "project" | "skill" | "education";
  data: any;
  order: number;
}

interface PortfolioData {
  blocks: PortfolioBlock[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

// 블록 타입별 데이터 구조
interface ExperienceBlock {
  type: "experience";
  data: {
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;  // null = 현재 근무 중
    description: string;
  };
}

interface ProjectBlock {
  type: "project";
  data: {
    name: string;
    role: string;
    duration: string;
    description: string;
    technologies: string[];
  };
}
```

**사용자 인터랙션**:
```
사용자: "이력 블록 추가해줘"
ChatGPT: [Experience 입력 폼 표시]

사용자: "프로젝트 3개 추가해줘"
ChatGPT: [Project 입력 폼 3개 표시]
```

### 7.2 템플릿 시스템

**기본 템플릿**:
- 미니멀 (Minimal)
- 전문가 (Professional)
- 크리에이티브 (Creative)

**사용자 인터랙션**:
```
사용자: "전문가 템플릿으로 포트폴리오 만들어줘"
ChatGPT: [Professional 스타일 위젯 표시]
```

### 7.3 내보내기 기능

**지원 포맷**:
- Markdown (.md)
- PDF (.pdf)
- HTML (.html)
- JSON (.json)

**구현**:
```jsx
const handleExport = async (format) => {
  const data = await window.openai.callTool("export-portfolio", {
    portfolioData: widgetState,
    format
  });

  // 다운로드 트리거
  const blob = new Blob([data.content], { type: data.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-${Date.now()}.${format}`;
  a.click();
};
```

### 7.4 저장 및 불러오기

**로컬 스토리지**:
```typescript
// 저장
const savePortfolio = () => {
  localStorage.setItem("portfolio", JSON.stringify(widgetState));
};

// 불러오기
const loadPortfolio = () => {
  const saved = localStorage.getItem("portfolio");
  if (saved) {
    setWidgetState(JSON.parse(saved));
  }
};
```

**클라우드 저장** (향후):
- ChatGPT 백엔드에 영구 저장
- 여러 기기에서 동기화
- 버전 관리

### 7.5 AI 기능 강화

**자동 완성**:
```
사용자: [회사명만 입력]
ChatGPT: "이 회사에 대한 추가 정보를 입력하시겠어요?
          - 업종: IT/스타트업
          - 규모: 50-100명
          자동으로 채울까요?"
```

**스마트 추천**:
```
ChatGPT: "개발자 포트폴리오라면 '기술 스택' 블록을 추가하는 걸 추천드려요!"
```

**자연어 입력**:
```
사용자: "2020년부터 2023년까지 ABC 회사에서 시니어 개발자로 일했어"
ChatGPT: [자동으로 Experience 블록 생성 및 파싱]
```

---

## 8. 참고 자료

- **베이스 위젯**: [pizzaz-shop/index.tsx](./src/pizzaz-shop/index.tsx)
- **간단한 폼**: [todo/todo.jsx](./src/todo/todo.jsx)
- **MCP 서버**: [pizzaz_server_node/src/server.ts](./pizzaz_server_node/src/server.ts)
- **빌드 스크립트**: [build-all.mts](./build-all.mts)

---

## 9. 체크리스트

### Phase 1 구현 체크리스트

**위젯 개발**:
- [ ] `src/portfolio-builder/` 디렉토리 생성
- [ ] `index.jsx` 작성
- [ ] `portfolio-builder.jsx` 메인 컴포넌트 작성
- [ ] `portfolio-builder.css` 스타일 작성
- [ ] 입력 검증 로직 구현
- [ ] 에러 핸들링 구현
- [ ] 접근성 속성 추가 (aria-*)

**MCP 서버**:
- [ ] `server.ts`에 portfolio-builder 위젯 추가
- [ ] 입력 스키마 정의 (name, company)
- [ ] Zod 파서 작성
- [ ] CallTool 핸들러 구현
- [ ] ReadResource 핸들러 업데이트

**빌드 및 배포**:
- [ ] `build-all.mts`에 targets 추가
- [ ] `pnpm run build` 성공
- [ ] `assets/` 폴더에 파일 생성 확인
- [ ] `pnpm run serve` 시작 (4444 포트)
- [ ] MCP 서버 시작 (8000 포트)
- [ ] ngrok으로 외부 노출
- [ ] ChatGPT 커넥터 등록

**테스트**:
- [ ] 정상 생성 플로우
- [ ] 검증 에러 처리
- [ ] 길이 제한 확인
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 호환
- [ ] 반응형 디자인 (모바일/태블릿/데스크탑)
- [ ] 다크 모드 (선택 사항)

---

**문서 버전**: 1.0
**최종 수정**: 2025-01-19
**다음 단계**: Phase 1 MVP 구현 시작
