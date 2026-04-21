# Cardnews Skill

인스타그램 4:5 비율(1080×1350px) 카드 뉴스를 **HTML/CSS + WebGL 셰이더**로 자동 생성하는 Claude Code 스킬.

> Helvetica Neue · 흰 배경 + 단일 액센트 · WebGL 추상 도형 · Playwright PNG 캡처

---

## 설치 (다른 사람도 이 방법으로 설치)

### Prerequisites

- macOS / Linux / WSL
- [Claude Code](https://claude.com/claude-code) 설치됨
- Node.js 18 이상
- Git

### 1-Line 설치

```bash
git clone https://github.com/hjsh200219/cardnews-skill ~/.cardnews-skill \
  && cd ~/.cardnews-skill \
  && bash install.sh
```

이 명령 하나로 다음이 자동 수행됩니다:

1. 저장소를 `~/.cardnews-skill/` 에 클론
2. `skill/SKILL.md` 를 `~/.claude/skills/cardnews/SKILL.md` 로 복사 (스킬 등록)
3. `~/.config/cardnews-skill/config` 에 `CARDNEWS_HOME` 경로 저장 (감지용)
4. `npm install` 로 Playwright 설치
5. Chromium 브라우저 다운로드

### 설치 검증

```bash
ls ~/.claude/skills/cardnews/SKILL.md   # 스킬 등록 확인
cat ~/.config/cardnews-skill/config      # CARDNEWS_HOME 경로 확인
```

Claude Code 를 재시작한 뒤 `/cardnews` 슬래시 커맨드가 목록에 나타나면 완료입니다.

---

## 사용법

Claude Code 에서 아래처럼 입력:

```
/cardnews 2026년 AI 트렌드 5가지
/cardnews https://example.com/article
/cardnews 미니멀 디자인의 3가지 원칙
```

자연어도 가능:
- "카드뉴스 만들어줘 — 주제: ..."
- "인스타그램 카드 생성: ..."

**어느 디렉터리에서도 호출 가능합니다.** 스킬이 자동으로 `CARDNEWS_HOME` 을 찾아 에피소드를 `~/.cardnews-skill/episodes/YYYYMMDD_<slug>/` 에 생성합니다.

### 결과물

```
~/.cardnews-skill/episodes/20260421_ai-trends/images/
  card-01.png   ← 커버 (orb 셰이더)
  card-02.png   ← 포인트 (ring)
  card-03.png   ← 리스트 (mesh)
  card-04.png   ← 통계 (line-stream)
  card-05.png   ← 인용 (gradient-flow)
  card-06.png   ← 체크리스트 (noise-field)
  card-07.png   ← CTA (액센트 풀블리드)
```

각 파일은 **1080×1350px** 인스타그램 4:5 비율.

---

## 디자인 원칙

| 항목 | 규칙 |
|------|------|
| 배경 | 카드 상단 **WebGL 셰이더**, 텍스트 영역은 **순백** |
| 폰트 | **Helvetica Neue** 단색 (그라디언트 텍스트 금지) |
| 컬러 | **흰색 + 액센트 1색** 만 사용 |
| 영역 | 그래픽(`shader-zone`) ↔ 텍스트(`text-zone`) 완전 분리 |
| 도형 | 씬마다 맥락에 맞는 **추상 도형** (원·링·선 등) |

---

## WebGL 셰이더 6종

| 셰이더 | 의미 | 추천 사용처 |
|--------|------|-------------|
| `orb` | 포커스·코어 | 커버, 브랜드 정체성 |
| `ring` | 확장·파급 | 포인트, 영향력 |
| `mesh` | 구조·연결 | 목록, 시스템 |
| `line-stream` | 흐름·시간 | 통계, 변화 |
| `gradient-flow` | 무드·여운 | 인용구, 감성 |
| `noise-field` | 가능성·넓이 | 체크리스트, 탐색 |

`data-seed` (0~1) 값을 바꾸면 같은 셰이더로 다른 패턴 생성.

---

## 액센트 컬러 변경

```css
/* shared/styles.css */
:root {
  --accent: #6C63FF;   /* 여기만 변경 */
}
```

각 카드의 `<canvas data-accent="...">` 값도 동일하게 맞추면 됩니다.

---

## 프로젝트 루트 감지 로직

스킬은 다음 우선순위로 `CARDNEWS_HOME` 을 찾습니다:

1. 환경 변수 `$CARDNEWS_HOME`
2. `~/.config/cardnews-skill/config` 파일의 `CARDNEWS_HOME=<path>`
3. 현재 cwd 부터 상향 탐색 (최대 5단계)
4. 기본 경로 `~/.cardnews-skill`
5. 모두 실패 시 설치 안내 출력

→ `install.sh` 는 **2번**을 자동 설정하므로, 설치만 하면 어디서나 동작합니다.

### 위치 변경

다른 경로에 두고 싶다면:

```bash
# 환경 변수 방식
export CARDNEWS_HOME=/path/to/your/cardnews-skill

# 또는 설정 파일 방식
echo "CARDNEWS_HOME=/path/to/your/cardnews-skill" > ~/.config/cardnews-skill/config
```

---

## 프로젝트 구조

```
cardnews-skill/
├── README.md              ← 이 파일
├── CLAUDE.md              ← 프로젝트 컨텍스트
├── package.json
├── install.sh             ← 설치 스크립트
├── .gitignore
├── skill/
│   └── SKILL.md           ← Claude Code 스킬 정의 (설치 시 ~/.claude/skills/cardnews/ 로 복사)
├── shared/
│   ├── styles.css         ← 화이트 베이스 + 액센트 1색
│   ├── shaders.js         ← WebGL 셰이더 6종
│   └── screenshot.js      ← Playwright 캡처
├── templates/
│   └── example.html       ← 7장 레퍼런스 (모든 셰이더 사용 예)
└── episodes/              ← 사용자별 결과물 (gitignore)
    └── YYYYMMDD_<slug>/
        ├── cards.html
        ├── screenshot.js  (shared에서 복사됨)
        └── images/
```

---

## 업데이트

```bash
cd ~/.cardnews-skill
git pull
bash install.sh   # SKILL.md 재동기화
```

## 제거

```bash
rm -rf ~/.claude/skills/cardnews
rm -rf ~/.config/cardnews-skill
rm -rf ~/.cardnews-skill
```

---

## 수동 사용 (스킬 없이)

스킬 호출 없이 직접 사용도 가능합니다:

```bash
cd ~/.cardnews-skill
mkdir -p episodes/20260421_my-topic/images
cp templates/example.html episodes/20260421_my-topic/cards.html
# cards.html 의 텍스트/셰이더/seed 값 수정
cp shared/screenshot.js episodes/20260421_my-topic/screenshot.js
cd episodes/20260421_my-topic
node screenshot.js
```

---

## 기술 스택

- **HTML/CSS** — 순수 CSS (빌드 도구 없음)
- **WebGL** — 바닐라 GLSL 셰이더
- **Playwright (Node.js)** — 헤드리스 Chromium PNG 캡처
- **Helvetica Neue** — 시스템 폰트 체인 (Linux 는 Pretendard fallback)

### WebGL 관련 기술적 처리

- `preserveDrawingBuffer: true` — 스크린샷 시점에 버퍼 보존
- `canvas.toDataURL()` → `<img>` 교체 — Playwright element screenshot 의 WebGL 합성 누락 이슈 우회
- 로컬 HTTP 서버 — `file://` 프로토콜의 CORS·폰트 로드 실패 회피

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 이미지가 흰색만 나옴 | WebGL 버퍼 클리어 | `shared/shaders.js` 최신 버전 사용 확인 |
| 폰트가 기본 sans 로 렌더링 | Helvetica Neue 없음 | macOS 는 기본 포함. Linux 는 Pretendard fallback 사용 |
| 한국어 줄 중간에서 끊김 | `word-break` 미적용 | 텍스트에 `keep-all` 클래스 추가 |
| `Cannot find module 'playwright'` | 미설치 | `cd ~/.cardnews-skill && npm install && npx playwright install chromium` |
| `/cardnews` 가 안 보임 | 스킬 미등록 | `bash ~/.cardnews-skill/install.sh` 재실행 후 Claude Code 재시작 |
| `CARDNEWS_HOME` 을 못 찾음 | config 파일 손상 | `echo "CARDNEWS_HOME=$HOME/.cardnews-skill" > ~/.config/cardnews-skill/config` |

---

## 라이선스

MIT
