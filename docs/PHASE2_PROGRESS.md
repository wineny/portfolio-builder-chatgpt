# Phase 2 진행 상황 - 블록 시스템 구현

> Phase 2 작업 내역 및 진행 상황을 기록합니다.
> 시작일: 2025-01-19 (저녁)
> 진행 중

---

## 📋 Phase 2 목표

기본 프로필(이름, 회사명)에서 확장하여 **동적 블록 시스템** 구현

### 구현할 블록 타입

1. **이력 블록 (Experience)**: 회사명, 직책, 기간, 주요 업무
2. **프로젝트 블록 (Projects)**: 프로젝트명, 설명, 기간, 기술 스택, 링크
3. **기술 스택 블록 (Skills)**: 카테고리별 기술 스택 (Frontend, Backend, DevOps 등)
4. **학력 블록 (Education)**: 학교명, 전공, 기간, 학위

---

## ✅ 완료된 작업 (2025-01-19)

### 1. GitHub Pages 방식 전환 ✅

**문제**: CSS/JS 인라인 방식으로 HTML 크기가 200KB로 비대함

**해결**: 친구 팁 - GitHub Pages에서 CSS/JS 호스팅

**변경 사항**:
- **파일**: `mcp-server/src/server.ts`
- **함수**: `readWidgetHtml()`

```typescript
// 이전: CSS/JS 인라인
const cssContent = fs.readFileSync(path.join(ASSETS_DIR, cssFile), "utf8");
const jsContent = fs.readFileSync(path.join(ASSETS_DIR, jsFile), "utf8");
return `<html><head><style>${cssContent}</style></head>...`;

// 이후: GitHub Pages URL 참조
const GITHUB_PAGES_BASE = "https://wineny.github.io/portfolio-builder-chatgpt/assets";
return `<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline' ${GITHUB_PAGES_BASE}; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${GITHUB_PAGES_BASE};" />
  <link rel="stylesheet" href="${GITHUB_PAGES_BASE}/${cssFile}" crossorigin="anonymous" />
</head>
<body>
  <div id="${componentName}-root"></div>
  <script type="module" src="${GITHUB_PAGES_BASE}/${jsFile}" crossorigin="anonymous"></script>
</body>
</html>`;
```

**widgetCSP 설정 업데이트**:
```typescript
// mcp-server/src/server.ts - widgetDescriptorMeta()
"openai/widgetCSP": {
  connect_domains: ["https://wineny.github.io"],
  resource_domains: ["https://wineny.github.io"],
}
```

**효과**:
- HTML 크기: 200KB → ~1KB (99% 감소)
- 브라우저 캐싱 활성화
- 개발 속도 향상 (CSS/JS만 수정 가능)
- GitHub Pages 배포: https://wineny.github.io/portfolio-builder-chatgpt/assets/

---

### 2. 상태 구조 확장 ✅

**파일**: `src/shared/portfolio-types.ts` (신규 생성)

**타입 정의**:

```typescript
/** 기본 프로필 정보 (Phase 1) */
export interface Profile {
  name: string;
  company: string;
}

/** 이력 블록 */
export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string; // 예: "2020.03 - 2023.12" 또는 "2020.03 - 현재"
  duties: string; // 주요 업무 (줄바꿈은 \n으로 구분)
}

/** 프로젝트 블록 */
export interface Project {
  id: string;
  name: string;
  description: string;
  period: string;
  techStack: string[]; // 기술 스택 배열
  link?: string; // 선택적 프로젝트 링크
}

/** 기술 스택 카테고리 */
export type SkillCategory = "frontend" | "backend" | "devops" | "database" | "tools" | "etc";

/** 기술 스택 블록 */
export interface Skills {
  [category: string]: string[]; // 카테고리별 기술 스택
}

/** 학력 블록 */
export interface Education {
  id: string;
  school: string;
  major: string;
  period: string;
  degree: string; // 예: "학사", "석사", "박사"
}

/** 전체 포트폴리오 상태 (Widget State) */
export interface PortfolioState {
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
  skills: Skills;
  education: Education[];
}

/** 초기 상태 */
export const initialPortfolioState: PortfolioState = {
  profile: {
    name: "",
    company: "",
  },
  experiences: [],
  projects: [],
  skills: {
    frontend: [],
    backend: [],
    devops: [],
    database: [],
    tools: [],
    etc: [],
  },
  education: [],
};

/** 블록 추가/삭제를 위한 유틸리티 함수 타입 */
export type AddBlockFn<T> = (block: Omit<T, "id">) => void;
export type RemoveBlockFn = (id: string) => void;
export type UpdateBlockFn<T> = (id: string, updates: Partial<T>) => void;
```

**메인 컴포넌트 업데이트**:
```typescript
// src/portfolio-builder/portfolio-builder.jsx
import { initialPortfolioState } from "../shared/portfolio-types";

function PortfolioBuilder() {
  const [widgetState, setWidgetState] = useWidgetState(initialPortfolioState);
  // ...
}
```

---

### 3. ngrok 유료 플랜 설정 ✅

**authtoken 설정**:
```bash
ngrok config add-authtoken 2jB5tnqWgsm2EHICvqVQC4xXRcV_3HT8LrWqb2DkzPBREMuQv
```

**ngrok 터널 시작**:
```bash
ngrok http 8000
```

