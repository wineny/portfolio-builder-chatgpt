# ChatGPT Apps SDK & MCP 완전 가이드

OpenAI Apps SDK와 Model Context Protocol(MCP)을 활용한 ChatGPT 커스텀 위젯 개발 종합 가이드

**작성일**: 2025-01-19
**기준**: OpenAI Apps SDK Examples (MIT License, Copyright 2025 OpenAI)

---

## 📋 목차

1. [개요](#1-개요)
2. [MCP (Model Context Protocol) 아키텍처](#2-mcp-model-context-protocol-아키텍처)
3. [Apps SDK 핵심 개념](#3-apps-sdk-핵심-개념)
4. [위젯 시스템 작동 원리](#4-위젯-시스템-작동-원리)
5. [개발 환경 설정](#5-개발-환경-설정)
6. [위젯 개발 가이드](#6-위젯-개발-가이드)
7. [MCP 서버 개발 가이드](#7-mcp-서버-개발-가이드)
8. [빌드 및 배포](#8-빌드-및-배포)
9. [베스트 프랙티스](#9-베스트-프랙티스)

---

## 1. 개요

### 1.1 ChatGPT Apps SDK란?

ChatGPT Apps SDK는 ChatGPT 대화에 커스텀 UI 위젯과 도구를 통합할 수 있는 프레임워크입니다. 개발자는 React 기반 위젯을 만들고, MCP 서버를 통해 ChatGPT와 연동할 수 있습니다.

**주요 기능**:
- 🎨 **Rich UI Widgets**: React로 구현한 인터랙티브 UI 컴포넌트
- 🔧 **Tool Calling**: ChatGPT가 외부 도구를 호출하여 작업 수행
- 🔄 **State Management**: 위젯과 ChatGPT 간 상태 동기화
- 📦 **MCP Integration**: Model Context Protocol을 통한 표준화된 통신

### 1.2 MCP (Model Context Protocol)

MCP는 LLM 클라이언트와 외부 도구, 데이터, UI를 연결하는 오픈 스펙입니다.

**핵심 역할**:
- 서버, 모델, UI를 동기화
- 와이어 포맷, 인증, 메타데이터 표준화
- ChatGPT가 커스텀 앱을 내장 도구처럼 인식

---

## 2. MCP (Model Context Protocol) 아키텍처

### 2.1 MCP의 3가지 핵심 기능

#### 1) List Tools (도구 목록 제공)
서버가 지원하는 도구를 JSON Schema 계약과 함께 광고합니다.

```typescript
const tools: Tool[] = [
  {
    name: "pizza-shop",
    description: "Open Pizzaz Shop",
    inputSchema: {
      type: "object",
      properties: {
        pizzaTopping: {
          type: "string",
          description: "Topping to mention"
        }
      },
      required: ["pizzaTopping"]
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/pizza-shop.html",
      "openai/widgetAccessible": true
    }
  }
];
```

#### 2) Call Tools (도구 실행)
모델이 도구를 선택하면 `call_tool` 요청을 발행하고, 서버가 작업을 실행합니다.

```typescript
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const widget = widgetsById.get(request.params.name);
    const args = toolInputParser.parse(request.params.arguments);

    return {
      content: [{ type: "text", text: "Shop opened!" }],
      structuredContent: { pizzaTopping: args.pizzaTopping },
      _meta: widgetInvocationMeta(widget)
    };
  }
);
```

#### 3) Return Widgets (위젯 반환)
응답 메타데이터에 임베디드 리소스를 포함하여 Apps SDK가 인라인 렌더링합니다.

```typescript
{
  contents: [{
    uri: "ui://widget/pizza-shop.html",
    mimeType: "text/html+skybridge",
    text: widgetHtml,
    _meta: {
      "openai/outputTemplate": "ui://widget/pizza-shop.html",
      "openai/toolInvocation/invoking": "Opening the shop",
      "openai/toolInvocation/invoked": "Shop opened"
    }
  }]
}
```

### 2.2 MCP 서버 구조

```
MCP Server (Node.js)
├── HTTP/SSE Transport
├── Tool Handlers
├── Resource Handlers
└── Widget HTML Provider
```

**핵심 컴포넌트**:
- **Server**: `@modelcontextprotocol/sdk/server`
- **Transport**: SSE (Server-Sent Events) 또는 Streaming HTTP
- **Handlers**: ListTools, CallTool, ListResources, ReadResource

---

## 3. Apps SDK 핵심 개념

### 3.1 전역 객체: `window.openai`

ChatGPT 웹 샌드박스가 위젯에 주입하는 전역 API 객체입니다.

```typescript
interface OpenAiGlobals {
  // 시각적 요소
  theme: "light" | "dark";
  locale: string;

  // 레이아웃
  maxHeight: number;
  displayMode: "pip" | "inline" | "fullscreen";
  safeArea: SafeArea;

  // 상태
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown> | null;
  widgetState: Record<string, unknown> | null;
  setWidgetState: (state: any) => Promise<void>;

  // API
  callTool: (name: string, args: Record<string, unknown>) => Promise<any>;
  sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;
  requestDisplayMode: (args: { mode: DisplayMode }) => Promise<any>;
}
```

### 3.2 Display Modes (표시 모드)

| 모드 | 설명 | 사용 예시 |
|------|------|----------|
| `pip` | Picture-in-Picture, 작은 플로팅 창 | 간단한 정보 표시 |
| `inline` | 대화 내 인라인 표시 | 기본 위젯 |
| `fullscreen` | 전체 화면 모드 | 복잡한 데이터 시각화 |

**모바일**: PiP는 자동으로 fullscreen으로 변환됩니다.

```typescript
// 전체화면 요청
await window.openai.requestDisplayMode({ mode: "fullscreen" });
```

### 3.3 Theme & Accessibility

```typescript
const theme = window.openai.theme; // "light" | "dark"
const locale = window.openai.locale; // "ko-KR", "en-US", etc.
```

다크 모드 대응:
```css
:root[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}
```

---

## 4. 위젯 시스템 작동 원리

### 4.1 위젯 라이프사이클

```
1. 사용자 요청 (예: "포트폴리오 만들어줘")
   ↓
2. ChatGPT가 적절한 툴 선택 (tool calling)
   ↓
3. MCP 서버에 call_tool 요청
   ↓
4. 서버가 위젯 HTML + 메타데이터 반환
   ↓
5. ChatGPT가 위젯을 샌드박스 iframe에 렌더링
   ↓
6. 위젯과 ChatGPT 간 상태 동기화 (window.openai.setWidgetState)
   ↓
7. 사용자 인터랙션 → 상태 업데이트 → ChatGPT 응답
```

### 4.2 위젯 HTML 구조

MCP 서버가 반환하는 HTML:
```html
<!doctype html>
<html>
<head>
  <script type="module" src="http://localhost:4444/portfolio-builder.js"></script>
  <link rel="stylesheet" href="http://localhost:4444/portfolio-builder.css">
</head>
<body>
  <div id="portfolio-builder-root"></div>
</body>
</html>
```

**중요**:
- `mimeType: "text/html+skybridge"` 필수
- 샌드박스 환경에서 실행
- CORS 활성화된 정적 서버 필요

### 4.3 상태 관리 흐름

```
React Component State
       ↕
useWidgetState Hook
       ↕
window.openai.widgetState
       ↕
ChatGPT Backend
```

---

## 5. 개발 환경 설정

### 5.1 필수 요구사항

- **Node.js**: 18+
- **pnpm**: 권장 (또는 npm/yarn)
- **Python**: 3.10+ (Python MCP 서버 사용 시)

### 5.2 프로젝트 구조

```
openai-apps-sdk-examples/
├── src/                          # 위젯 소스 코드
│   ├── index.css                 # 전역 스타일
│   ├── types.ts                  # TypeScript 타입 정의
│   ├── use-widget-state.ts       # 상태 관리 훅
│   ├── use-widget-props.ts       # Props 훅
│   ├── use-openai-global.ts      # OpenAI 전역 객체 훅
│   └── [widget-name]/            # 위젯 디렉토리
│       ├── index.jsx             # 엔트리 포인트
│       ├── [widget-name].jsx     # 메인 컴포넌트
│       └── [widget-name].css     # 위젯 스타일
├── assets/                       # 빌드 결과물
│   ├── [widget-name]-[hash].html
│   ├── [widget-name]-[hash].js
│   └── [widget-name]-[hash].css
├── pizzaz_server_node/           # MCP 서버 (Node.js)
│   └── src/
│       └── server.ts
├── build-all.mts                 # Vite 빌드 오케스트레이터
├── package.json
└── README.md
```

### 5.3 초기 설정

```bash
# 저장소 클론
git clone https://github.com/openai/openai-apps-sdk-examples.git
cd openai-apps-sdk-examples

# 의존성 설치
pnpm install
pre-commit install

# 위젯 빌드
pnpm run build

# 정적 파일 서버 시작 (포트 4444)
pnpm run serve

# MCP 서버 시작 (포트 8000)
cd pizzaz_server_node
pnpm start
```

### 5.4 Chrome 설정 (필수)

Chrome 142 버전 이상에서는 로컬 네트워크 접근 플래그 비활성화 필요:

1. `chrome://flags/` 이동
2. `#local-network-access-check` 검색
3. **Disabled**로 설정
4. **Chrome 재시작** (매우 중요!)

---

## 6. 위젯 개발 가이드

### 6.1 기본 위젯 구조

**디렉토리 구조**:
```
src/my-widget/
├── index.jsx       # 엔트리 포인트
├── my-widget.jsx   # 메인 컴포넌트
└── my-widget.css   # 스타일
```

**index.jsx**:
```jsx
import { createRoot } from "react-dom/client";
import App from "./my-widget";

createRoot(document.getElementById("my-widget-root")).render(<App />);

export { App };
export default App;
```

### 6.2 React Hooks 활용

#### `useWidgetState` - 상태 관리

ChatGPT와 동기화되는 상태를 관리합니다.

```jsx
import { useWidgetState } from "../use-widget-state";

function MyWidget() {
  const [widgetState, setWidgetState] = useWidgetState({
    name: "",
    email: ""
  });

  const handleChange = (field, value) => {
    setWidgetState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <input
      value={widgetState.name}
      onChange={(e) => handleChange("name", e.target.value)}
    />
  );
}
```

**동작 원리**:
1. `setWidgetState` 호출 시 `window.openai.setWidgetState`로 전달
2. ChatGPT 백엔드에 상태 저장
3. 다음 렌더링 시 `window.openai.widgetState`에서 복원

#### `useWidgetProps` - 서버 데이터 수신

MCP 서버가 반환한 `toolOutput` 데이터를 수신합니다.

```jsx
import { useWidgetProps } from "../use-widget-props";

function MyWidget() {
  const props = useWidgetProps({
    items: [],
    userId: null
  });

  return (
    <div>
      <p>User ID: {props.userId}</p>
      {props.items.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

#### `useOpenAiGlobal` - OpenAI 전역 객체 접근

```jsx
import { useOpenAiGlobal } from "../use-openai-global";

function MyWidget() {
  const theme = useOpenAiGlobal("theme");
  const maxHeight = useOpenAiGlobal("maxHeight");
  const displayMode = useOpenAiGlobal("displayMode");

  return (
    <div
      className={theme === "dark" ? "dark-theme" : "light-theme"}
      style={{ maxHeight }}
    >
      {displayMode === "fullscreen" && <FullScreenView />}
    </div>
  );
}
```

### 6.3 스타일링 (Tailwind CSS)

**글로벌 스타일** (`src/index.css`):
```css
@import "tailwindcss";

:root {
  --color-primary: #0f766e;
  --color-bg: #ffffff;
  --color-text: #000000;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin: 0;
  padding: 0;
}
```

**위젯별 스타일**:
```css
/* src/my-widget/my-widget.css */
.my-widget-container {
  @apply rounded-lg border border-gray-200 p-4;
}

.my-widget-button {
  @apply bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700;
}
```

**Tailwind 클래스 사용**:
```jsx
<div className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-lg">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Click Me
  </button>
</div>
```

### 6.4 모달 및 고급 UI

**모달 요청**:
```jsx
const openModal = async () => {
  await window.openai.requestModal({
    title: "Checkout",
    params: { state: "checkout", items: cartItems },
    anchor: { top: 100, left: 200, width: 300, height: 50 }
  });
};
```

**전체화면 전환**:
```jsx
const goFullscreen = async () => {
  const result = await window.openai.requestDisplayMode({ mode: "fullscreen" });
  console.log("Granted mode:", result.mode);
};
```

### 6.5 애니메이션 (Framer Motion)

```jsx
import { motion, AnimatePresence } from "framer-motion";

function AnimatedList({ items }) {
  return (
    <AnimatePresence>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {item.name}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

---

## 7. MCP 서버 개발 가이드

### 7.1 서버 초기화

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new Server(
  {
    name: "my-app-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      resources: {},  // 위젯 HTML 리소스 제공
      tools: {}       // 도구 목록 제공
    }
  }
);
```

### 7.2 위젯 등록

```typescript
type MyWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;   // 실행 중 메시지
  invoked: string;    // 완료 메시지
  html: string;       // 위젯 HTML
  responseText: string;
};

const widgets: MyWidget[] = [
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

### 7.3 위젯 메타데이터

```typescript
function widgetDescriptorMeta(widget: MyWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  } as const;
}
```

**메타데이터 필드 설명**:
- `openai/outputTemplate`: 위젯 HTML 리소스 URI
- `openai/toolInvocation/invoking`: 도구 실행 중 표시 메시지
- `openai/toolInvocation/invoked`: 도구 실행 완료 메시지
- `openai/widgetAccessible`: 위젯 접근 가능 여부
- `openai/resultCanProduceWidget`: 위젯 생성 가능 여부

### 7.4 도구 스키마 정의

```typescript
const toolInputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "User's full name"
    },
    company: {
      type: "string",
      description: "Company name"
    }
  },
  required: ["name", "company"],
  additionalProperties: false
} as const;

// Zod 파서 (타입 안전성)
const toolInputParser = z.object({
  name: z.string(),
  company: z.string()
});
```

### 7.5 도구 핸들러 구현

```typescript
import {
  CallToolRequestSchema,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const widget = widgetsById.get(request.params.name);

    if (!widget) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    // 입력 검증
    const args = toolInputParser.parse(request.params.arguments ?? {});

    return {
      content: [
        {
          type: "text",
          text: `Created portfolio for ${args.name} at ${args.company}!`
        }
      ],
      structuredContent: {
        name: args.name,
        company: args.company,
        createdAt: new Date().toISOString()
      },
      _meta: {
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked
      }
    };
  }
);
```

### 7.6 리소스 핸들러 (위젯 HTML 제공)

```typescript
import {
  ReadResourceRequestSchema,
  type ReadResourceRequest
} from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request: ReadResourceRequest) => {
    const widget = widgetsByUri.get(request.params.uri);

    if (!widget) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }

    return {
      contents: [
        {
          uri: widget.templateUri,
          mimeType: "text/html+skybridge",
          text: widget.html,
          _meta: widgetDescriptorMeta(widget)
        }
      ]
    };
  }
);
```

### 7.7 SSE Transport 설정

```typescript
import { createServer } from "node:http";

const ssePath = "/mcp";
const postPath = "/mcp/messages";
const port = 8000;

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS 헤더
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  // SSE 스트림
  if (req.method === "GET" && url.pathname === ssePath) {
    const transport = new SSEServerTransport(postPath, res);
    await server.connect(transport);
    return;
  }

  // 메시지 수신
  if (req.method === "POST" && url.pathname === postPath) {
    const sessionId = url.searchParams.get("sessionId");
    const session = sessions.get(sessionId);
    await session.transport.handlePostMessage(req, res);
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`MCP server listening on http://localhost:${port}`);
});
```

---

## 8. 빌드 및 배포

### 8.1 빌드 시스템

**build-all.mts** 스크립트:
```typescript
// 빌드할 위젯 목록
const targets = [
  "todo",
  "portfolio-builder",  // 새 위젯 추가
  "pizzaz-shop"
];

// 자동으로 src/**/index.{tsx,jsx} 탐색
const entries = fg.sync("src/**/index.{tsx,jsx}");

// Vite로 각 위젯 빌드
for (const file of entries) {
  const name = path.basename(path.dirname(file));
  await build({
    plugins: [tailwindcss(), react()],
    build: {
      outDir: "assets",
      rollupOptions: {
        input: virtualId,
        output: {
          entryFileNames: `${name}.js`,
          assetFileNames: `${name}.css`
        }
      }
    }
  });
}

// 해시 버전 생성
const hash = crypto.createHash("sha256")
  .update(pkg.version)
  .digest("hex")
  .slice(0, 4);

// portfolio-builder.js → portfolio-builder-a3f2.js
// portfolio-builder.html 생성
```

### 8.2 로컬 테스트

**1단계: 빌드**
```bash
pnpm run build
```

**2단계: 정적 파일 서버 시작**
```bash
pnpm run serve
# http://localhost:4444에서 assets/ 제공
```

**3단계: MCP 서버 시작**
```bash
cd pizzaz_server_node
pnpm start
# http://localhost:8000/mcp에서 MCP 엔드포인트 제공
```

**4단계: ngrok으로 외부 노출**
```bash
ngrok http 8000
# https://<random>.ngrok-free.app
```

**5단계: ChatGPT 커넥터 등록**
1. ChatGPT 설정 → Connectors
2. Developer Mode 활성화
3. 커넥터 추가: `https://<random>.ngrok-free.app/mcp`

**6단계: ChatGPT에서 테스트**
```
사용자: "포트폴리오 만들어줘"
ChatGPT: [portfolio-builder 위젯 렌더링]
```

### 8.3 프로덕션 배포

**환경 변수**:
```bash
BASE_URL=https://your-cdn.com
PORT=8000
```

**배포 체크리스트**:
- [ ] `pnpm run build` 성공
- [ ] assets/ 폴더를 CDN/정적 호스팅에 업로드
- [ ] MCP 서버를 클라우드에 배포 (AWS, GCP, Azure 등)
- [ ] HTTPS 활성화 (필수)
- [ ] CORS 헤더 설정
- [ ] 환경 변수에 `BASE_URL` 설정

**추천 플랫폼**:
- **정적 파일**: Cloudflare Pages, Vercel, Netlify
- **MCP 서버**: AWS Lambda, Google Cloud Run, Railway

---

## 9. 베스트 프랙티스

### 9.1 성능 최적화

**1) 코드 분할 방지**
```typescript
// build-all.mts
rollupOptions: {
  output: {
    inlineDynamicImports: true  // 단일 JS 파일로 번들
  }
}
```

**2) CSS 인라인**
```typescript
build: {
  cssCodeSplit: false  // 단일 CSS 파일
}
```

**3) 이미지 최적화**
- WebP 포맷 사용
- CDN에서 제공
- Lazy loading 적용

### 9.2 상태 관리 패턴

**Bad**:
```jsx
// ❌ 로컬 상태만 사용 (ChatGPT와 동기화 안 됨)
const [name, setName] = useState("");
```

**Good**:
```jsx
// ✅ useWidgetState로 ChatGPT와 동기화
const [widgetState, setWidgetState] = useWidgetState({ name: "" });
```

### 9.3 에러 처리

```jsx
function MyWidget() {
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      await window.openai.callTool("my-tool", { data: "..." });
    } catch (err) {
      setError(err.message);
      console.error("Tool call failed:", err);
    }
  };

  return error ? <ErrorView message={error} /> : <MainView />;
}
```

### 9.4 보안 고려사항

**1) 입력 검증**
```typescript
// MCP 서버에서 Zod로 검증
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150)
});

const args = schema.parse(request.params.arguments);
```

**2) XSS 방지**
```jsx
// ❌ dangerouslySetInnerHTML 사용 금지
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ React의 자동 이스케이프 사용
<div>{userInput}</div>
```

**3) CORS 제한**
```typescript
// 프로덕션에서는 특정 origin만 허용
res.setHeader("Access-Control-Allow-Origin", "https://chat.openai.com");
```

### 9.5 접근성 (A11y)

```jsx
<button
  type="button"
  aria-label="Add to cart"
  aria-pressed={isSelected}
  onClick={handleClick}
>
  <ShoppingCart aria-hidden="true" />
</button>

<input
  type="text"
  aria-describedby="name-hint"
  aria-required="true"
/>
<span id="name-hint">Enter your full name</span>
```

### 9.6 다국어 지원

```jsx
import { useOpenAiGlobal } from "../use-openai-global";

function MyWidget() {
  const locale = useOpenAiGlobal("locale");

  const messages = {
    "en-US": { submit: "Submit" },
    "ko-KR": { submit: "제출" },
    "ja-JP": { submit: "送信" }
  };

  const t = messages[locale] || messages["en-US"];

  return <button>{t.submit}</button>;
}
```

### 9.7 디버깅 팁

**1) 개발자 도구 활용**
```jsx
useEffect(() => {
  console.log("Widget state:", window.openai.widgetState);
  console.log("Tool output:", window.openai.toolOutput);
  console.log("Display mode:", window.openai.displayMode);
}, []);
```

**2) MCP Inspector 사용**
```bash
# MCP 서버 테스트
npx @modelcontextprotocol/inspector http://localhost:8000/mcp
```

