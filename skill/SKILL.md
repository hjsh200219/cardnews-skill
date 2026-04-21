---
name: cardnews
description: URL 또는 주제로부터 인스타그램 카드 뉴스를 HTML/CSS + WebGL 셰이더로 생성하고 Playwright로 PNG 이미지로 캡처하는 스킬
triggers:
  - 카드뉴스
  - cardnews
  - card news
  - 인스타그램 카드
  - 카드 뉴스 만들어
  - 카드 뉴스 생성
argument-hint: "<url 또는 주제>"
---

# 카드 뉴스 생성 스킬

인스타그램 4:5 비율(1080×1350px) 카드 뉴스를 순수 HTML/CSS + WebGL 셰이더로 제작하고, Playwright로 PNG 이미지를 생성하는 완전 자동화 스킬입니다.

## 디자인 원칙 (엄수)

1. **배경**: 카드 상단에 WebGL 셰이더(추상 도형), 텍스트 영역은 순백
2. **폰트**: Helvetica Neue (단색, 그라디언트 텍스트 금지)
3. **컬러**: 흰색 + 액센트 1색만 사용
4. **분리**: 그래픽 영역(shader-zone)과 텍스트 영역(text-zone)은 물리적으로 분리
5. **의미**: 씬마다 맥락에 맞는 셰이더 선택 (확장=ring, 구조=mesh, 흐름=line-stream 등)

## 워크플로우 개요

```
0. 프로젝트 루트 감지  →  1. 콘텐츠 수집  →  2. 구성 기획  →  3. HTML 생성  →  4. 이미지 캡처  →  5. 결과 보고
```

---

## Phase 0: 프로젝트 루트 감지 (필수 선행)

스킬은 `shared/styles.css`, `shared/shaders.js`, `shared/screenshot.js` 자산에 의존한다.
아래 순서로 **CARDNEWS_HOME** 을 확정한다:

1. **환경 변수 `$CARDNEWS_HOME`** — 설정되어 있고 `shared/shaders.js` 가 존재하면 사용
2. **설정 파일** `~/.config/cardnews-skill/config` — `CARDNEWS_HOME=<path>` 파싱
3. **현재 cwd 부터 상향 탐색** (최대 5단계) — `shared/shaders.js` 발견 시 해당 디렉터리
4. **기본 경로** `~/.cardnews-skill` — 존재 여부 확인
5. 모두 실패 시 **설치 안내**:
   ```
   git clone https://github.com/hjsh200219/cardnews-skill ~/.cardnews-skill
   bash ~/.cardnews-skill/install.sh
   ```

확정된 경로를 `$CARDNEWS_HOME` 으로 간주하고, 에피소드는 `$CARDNEWS_HOME/episodes/YYYYMMDD_<slug>/` 에 생성한다
(단, 사용자가 "이 디렉터리에 만들어줘" 라고 명시하면 cwd 하위에 생성).

### 감지 구현 예 (Bash)

```bash
detect_cardnews_home() {
  # 1. env var
  if [[ -n "$CARDNEWS_HOME" && -f "$CARDNEWS_HOME/shared/shaders.js" ]]; then
    echo "$CARDNEWS_HOME"; return
  fi
  # 2. config file
  if [[ -f "$HOME/.config/cardnews-skill/config" ]]; then
    local from_cfg
    from_cfg=$(grep '^CARDNEWS_HOME=' "$HOME/.config/cardnews-skill/config" | cut -d= -f2-)
    if [[ -f "$from_cfg/shared/shaders.js" ]]; then echo "$from_cfg"; return; fi
  fi
  # 3. walk up from cwd
  local dir="$PWD"
  for _ in 1 2 3 4 5; do
    if [[ -f "$dir/shared/shaders.js" ]]; then echo "$dir"; return; fi
    dir=$(dirname "$dir")
  done
  # 4. default
  if [[ -f "$HOME/.cardnews-skill/shared/shaders.js" ]]; then
    echo "$HOME/.cardnews-skill"; return
  fi
  return 1
}
```

---

