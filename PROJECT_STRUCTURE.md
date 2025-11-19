# 프로젝트 구조

```
portfolio-builder-chatgpt/
├── 📚 docs/                           # 문서
│   ├── CHATGPT_APPS_GUIDE.md          # Apps SDK & MCP 완전 가이드 (~1,000줄)
│   ├── PORTFOLIO_BUILDER_SPEC.md      # 개발 명세서 (~1,200줄)
│   └── GETTING_STARTED.md             # 빠른 시작 가이드
│
├── 💻 src/                            # 소스 코드
│   ├── portfolio-builder/             # 🎯 위젯 컴포넌트 (여기에 구현!)
│   │   ├── index.jsx                  # 엔트리 포인트
│   │   ├── portfolio-builder.jsx      # 메인 컴포넌트
│   │   └── portfolio-builder.css      # 스타일
│   │
│   ├── shared/                        # 공통 유틸리티
│   │   ├── types.ts                   # TypeScript 타입 정의
│   │   ├── use-widget-state.ts        # 상태 관리 훅
│   │   ├── use-widget-props.ts        # Props 훅
│   │   ├── use-openai-global.ts       # OpenAI 전역 객체 훅
│   │   ├── use-display-mode.ts        # 디스플레이 모드 훅
│   │   ├── use-max-height.ts          # 최대 높이 훅
│   │   └── media-queries.ts           # 미디어 쿼리 유틸
│   │
│   └── index.css                      # 전역 스타일 (Tailwind)
│
├── 🔧 mcp-server/                     # MCP 서버 (Node.js)
│   ├── src/
│   │   └── server.ts                  # MCP 서버 구현
│   ├── package.json                   # 서버 의존성
│   └── tsconfig.json                  # 서버 TS 설정
│
├── 📦 assets/                         # 빌드 결과물 (자동 생성)
│   ├── portfolio-builder-[hash].html  # 빌드된 HTML
│   ├── portfolio-builder-[hash].js    # 빌드된 JavaScript
│   ├── portfolio-builder-[hash].css   # 빌드된 CSS
│   └── portfolio-builder.html         # 최신 버전 심볼릭 링크
│
├── ⚙️ config/                         # 설정 파일 (선택 사항)
│
├── 🛠️ 빌드 & 설정 파일
│   ├── build-all.mts                  # Vite 빌드 오케스트레이터
│   ├── vite.config.mts                # Vite 설정
│   ├── package.json                   # 프로젝트 의존성
│   ├── tsconfig.json                  # TypeScript 루트 설정
│   ├── tsconfig.app.json              # 앱 TS 설정
│   ├── tsconfig.node.json             # Node.js TS 설정
│   ├── tailwind.config.ts             # Tailwind CSS 설정
│   └── .gitignore                     # Git 무시 파일
│
└── 📖 문서
    ├── README.md                      # 프로젝트 README
    └── PROJECT_STRUCTURE.md           # 이 파일
```

## 📁 주요 디렉토리 설명

### `docs/` - 문서
모든 프로젝트 문서가 위치합니다.

| 파일 | 용도 | 분량 |
|------|------|------|
| `CHATGPT_APPS_GUIDE.md` | Apps SDK & MCP 완전 가이드 | ~1,000줄 |
| `PORTFOLIO_BUILDER_SPEC.md` | 개발 상세 명세 (완전한 구현 코드 포함) | ~1,200줄 |
| `GETTING_STARTED.md` | 빠른 시작 가이드 (초보자용) | ~400줄 |

### `src/` - 소스 코드
위젯 및 공통 유틸리티 코드입니다.

**핵심 구현 위치**:
- `src/portfolio-builder/` ← **여기에 코드 작성!**

### `mcp-server/` - MCP 서버
ChatGPT와 위젯을 연결하는 백엔드 서버입니다.

**주요 파일**:
- `src/server.ts` - 툴 등록, 리소스 핸들러

### `assets/` - 빌드 결과물
`pnpm run build` 실행 시 자동 생성됩니다.

**빌드 결과**:
```
portfolio-builder-a3f2.html  (해시 버전)
portfolio-builder-a3f2.js
portfolio-builder-a3f2.css
portfolio-builder.html       (최신 버전 링크)
```

## 🔄 개발 워크플로우

```
1. src/portfolio-builder/ 에 코드 작성
   ↓
2. pnpm run build (빌드)
   ↓
3. assets/ 에 결과물 생성
   ↓
4. pnpm run serve (정적 파일 서버 시작, 4444 포트)
   ↓
5. cd mcp-server && pnpm start (MCP 서버 시작, 8000 포트)
   ↓
6. ngrok http 8000 (외부 노출)
   ↓
7. ChatGPT 커넥터 등록 및 테스트
```

## 📝 파일별 역할

### 위젯 파일
| 파일 | 역할 |
|------|------|
| `src/portfolio-builder/index.jsx` | React 엔트리 포인트 |
| `src/portfolio-builder/portfolio-builder.jsx` | 메인 UI 컴포넌트 |
| `src/portfolio-builder/portfolio-builder.css` | 위젯 전용 스타일 |

### 공통 유틸리티
| 파일 | 역할 |
|------|------|
| `src/shared/use-widget-state.ts` | ChatGPT 상태 동기화 훅 |
| `src/shared/use-widget-props.ts` | MCP 서버 데이터 수신 훅 |
| `src/shared/use-openai-global.ts` | OpenAI 전역 객체 접근 훅 |
| `src/shared/types.ts` | TypeScript 타입 정의 |

### 빌드 & 설정
| 파일 | 역할 |
|------|------|
| `build-all.mts` | Vite 빌드 오케스트레이터 |
| `package.json` | 프로젝트 의존성 및 스크립트 |
| `tsconfig.json` | TypeScript 설정 |
| `vite.config.mts` | Vite 빌드 도구 설정 |
| `tailwind.config.ts` | Tailwind CSS 설정 |

### MCP 서버
| 파일 | 역할 |
|------|------|
| `mcp-server/src/server.ts` | MCP 서버 메인 로직 |
| `mcp-server/package.json` | 서버 의존성 |

## 🎯 어디서 시작할까?

### 1️⃣ 문서 읽기 (순서대로)
1. `README.md` - 프로젝트 개요
2. `docs/GETTING_STARTED.md` - 빠른 시작
3. `docs/PORTFOLIO_BUILDER_SPEC.md` - 구현 코드
4. `docs/CHATGPT_APPS_GUIDE.md` - 심화 학습

### 2️⃣ 코드 작성
- `src/portfolio-builder/` 디렉토리에 위젯 구현
- `PORTFOLIO_BUILDER_SPEC.md`의 코드 참고

### 3️⃣ 서버 설정
- `mcp-server/src/server.ts`에 위젯 등록
- `build-all.mts`의 targets 배열에 추가

## 📊 파일 크기 참고

```
docs/CHATGPT_APPS_GUIDE.md      ~100 KB (1,000줄)
docs/PORTFOLIO_BUILDER_SPEC.md  ~120 KB (1,200줄)
docs/GETTING_STARTED.md         ~40 KB (400줄)
README.md                       ~25 KB (300줄)
PROJECT_STRUCTURE.md            ~10 KB (이 파일)
```

---

**업데이트**: 2025-01-19
