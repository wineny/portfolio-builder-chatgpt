# Portfolio Builder ChatGPT - 개발 로그

**프로젝트**: ChatGPT Portfolio Builder Widget
**시작일**: 2025-11-19

---

## 📋 Stage 1: 환경 설정 및 프로젝트 구조 생성 (완료)

### ✅ 완료된 작업

1. **프로젝트 구조 생성**
   - `src/portfolio-builder/` 디렉토리 생성
   - 3개 파일 작성:
     - `index.jsx` - React 엔트리 포인트
     - `portfolio-builder.jsx` - 메인 컴포넌트
     - `portfolio-builder.css` - 기본 스타일

2. **빌드 설정**
   - `build-all.mts`의 targets 배열에 "portfolio-builder" 추가
   - 빌드 성공: `pnpm run build`
   - 생성된 파일:
     - `assets/portfolio-builder-9252.html`
     - `assets/portfolio-builder-9252.js` (193KB)
     - `assets/portfolio-builder-9252.css` (5KB)

3. **로컬 개발 환경 구축**
   - Python HTTP 서버 사용 (포트 4444)
   - 테스트 페이지 작성 (`assets/test.html`)
   - 위젯 렌더링 확인 완료

---

## 🐛 발생한 이슈 및 해결 방법

### Issue #1: `window.openai.setWidgetState` undefined 에러

**증상**:
```
Cannot read properties of undefined (reading 'setWidgetState')
at use-widget-state.ts:42
```

**원인**:
- `window.openai` 객체는 ChatGPT 샌드박스 환경에서만 존재
- 로컬 브라우저에서 테스트 시 `window.openai`가 undefined

**해결**:
[src/shared/use-widget-state.ts](../src/shared/use-widget-state.ts:35-42) 수정
```typescript
// Before
if (newState != null) {
  window.openai.setWidgetState(newState);
}

// After (옵셔널 체이닝 추가)
if (newState != null && window.openai?.setWidgetState) {
  window.openai.setWidgetState(newState);
}
```

**재발 방지**:
- ✅ 모든 `window.openai` 접근 시 옵셔널 체이닝 사용 (`?.`)
- ✅ ChatGPT 환경 외부에서도 위젯이 렌더링되도록 안전 가드 추가

---

### Issue #2: `widgetState.profile` null 접근 에러

**증상**:
```
Cannot read properties of null (reading 'profile')
at portfolio-builder.jsx:22
```

**원인**:
- `useWidgetState`가 `null`을 반환할 수 있음
- `widgetState.profile`에 바로 접근하면 에러 발생

**해결**:
[src/portfolio-builder/portfolio-builder.jsx](../src/portfolio-builder/portfolio-builder.jsx:16) 수정
```jsx
// Before
value={widgetState.profile.name}

// After (기본값 추가)
const profile = widgetState?.profile || { name: "", company: "" };
value={profile.name}
```

**재발 방지**:
- ✅ `widgetState` 사용 시 항상 옵셔널 체이닝 또는 기본값 사용
- ✅ null 안전성을 고려한 코드 작성

---

### Issue #3: `serve` 패키지의 SPA 모드 리다이렉트 문제

**증상**:
```
HTTP 301 Moved Permanently
Location: /portfolio-builder-9252
(확장자 없는 URL로 리다이렉트 → 404 에러)
```

**원인**:
- `pnpm run serve`가 `-s` 플래그(SPA 모드)로 실행
- SPA 모드는 `.html` 확장자를 자동으로 제거하여 리다이렉트
- 제거된 URL에 해당하는 파일이 없어 404 발생

**시도한 해결책**:
1. ❌ `package.json`에서 `-s` 플래그 제거 → 이미 실행 중인 프로세스에 영향 없음
2. ❌ `npx serve` 직접 실행 → 여전히 301 리다이렉트 발생

**최종 해결**:
Python HTTP 서버 사용
```bash
cd assets
python3 -m http.server 4444
```

**재발 방지**:
- ✅ `package.json` serve 스크립트 수정 완료:
  ```json
  "serve": "serve ./assets -p 4444 --cors"  // -s 플래그 제거
  ```
- ✅ 개발 시 Python HTTP 서버 사용 권장
- ✅ 프로덕션에서는 MCP 서버가 HTML을 직접 제공하므로 문제 없음