## Phase 1: 콘텐츠 수집

### URL이 제공된 경우
- WebFetch 도구로 URL 내용 전체를 수집
- 핵심 정보(주요 포인트, 숫자, 인용구)를 추출
- 콘텐츠 분량에 따라 카드 수를 결정 (커버 1장 + 본문 5~8장 + CTA 1장)

### 텍스트/주제만 제공된 경우
- 제공된 주제를 기반으로 콘텐츠를 직접 기획
- 검색이 필요하면 WebSearch 활용

### 에피소드 디렉터리 생성
프로젝트 루트 기준으로 아래 구조를 생성:

```
episodes/
  YYYYMMDD_<주제-슬러그>/
    cards.html          ← 모든 카드가 담긴 단일 HTML
    screenshot.js       ← shared/screenshot.js 복사본
    images/             ← 출력 PNG
```

날짜는 오늘 날짜, 슬러그는 영어 소문자 하이픈 (예: `20260421_claude-opus-47`)

---

## Phase 2: 카드 구성 기획

| 카드 번호 | 유형 | 셰이더 추천 | 핵심 내용 |
|-----------|------|-------------|-----------|
| 01 | COVER | `orb` (포커스·코어) | 메인 제목 + 부제 |
| 02~ | POINT | `ring` (확장·파급) | 포인트 넘버 + 소제목 + 본문 |
| 02~ | LIST | `mesh` (구조·연결) | 제목 + 3~5개 항목 |
| 02~ | STAT | `line-stream` (흐름·시간) | 큰 수치 + 설명 |
| 02~ | QUOTE | `gradient-flow` (무드·여운) | 인용구 + 출처 |
| 02~ | CHECK | `noise-field` (가능성·넓이) | 제목 + 체크 항목 |
| N | CTA | (셰이더 없음, 액센트 풀블리드) | 행동 유도 + 채널 |

카드당 텍스트 원칙:
- **커버**: 제목 3~5단어, 부제 15자 이내
- **본문**: 소제목 5~10자, 본문 50~80자
- **CTA**: 행동 유도 문구 + 채널 정보

---

## Phase 3: HTML 카드 생성

프로젝트 루트의 `shared/styles.css`와 `shared/shaders.js`를 반드시 참조한다.
경로는 `../shared/styles.css`, `../shared/shaders.js` (HTTP 서버 fallback으로 해결됨).

### 기본 HTML 구조 (`cards.html`)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080" />
  <title>카드 뉴스</title>
  <link rel="stylesheet" href="../shared/styles.css" />
</head>
<body>

  <!-- 커버: 셰이더 상단 60% + 텍스트 하단 40% -->
  <div class="card cover" id="card-01">
    <div class="shader-zone" style="height: 60%;">
      <canvas class="shader" data-shader="orb" data-accent="#6C63FF" data-seed="0.32"></canvas>
    </div>
    <div class="text-zone">
      <div class="eyebrow">카테고리 · 연도</div>
      <h1 class="title keep-all">메인 제목<br><span class="accent">강조</span></h1>
      <p class="subtitle keep-all">부제목 한 줄 요약.</p>
    </div>
  </div>

  <!-- 포인트 카드: 헤더 + 셰이더 띠 + 텍스트 + 푸터 -->
  <div class="card" id="card-02">
    <div class="card-head">
      <span class="brand">BRAND</span>
      <span class="num">02 / 07</span>
    </div>
    <div class="shader-zone" style="height: 320px;">
      <canvas class="shader" data-shader="ring" data-accent="#6C63FF" data-seed="0.18"></canvas>
    </div>
    <div class="text-zone">
      <div class="point-num">01</div>
      <h2 class="title keep-all">소제목<br><span class="accent">강조</span></h2>
      <p class="body-text keep-all">본문 50~80자.</p>
    </div>
    <div class="card-foot">
      <span class="handle">@handle</span>
      <span class="tag">#tag</span>
    </div>
  </div>

  <!-- CTA: 셰이더 없음, 액센트 풀블리드 -->
  <div class="card cta" id="card-07">
    <h2 class="cta-title keep-all">더 많은 인사이트</h2>
    <p class="cta-desc keep-all">매주 받아보기.</p>
    <div class="cta-handles">
      <div class="cta-handle">Instagram @handle</div>
      <div class="cta-handle">YouTube @channel</div>
    </div>
  </div>

  <script src="../shared/shaders.js"></script>
  <script>
    window.addEventListener('load', () => { CardShaders.renderAll(); });
  </script>
