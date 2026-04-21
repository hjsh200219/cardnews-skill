# 카드 뉴스 프로젝트

인스타그램 카드 뉴스를 HTML/CSS + Playwright로 자동 생성하는 프로젝트입니다.

## 프로젝트 구조

```
cardnews-skill/
├── CLAUDE.md                  ← 이 파일 (프로젝트 컨텍스트)
├── shared/
│   ├── styles.css             ← 공유 디자인 시스템 (컬러, 폰트, 컴포넌트)
│   └── screenshot.js          ← Playwright 캡처 스크립트 (각 에피소드에 복사해 사용)
├── templates/
│   └── example.html           ← 참조용 카드 예제
└── episodes/
    └── YYYYMMDD_주제-슬러그/   ← 에피소드별 디렉터리
        ├── cards.html          ← 모든 카드 HTML
        ├── screenshot.js       ← 캡처 스크립트 (shared에서 복사)
        └── images/             ← 출력 PNG
```

## 카드 규격

- **크기**: 1080 × 1350px (인스타그램 4:5 비율)
- **구성**: 커버 1장 + 본문 N장 + CTA 1장
- **기술**: 순수 HTML/CSS (빌드 도구 없음)
- **캡처**: Playwright (Node.js)

## 작업 규칙

1. **`shared/styles.css` 항상 링크**: 모든 카드 HTML은 `../../shared/styles.css`를 참조
2. **에피소드 디렉터리**: `episodes/YYYYMMDD_슬러그/` 형식으로 생성
3. **screenshot.js 복사**: `shared/screenshot.js`를 에피소드 디렉터리에 복사 후 사용
4. **word-break: keep-all**: 한국어 단어 중간 줄바꿈 방지 필수
5. **텍스트 분량**: 카드당 본문 50~80자 이내 유지

## 스킬 사용

이 프로젝트 디렉터리에서 `/cardnews` 스킬을 호출하면 자동으로 카드 뉴스가 생성됩니다.

```
/cardnews https://example.com/article
/cardnews 2026년 AI 트렌드 5가지
```

## 브랜드 커스터마이징

`shared/styles.css`의 `:root` 변수만 수정하면 전체 디자인이 변경됩니다:

```css
:root {
  --brand-accent:  #6C63FF;   /* 포인트 컬러 */
  --brand-accent2: #FF6584;   /* 보조 컬러 */
  --brand-primary: #0A0A0A;   /* 배경 */
}
```

## Playwright 설치 (최초 1회)

```bash
npm install playwright
npx playwright install chromium
```
