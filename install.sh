#!/usr/bin/env bash
# ============================================================
# cardnews-skill 설치 스크립트
#
# 역할:
#   1) 현재 저장소를 CARDNEWS_HOME (기본값 ~/.cardnews-skill) 으로 설정
#   2) skill/SKILL.md 를 ~/.claude/skills/cardnews/SKILL.md 로 복사
#   3) npm 의존성 설치 + Playwright Chromium 다운로드
#
# 사용:
#   bash install.sh                  # 현재 디렉터리를 CARDNEWS_HOME 으로 등록
#   CARDNEWS_HOME=~/my-dir bash install.sh  # 사용자 지정 경로
# ============================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CARDNEWS_HOME="${CARDNEWS_HOME:-$REPO_ROOT}"
CLAUDE_SKILLS_DIR="${HOME}/.claude/skills/cardnews"

echo ""
echo "================================================"
echo " cardnews-skill 설치"
echo "================================================"
echo "  REPO_ROOT    : $REPO_ROOT"
echo "  CARDNEWS_HOME: $CARDNEWS_HOME"
echo "  SKILL_DIR    : $CLAUDE_SKILLS_DIR"
echo ""

# 1. 필수 디렉터리 검증
for dir in shared templates skill; do
  if [[ ! -d "$REPO_ROOT/$dir" ]]; then
    echo "❌ 필수 디렉터리가 없습니다: $dir/"
    exit 1
  fi
done

# 2. 스킬 등록
echo "[1/3] Claude Code 스킬 등록..."
mkdir -p "$CLAUDE_SKILLS_DIR"
cp "$REPO_ROOT/skill/SKILL.md" "$CLAUDE_SKILLS_DIR/SKILL.md"
echo "      ✓ $CLAUDE_SKILLS_DIR/SKILL.md"

# 3. CARDNEWS_HOME 설정 파일 생성 (스킬이 프로젝트 위치 탐지용으로 사용)
CONFIG_DIR="${HOME}/.config/cardnews-skill"
mkdir -p "$CONFIG_DIR"
echo "CARDNEWS_HOME=$CARDNEWS_HOME" > "$CONFIG_DIR/config"
echo "      ✓ $CONFIG_DIR/config"

# 4. npm 의존성 설치
echo ""
echo "[2/3] Node 의존성 설치..."
cd "$REPO_ROOT"
if command -v npm >/dev/null 2>&1; then
  npm install --silent
  echo "      ✓ playwright 설치됨"
else
  echo "      ⚠ npm 을 찾을 수 없습니다. Node.js 18+ 를 먼저 설치해 주세요."
  exit 1
fi

# 5. Chromium 다운로드
echo ""
echo "[3/3] Playwright Chromium 다운로드..."
npx playwright install chromium
echo "      ✓ chromium ready"

# 완료
echo ""
echo "================================================"
echo " ✅ 설치 완료"
echo "================================================"
echo ""
echo " 다음 단계:"
echo "   1) Claude Code 를 실행"
echo "   2) 아무 디렉터리에서 '/cardnews <주제>' 입력"
echo ""
echo "   예시:"
echo "     /cardnews 2026년 AI 트렌드 5가지"
echo "     /cardnews https://example.com/article"
echo ""
echo " 프로젝트 루트: $CARDNEWS_HOME"
echo ""
