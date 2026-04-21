/**
 * 카드 뉴스 Playwright 캡처 스크립트 (WebGL 셰이더 지원)
 *
 * 사용법:
 *   node screenshot.js
 *
 * 전제 조건:
 *   프로젝트 루트에 node_modules/playwright 설치됨
 *   npx playwright install chromium
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');

const EPISODE_DIR = __dirname;
const PROJECT_ROOT = path.resolve(EPISODE_DIR, '..', '..');

function startLocalServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let filePath = path.join(rootDir, parsedUrl.pathname);

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }

      // shared/ fallback: 에피소드 루트에 없으면 프로젝트 루트에서 탐색
      if (!fs.existsSync(filePath)) {
        const fallback = path.join(PROJECT_ROOT, parsedUrl.pathname);
        if (fs.existsSync(fallback)) filePath = fallback;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('Not Found'); return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css':  'text/css; charset=utf-8',
        '.js':   'application/javascript; charset=utf-8',
        '.png':  'image/png', '.jpg':'image/jpeg',
        '.svg':  'image/svg+xml', '.woff2':'font/woff2',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const htmlFile = path.join(EPISODE_DIR, 'cards.html');
  const outputDir = path.join(EPISODE_DIR, 'images');

  if (!fs.existsSync(htmlFile)) {
    console.error(`cards.html not found: ${htmlFile}`); process.exit(1);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const server = await startLocalServer(EPISODE_DIR);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`\n[cardnews] capture start`);
  console.log(`  server: ${baseUrl}`);
  console.log(`  out   : ${outputDir}\n`);

  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1350 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [page error] ${msg.text()}`);
  });

  await page.goto(`${baseUrl}/cards.html`);
  await page.waitForLoadState('networkidle');

  // 폰트 로드 대기
  await page.evaluate(() => document.fonts.ready);

  // WebGL 셰이더 렌더 완료 대기 (window.__shadersReady 플래그)
  await page.waitForFunction(() => {
    if (!document.querySelector('canvas.shader')) return true;
    return window.__shadersReady === true;
  }, { timeout: 10000 });

  // 모든 셰이더가 <img>로 교체되었는지 확인 (toDataURL 변환 완료)
  await page.waitForFunction(() => {
    return document.querySelectorAll('canvas.shader').length === 0;
  }, { timeout: 10000 });

  // <img> 디코딩 완료 대기
  await page.evaluate(async () => {
    const imgs = document.querySelectorAll('img.shader-rendered');
    await Promise.all(Array.from(imgs).map(i => i.decode().catch(() => {})));
  });

  await page.waitForTimeout(600);

  const cards = await page.$$('.card');
  if (cards.length === 0) {
    console.error('no .card elements'); await browser.close(); server.close(); process.exit(1);
  }
  console.log(`  cards : ${cards.length}\n`);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const id = await card.getAttribute('id');
    const fileName = id ? `${id}.png` : `card_${String(i + 1).padStart(2, '0')}.png`;
    const outputPath = path.join(outputDir, fileName);
    await card.screenshot({ path: outputPath });
    console.log(`  ok    ${fileName}`);
  }

  await browser.close();
  server.close();
  console.log(`\n[cardnews] done — ${cards.length} files at ${outputDir}\n`);
})();