**결과**:
- URL: `https://herta-unionistic-devona.ngrok-free.dev`
- 고정 도메인 (재시작해도 동일)
- 빠른 속도 및 안정성

**ChatGPT 연동**:
- ChatGPT → Settings → Connectors
- 커넥터 URL: `https://herta-unionistic-devona.ngrok-free.dev/mcp`

---

### 4. Git 커밋 및 푸시 ✅

**커밋 메시지**:
```
feat: Phase 2 시작 - GitHub Pages 방식 전환 및 타입 정의

주요 변경사항:
- MCP 서버를 GitHub Pages 방식으로 전환
  - CSS/JS 인라인 → GitHub Pages URL 참조
  - HTML 크기 200KB → ~1KB로 대폭 감소
  - 브라우저 캐싱 활성화 및 개발 속도 향상

- Portfolio 타입 정의 추가 (src/shared/portfolio-types.ts)
  - Experience, Project, Skills, Education 인터페이스 정의
  - PortfolioState 전체 상태 구조 정의
  - 블록 추가/삭제 유틸리티 타입 정의

기술적 변경:
- mcp-server/src/server.ts:
  - readWidgetHtml() 함수 GitHub Pages URL 사용
  - CSP 정책에 GitHub Pages 도메인 추가
  - widgetCSP 설정 업데이트

- src/portfolio-builder/portfolio-builder.jsx:
  - initialPortfolioState 사용으로 상태 구조 확장

다음 단계:
- 이력/프로젝트/기술스택/학력 블록 UI 컴포넌트 구현
- 블록 추가/삭제 로직 구현
- 통합 테스트
```

**커밋 해시**: `b57f113`
**푸시**: `origin/main`

---

## 🔄 남은 작업

### Step 3: 이력 블록 UI 컴포넌트 구현 (ExperienceBlock)
- [ ] ExperienceBlock.jsx 컴포넌트 생성
- [ ] 회사명, 직책, 기간, 주요 업무 입력 필드
- [ ] 유효성 검증 로직
- [ ] 스타일링 (Tailwind CSS)

### Step 4: 프로젝트 블록 UI 컴포넌트 구현 (ProjectBlock)
- [ ] ProjectBlock.jsx 컴포넌트 생성
- [ ] 프로젝트명, 설명, 기간, 기술 스택, 링크 입력 필드
- [ ] 기술 스택 다중 선택 UI
- [ ] 유효성 검증 로직
- [ ] 스타일링

### Step 5: 기술 스택 블록 UI 컴포넌트 구현 (SkillsBlock)
- [ ] SkillsBlock.jsx 컴포넌트 생성
- [ ] 카테고리별 기술 스택 입력 UI
- [ ] 카테고리 추가/삭제 기능
- [ ] 스타일링

### Step 6: 학력 블록 UI 컴포넌트 구현 (EducationBlock)
- [ ] EducationBlock.jsx 컴포넌트 생성
- [ ] 학교명, 전공, 기간, 학위 입력 필드
- [ ] 유효성 검증 로직
- [ ] 스타일링

### Step 7: 블록 추가/삭제 로직 구현
- [ ] 각 블록 타입별 "추가" 버튼 구현
- [ ] 블록 삭제 버튼 구현
- [ ] 상태 업데이트 및 ChatGPT 동기화
- [ ] UUID 생성 (블록 ID)

### Step 8: 통합 테스트
- [ ] 로컬 브라우저 테스트
- [ ] ChatGPT 통합 테스트
- [ ] 각 블록 추가/삭제/수정 동작 확인
- [ ] 상태 동기화 확인

### Step 9: 문서 업데이트
- [ ] README.md Phase 2 완료 상태 업데이트
- [ ] DEVELOPMENT.md Phase 2 내용 추가
- [ ] PHASE_HISTORY.md Phase 2 상세 기록

---

## 📊 개발 통계

### 소요 시간 (예상)
- **Step 1**: GitHub Pages 전환 (1시간) ✅
- **Step 2**: 타입 정의 (30분) ✅
- **Step 3-6**: 블록 UI 컴포넌트 (4-5시간) 🔄
- **Step 7**: 블록 추가/삭제 로직 (2시간)
- **Step 8**: 통합 테스트 (1-2시간)
- **Step 9**: 문서 업데이트 (30분)

**총 예상 시간**: 9-11시간
**현재 진행**: 1.5시간 (약 15%)

---

## 🔗 관련 링크

- **GitHub 리포지토리**: https://github.com/wineny/portfolio-builder-chatgpt
- **GitHub Pages (assets)**: https://wineny.github.io/portfolio-builder-chatgpt/assets/
- **ngrok 터널**: https://herta-unionistic-devona.ngrok-free.dev
- **MCP 엔드포인트**: https://herta-unionistic-devona.ngrok-free.dev/mcp

---

## 📝 다음 세션 작업 계획

1. **이력 블록 컴포넌트 구현 시작**
   - ExperienceBlock.jsx 생성
   - 기본 UI 구조 및 입력 필드
   - 유효성 검증

2. **메인 컴포넌트 확장**
   - 블록 섹션 추가
   - 블록 목록 렌더링
   - 블록 추가 버튼

3. **빌드 및 테스트**
   - pnpm run build
   - 로컬 브라우저 확인
   - ChatGPT 통합 테스트

---

**작성일**: 2025-01-19
**작성자**: wine_ny + Claude Code
**다음 업데이트**: 2025-01-20 (예정)
