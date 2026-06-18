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
│   ├── screenshot.js      ← Playwright 캡처
│   └── publish.js         ← Instagram Graph API 캐러셀 발행
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

## Instagram 자동 배포

생성된 PNG 카드를 Instagram에 **캐러셀 게시물**(최대 10장)로 자동 업로드하는 기능입니다. 공식 **Instagram Graph API**를 사용합니다.

### 준비 단계 (최초 1회)

Instagram 자동 배포는 다음 4가지가 **모두 필요**합니다. 하나라도 빠지면 API가 동작하지 않습니다.

#### 1. Instagram 계정을 Business/Creator로 전환

- Instagram 앱 → 설정 → 계정 → **"프로페셔널 계정으로 전환"** 선택
- **개인(Personal) 계정은 API로 게시 불가**

#### 2. Facebook Page 에 Instagram 계정 연결

- https://facebook.com/pages/create 에서 Facebook Page 생성 (없다면)
- Facebook Page 설정 → **Instagram** → Instagram 계정 연결
- 연결 확인: https://business.facebook.com/settings/instagram-accounts

#### 3. Meta Developer App 생성 & 권한 설정

1. https://developers.facebook.com/apps 에서 **"Create App"** → Type: **Business**
2. App 대시보드에서 **"Instagram Graph API"** 제품 추가
3. App Review → **Permissions** 에서 아래 권한 요청 및 승인:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. **Development Mode** 에서는 앱 소유자 계정에 한해서만 사용 가능 (테스트에는 충분)
5. 실제 운영은 App Review 제출 → 승인 후 Live Mode

#### 4. Access Token & User ID 발급

**Access Token (장기, 60일 유효):**

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer/) 접속
2. 상단 App 선택 → **User Token** 생성
3. 권한 체크: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`
4. "Generate Access Token" 클릭 → **Short-lived Token** 복사
5. [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) 에서 Token 붙여넣기 → **"Extend Access Token"** 버튼으로 **Long-lived Token (60일)** 로 변환
6. 이 Long-lived Token을 `IG_ACCESS_TOKEN` 으로 사용

**Instagram User ID 조회:**

Graph API Explorer에서:
```
GET /me/accounts
→ 응답에서 연결된 Page의 id 확인 (예: "123456789")

GET /{page-id}?fields=instagram_business_account
→ 응답의 instagram_business_account.id 가 IG_USER_ID
```

#### 5. Imgur Client ID (이미지 호스팅, 무료)

Instagram API는 **퍼블릭 URL에 있는 이미지**만 받습니다. 직접 호스팅이 없다면 Imgur 익명 업로드가 가장 간편합니다.

1. https://api.imgur.com/oauth2/addclient 접속
2. **"OAuth 2 authorization without a callback URL"** 선택
3. Application name 입력 → 등록
4. 발급된 **Client ID** 를 `IMGUR_CLIENT_ID` 로 사용

**대안** — 자체 CDN(S3 / Vercel Blob / Cloudflare R2 등)이 있다면 `IMAGE_BASE_URL` 환경변수로 대체 가능:
```
IMAGE_BASE_URL=https://cdn.example.com/cards/20260421_example
```
이 경우 `<base>/card-01.png`, `card-02.png` ... 순서로 접근됩니다.

---

### 환경 변수 설정

```bash
cd ~/.cardnews-skill
cp .env.example .env
# .env 파일을 편집기로 열어 실제 값 입력
vim .env
```

`.env` 파일 내용:
```bash
IG_USER_ID=17841400000000000
IG_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxx
IMGUR_CLIENT_ID=abc123def456
```

⚠️ `.env` 파일은 `.gitignore` 에 포함되어 있어 커밋되지 않습니다. **절대 토큰을 공개 저장소에 올리지 마세요.**

---

### 배포 사용법

#### Claude Code 스킬로 (권장)

카드 생성 후 이어서:
```
인스타에 올려줘
```

스킬이 자동으로:
1. 캡션 초안을 제안하고 사용자 승인을 받음
2. `shared/publish.js` 실행
3. 배포 결과 보고

#### 수동 배포

```bash
cd ~/.cardnews-skill

# 1) Dry-run (업로드만, 게시 X — 검증용)
node shared/publish.js episodes/20260421_example --dry-run

# 2) 실제 배포 (인라인 캡션)
node shared/publish.js episodes/20260421_example --caption "카드뉴스 캡션\n\n#해시태그1 #해시태그2"

# 3) 캡션 파일 사용
echo "카드뉴스 캡션 본문..." > episodes/20260421_example/caption.txt
node shared/publish.js episodes/20260421_example --caption-file episodes/20260421_example/caption.txt
```

---

### 배포 제약사항

| 항목 | 제한 |
|------|------|
| 캐러셀 최대 장수 | **10장** (그 이하) |
| 이미지 비율 | 1:1, 1.91:1, 4:5 권장 (본 스킬은 4:5) |
| 이미지 크기 | 최대 8MB / 장 |
| 계정당 게시 | **시간당 25회** |
| Access Token | **60일 유효** (만료 시 재발급) |
| 캡션 길이 | 2,200자 / 해시태그 30개 이내 |

---

### 문제 해결 (Instagram 관련)

| 증상 | 원인 | 해결 |
|------|------|------|
| `Invalid OAuth 2.0 Access Token` | 토큰 만료 | Graph API Explorer 에서 재발급 + Extend |
| `The user is not an Instagram Business` | 개인 계정 | Business/Creator 로 전환 |
| `Permissions error: instagram_content_publish` | 권한 미승인 | App Review 에서 권한 요청 또는 Dev Mode 테스트 사용자 추가 |
| `Image URL is not accessible` | 이미지 URL 비공개 | 퍼블릭 URL 확인 (Imgur 또는 CDN) |
| `Media not published yet` | 컨테이너 처리 중 | 2~3초 대기 후 재시도 (script 내부에서 자동 폴링) |

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