</body>
</html>
```

### 셰이더 종류 (6가지)

| 이름 | 의미 | 사용 맥락 |
|------|------|-----------|
| `orb` | 포커스·코어 | 커버, 브랜드 정체성 |
| `ring` | 확장·파급 | 포인트, 영향력 |
| `mesh` | 구조·연결 | 목록, 시스템 |
| `line-stream` | 흐름·시간 | 통계, 변화 |
| `gradient-flow` | 무드·여운 | 인용구, 감성 |
| `noise-field` | 가능성·넓이 | 체크리스트, 탐색 |

각 셰이더는 `data-seed`(0~1) 값을 바꿔 다른 패턴을 생성할 수 있다.

### 액센트 컬러 변경

`shared/styles.css`의 `:root { --accent: #6C63FF; }`을 수정하면 전체 카드 색상이 변경된다.
각 카드 `<canvas>`의 `data-accent` 속성도 동일 값으로 맞춘다.

### 디자인 규칙 체크리스트

- [ ] 모든 텍스트가 `.text-zone`(순백 배경) 안에 있는가?
- [ ] 액센트 컬러가 단 한 가지인가?
- [ ] 그라디언트 텍스트가 없는가?
- [ ] `keep-all` 클래스로 한국어 줄바꿈 방지되어 있는가?
- [ ] 셰이더 선택이 카드의 의미와 맞는가?

---

## Phase 4: Playwright로 이미지 캡처

### screenshot.js 복사

`shared/screenshot.js`를 에피소드 디렉터리에 그대로 복사한다. WebGL preserveDrawingBuffer, toDataURL 변환, 로컬 HTTP 서버 fallback이 모두 포함되어 있다.

```bash
cp shared/screenshot.js episodes/YYYYMMDD_슬러그/screenshot.js
```

### 캡처 실행

```bash
cd episodes/YYYYMMDD_슬러그
node screenshot.js
```

결과: `images/card-01.png` ~ `card-07.png` 생성 (각 1080×1350).

### 주의사항 (WebGL 관련)

- **preserveDrawingBuffer: true** 필수 (shaders.js 내부 처리)
- **toDataURL → `<img>` 교체** 로 element.screenshot()의 WebGL 합성 누락 이슈 우회
- **로컬 HTTP 서버** 사용 (`file://` 프로토콜은 CORS/폰트 로드 실패)
- `shared/` 경로는 서버 fallback으로 자동 해결

---

## Phase 5: 결과 보고

캡처 완료 후 다음을 사용자에게 보고한다:

1. 생성된 카드 수와 각 카드의 유형·셰이더
2. 이미지 저장 경로: `episodes/YYYYMMDD_슬러그/images/`
3. 액센트 컬러 변경 방법 안내
4. 시각 검증이 필요하면 첫 1~2장 이미지를 Read로 확인

---

## 디렉터리 구조 참조

```
cardnews-skill/
├── shared/
│   ├── styles.css        ← 화이트 베이스 + 액센트 1색 디자인 시스템
│   ├── shaders.js        ← WebGL 셰이더 6종 + preserveDrawingBuffer 처리
│   └── screenshot.js     ← Playwright 캡처 (HTTP 서버 + toDataURL 우회)
├── templates/
│   └── example.html      ← 7장 레퍼런스 템플릿
└── episodes/
    └── YYYYMMDD_슬러그/
        ├── cards.html
        ├── screenshot.js   (shared에서 복사)
        └── images/
```

## Playwright 설치 (최초 1회)

```bash
npm install playwright
npx playwright install chromium
```