---

### Issue #4: 브라우저 캐시 문제

**증상**:
- 빌드 후 변경사항이 브라우저에 반영되지 않음
- 새로고침(F5)으로는 해결 안 됨

**해결**:
- **강력 새로고침** 사용 필수
  - Mac: `Cmd + Shift + R`
  - Windows/Linux: `Ctrl + Shift + F5`

**재발 방지**:
- ✅ 빌드 후 항상 강력 새로고침 수행
- ✅ 개발 중에는 브라우저 개발자 도구에서 "Disable cache" 옵션 활성화 권장

---

## 📝 현재 위젯 구현 상태

### 기능
- ✅ 기본 React 컴포넌트 구조
- ✅ `useWidgetState` 훅 사용 (ChatGPT 상태 동기화)
- ✅ 이름 입력 필드 (1개)
- ✅ 생성하기 버튼
- ✅ 기본 스타일링

### UI
```
┌─────────────────────────────────┐
│  📝 포트폴리오 생성              │
├─────────────────────────────────┤
│                                 │
│  [이름 입력 필드]               │
│                                 │
│  [생성하기 버튼]                │
│                                 │
└─────────────────────────────────┘
```

### 코드 구조
```
src/portfolio-builder/
├── index.jsx                 # React 엔트리 포인트
├── portfolio-builder.jsx     # 메인 컴포넌트 (35줄)
└── portfolio-builder.css     # 스타일 (45줄)
```

---

## 🔜 다음 단계 (Stage 2)

### 계획
1. **회사명 필드 추가**
   - 두 번째 입력 필드 구현
   - 상태 관리 업데이트

2. **입력 검증 로직**
   - 빈 값 체크
   - 길이 제한 (이름 50자, 회사명 100자)
   - 실시간 검증

3. **에러 메시지 표시**
   - 에러 상태 관리
   - UI에 에러 메시지 표시
   - 접근성 속성 추가 (`aria-describedby`)

4. **버튼 상태 관리**
   - 폼 유효성에 따른 버튼 활성화/비활성화
   - 시각적 피드백

---

## 💡 학습 내용

### React Hooks
- `useWidgetState`: ChatGPT 전용 훅, `window.openai`와 상태 동기화
- `useWidgetProps`: MCP 서버에서 전달받은 초기 데이터 수신

### Vite 빌드
- `build-all.mts`: 위젯별 개별 빌드 스크립트
- 해시 기반 파일명 생성 (`-9252`)
- HTML, JS, CSS 자동 번들링

### ChatGPT Apps SDK
- `window.openai.setWidgetState()`: 상태를 ChatGPT에 저장
- `window.openai.sendFollowUpMessage()`: ChatGPT에 후속 메시지 전송
- 샌드박스 환경에서만 사용 가능

---

## 📌 주요 베스트 프랙티스

### 1. Null 안전성
```jsx
// ❌ Bad
const name = widgetState.profile.name;

// ✅ Good
const profile = widgetState?.profile || { name: "", company: "" };
const name = profile.name;
```

### 2. window.openai 접근
```typescript
// ❌ Bad
window.openai.setWidgetState(newState);

// ✅ Good
if (window.openai?.setWidgetState) {
  window.openai.setWidgetState(newState);
}
```

### 3. 서버 실행
```bash
# ❌ Bad (SPA 모드 리다이렉트 문제)
pnpm run serve

# ✅ Good (Python HTTP 서버)
cd assets && python3 -m http.server 4444
```

### 4. 빌드 후 테스트
```bash
# 1. 빌드
pnpm run build

# 2. 서버 시작
cd assets && python3 -m http.server 4444

# 3. 브라우저 강력 새로고침 (Cmd+Shift+R)
```

---

## 🔗 참고 자료

- [프로젝트 구조](../PROJECT_STRUCTURE.md)
- [개발 명세서](../docs/PORTFOLIO_BUILDER_SPEC.md)
- [ChatGPT Apps SDK 가이드](../docs/CHATGPT_APPS_GUIDE.md)
- [빠른 시작 가이드](../docs/GETTING_STARTED.md)

---

**마지막 업데이트**: 2025-11-19 21:25 (Stage 1 완료)
