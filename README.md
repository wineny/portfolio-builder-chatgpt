# ChatGPT Portfolio Builder Widget

ChatGPT 대화 중 포트폴리오를 생성할 수 있는 인터랙티브 위젯

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![OpenAI Apps SDK](https://img.shields.io/badge/OpenAI-Apps%20SDK-orange)

---

## 📖 프로젝트 개요

ChatGPT와 대화하다가 **"포트폴리오 만들어줘"**라고 하면 간단한 위젯으로 정보를 입력받아 포트폴리오를 생성하는 서비스입니다.

### 핵심 기능 (Phase 1 - MVP)

- ✅ 기본 프로필 입력 (이름, 회사명)
- ✅ 간단한 폼 UI
- ✅ ChatGPT와 실시간 데이터 동기화
- ✅ AI 기반 포트폴리오 텍스트 자동 생성

### 사용 예시

```
[ChatGPT 대화 중]

사용자: "포트폴리오 만들어줘"

ChatGPT: "포트폴리오를 만들어드리겠습니다! 기본 정보를 입력해주세요."
         [Portfolio Builder 위젯 팝업]

사용자: 이름: 김철수
        회사명: 테크 스타트업
        [생성하기 클릭]

ChatGPT: "김철수님의 포트폴리오가 생성되었습니다!

         ## 김철수 | 테크 스타트업

         안녕하세요, 저는 테크 스타트업에서 근무하는 김철수입니다.
         ..."
```

---

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js**: 18 이상
- **pnpm**: 10.13.1 이상 (권장)
- **Chrome**: 142 이상 (로컬 네트워크 플래그 비활성화 필요)

### 설치

```bash
# 1. 저장소 클론 (또는 현재 디렉토리 사용)
cd portfolio-builder-chatgpt

# 2. 의존성 설치
pnpm install

# 3. 위젯 빌드
pnpm run build

# 4. 정적 파일 서버 시작 (터미널 1)
pnpm run serve
# http://localhost:4444

# 5. MCP 서버 시작 (터미널 2)
cd mcp-server
pnpm start
# http://localhost:8000
```

### Chrome 설정 (필수!)

1. `chrome://flags/` 이동
2. `#local-network-access-check` 검색
3. **Disabled**로 설정
4. **Chrome 재시작** (매우 중요!)

### ChatGPT 연동

```bash
# ngrok으로 로컬 서버 외부 노출
ngrok http 8000
# https://<random>.ngrok-free.app
```

**ChatGPT 설정**:
1. ChatGPT → Settings → Connectors
2. Developer Mode 활성화
3. 커넥터 추가: `https://<random>.ngrok-free.app/mcp`

**중요 사항**:
- ngrok 무료 플랜은 재시작 시 URL이 변경됩니다
- URL 변경 시 ChatGPT 커넥터를 새로운 URL로 재등록해야 합니다
- CORS 이슈 해결을 위해 CSS/JS는 HTML에 인라인으로 포함됩니다

---

## 📂 프로젝트 구조

```
portfolio-builder-chatgpt/
├── docs/                              # 📚 문서
│   ├── CHATGPT_APPS_GUIDE.md          # Apps SDK & MCP 완전 가이드
│   └── PORTFOLIO_BUILDER_SPEC.md      # 개발 명세서
│
├── src/                               # 소스 코드
│   ├── portfolio-builder/             # 위젯 컴포넌트
│   │   ├── index.jsx                  # 엔트리 포인트
│   │   ├── portfolio-builder.jsx      # 메인 컴포넌트
│   │   └── portfolio-builder.css      # 스타일
│   ├── shared/                        # 공통 유틸리티
│   │   ├── types.ts                   # TypeScript 타입
│   │   ├── use-widget-state.ts        # 상태 관리 훅
│   │   ├── use-widget-props.ts        # Props 훅
│   │   └── use-openai-global.ts       # OpenAI 전역 객체 훅
│   └── index.css                      # 전역 스타일
│
├── assets/                            # 빌드 결과물
│   ├── portfolio-builder-[hash].html
│   ├── portfolio-builder-[hash].js
│   └── portfolio-builder-[hash].css
│
├── mcp-server/                        # MCP 서버 (Node.js)
│   └── src/
│       └── server.ts                  # MCP 서버 구현
│
├── config/                            # 설정 파일
├── build-all.mts                      # Vite 빌드 스크립트
├── package.json                       # 프로젝트 의존성
├── tsconfig.json                      # TypeScript 설정
├── vite.config.mts                    # Vite 설정
└── README.md                          # 이 파일
```

---

## 🛠️ 개발 가이드

### 위젯 개발

자세한 내용은 [**docs/PORTFOLIO_BUILDER_SPEC.md**](./docs/PORTFOLIO_BUILDER_SPEC.md)를 참고하세요.

**주요 단계**:
1. `src/portfolio-builder/` 디렉토리에 React 컴포넌트 작성
2. `useWidgetState`로 ChatGPT와 상태 동기화
3. Tailwind CSS로 스타일링
4. `pnpm run build`로 빌드

**예시 코드**:
```jsx
import { useWidgetState } from "../shared/use-widget-state";

function PortfolioBuilder() {
  const [widgetState, setWidgetState] = useWidgetState({
    profile: { name: "", company: "" }
  });

  return (
    <input
      value={widgetState.profile.name}
      onChange={(e) => setWidgetState({
        ...widgetState,
        profile: { ...widgetState.profile, name: e.target.value }
      })}
    />
  );
}
```

### MCP 서버 개발

자세한 내용은 [**docs/CHATGPT_APPS_GUIDE.md**](./docs/CHATGPT_APPS_GUIDE.md)를 참고하세요.

**주요 단계**:
1. `mcp-server/src/server.ts`에 위젯 등록
2. 툴 스키마 정의 (Zod)
3. CallTool 핸들러 구현
4. 위젯 HTML 리소스 제공

---

## 📚 문서

| 문서 | 설명 |
|------|------|
| [**CHATGPT_APPS_GUIDE.md**](./docs/CHATGPT_APPS_GUIDE.md) | OpenAI Apps SDK와 MCP의 모든 것 (1,000줄) |
| [**PORTFOLIO_BUILDER_SPEC.md**](./docs/PORTFOLIO_BUILDER_SPEC.md) | 포트폴리오 빌더 상세 명세 (1,200줄) |

### 주요 내용

**CHATGPT_APPS_GUIDE.md**:
- MCP 아키텍처 및 3가지 핵심 기능
- `window.openai` 전역 객체 API
- React Hooks 활용법
- 빌드 및 배포 가이드
- 베스트 프랙티스 (성능, 보안, 접근성)

**PORTFOLIO_BUILDER_SPEC.md**:
- Phase 1 MVP 명세 (이름, 회사명)
- 완전한 구현 코드 (복붙 가능)
- UI/UX 와이어프레임
- Step-by-step 구현 가이드
- Phase 2 확장 계획 (블록 시스템, 템플릿)

---

## 🧪 테스트

### 로컬 테스트

```bash
# 1. 빌드 확인
pnpm run build
ls -la assets/portfolio-builder-*

# 2. 서버 시작
pnpm run serve  # 터미널 1
cd mcp-server && pnpm start  # 터미널 2

# 3. 브라우저 확인
# http://localhost:4444/portfolio-builder.html
```

### ChatGPT 통합 테스트

1. ngrok 시작: `ngrok http 8000`
2. ChatGPT 커넥터에 ngrok URL 등록
3. ChatGPT에서 테스트: "포트폴리오 만들어줘"

**예상 결과**:
- ✅ 위젯 팝업 표시
- ✅ 이름, 회사명 입력 가능
- ✅ 생성 버튼 클릭 시 ChatGPT 응답
- ✅ 상태가 ChatGPT에 저장됨

---

## 🗺️ 로드맵

### Phase 1: MVP ✅ 완료

- [x] 기본 프로필 입력 (이름, 회사명)
- [x] 간단한 폼 UI
- [x] ChatGPT 통합
- [x] **구현 완료 및 테스트 성공** (2025-01-19)

### Phase 2: 블록 시스템 (다음 단계)

- [ ] 이력 블록 (Experience)
- [ ] 프로젝트 블록 (Projects)
- [ ] 기술 스택 블록 (Skills)
- [ ] 학력 블록 (Education)
- [ ] 동적 블록 추가/삭제

### Phase 3: 고급 기능 (향후)

- [ ] 템플릿 시스템 (미니멀, 전문가, 크리에이티브)
- [ ] 내보내기 (Markdown, PDF, HTML, JSON)
- [ ] 저장 및 불러오기 (로컬 스토리지, 클라우드)
- [ ] AI 기능 강화 (자동 완성, 스마트 추천)

---

## 🤝 기여

이 프로젝트는 학습 및 실험 목적으로 만들어졌습니다.

**기여 방법**:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 라이선스

MIT License

**기반 프로젝트**: [openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples) (MIT License, Copyright 2025 OpenAI)

---

## 🔗 참고 자료

- [OpenAI Apps SDK Docs](https://developers.openai.com/apps-sdk)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [React Official Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ❓ FAQ

**Q: 위젯이 렌더링되지 않습니다.**
- Chrome 플래그 비활성화 확인 (`#local-network-access-check`)
- **Chrome 재시작** 필수!
- 정적 파일 서버 (4444 포트) 실행 확인
- MCP 서버 (8000 포트) 실행 확인

**Q: `window.openai`가 undefined입니다.**
- ChatGPT 웹 샌드박스에서만 사용 가능
- 로컬 브라우저에서 직접 HTML 열면 작동 안 함
- ngrok + ChatGPT 커넥터를 통해 테스트 필요

**Q: 상태가 저장되지 않습니다.**
- `useWidgetState` 사용 확인
- `window.openai.setWidgetState` 호출 확인
- MCP 서버 응답에 `_meta` 포함 확인

---

## 📧 문의

프로젝트 관련 문의나 버그 리포트는 Issues에 등록해주세요.

---

**Made with ❤️ using OpenAI Apps SDK**