**3) 네트워크 로그**
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log("Received tool call:", request.params.name);
  console.log("Arguments:", request.params.arguments);
  // ...
});
```

---

## 10. 참고 자료

- **공식 문서**: [OpenAI Apps SDK Docs](https://developers.openai.com/apps-sdk)
- **GitHub 저장소**: [openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples)
- **MCP 스펙**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **React 문서**: [React Official Docs](https://react.dev/)
- **Tailwind CSS**: [Tailwind Docs](https://tailwindcss.com/docs)

---

## 11. 자주 묻는 질문 (FAQ)

**Q: 위젯이 렌더링되지 않습니다.**
- Chrome 플래그 비활성화 확인 (`#local-network-access-check`)
- Chrome 재시작 여부 확인
- 정적 파일 서버 (4444 포트) 실행 확인
- MCP 서버 (8000 포트) 실행 확인
- 브라우저 콘솔 에러 확인

**Q: `window.openai`가 undefined입니다.**
- ChatGPT 웹 샌드박스에서만 사용 가능
- 로컬 브라우저에서 직접 HTML 열면 작동 안 함
- ngrok + ChatGPT 커넥터를 통해 테스트 필요

**Q: 상태가 저장되지 않습니다.**
- `useWidgetState` 사용 확인
- `window.openai.setWidgetState` 호출 확인
- MCP 서버 응답에 `_meta` 포함 확인

**Q: Python MCP 서버 vs Node.js 서버?**
- Node.js: TypeScript 타입 안전성, 빠른 개발
- Python: 데이터 과학, ML 모델 통합 시 유리
- 둘 다 동일한 MCP 스펙 구현

---

**문서 버전**: 1.0
**최종 수정**: 2025-01-19
**라이선스**: MIT (OpenAI Apps SDK Examples 기반)
