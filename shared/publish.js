/**
 * Instagram 카드 뉴스 배포 스크립트
 *
 * 기능:
 *   1) 에피소드 디렉터리의 PNG 이미지를 Imgur에 업로드 (무료·익명)
 *   2) Instagram Graph API로 캐러셀 게시물 생성·발행
 *
 * 사용:
 *   node shared/publish.js <episode-dir>                       # 기본 캡션
 *   node shared/publish.js <episode-dir> --caption "..."       # 인라인 캡션
 *   node shared/publish.js <episode-dir> --caption-file caption.txt
 *   node shared/publish.js <episode-dir> --dry-run             # 업로드만 하고 게시 안함
 *
 * 환경 변수 (.env 또는 export):
 *   IG_USER_ID        Instagram Business/Creator 계정 ID
 *   IG_ACCESS_TOKEN   Long-lived Access Token (권한: instagram_content_publish 등)
 *   IMGUR_CLIENT_ID   Imgur API Client ID (무료 발급)
 *
 *   또는 사용자 자체 호스팅 URL 사용 시:
 *   IMAGE_BASE_URL    https://cdn.example.com/cards/20260421_example  (파일명은 card-01.png ~)
 */

const fs = require('fs');
const path = require('path');

// ----- .env 파싱 (의존성 없음) -----
function loadEnv(rootDir) {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

// ----- Imgur 익명 업로드 -----
async function uploadToImgur(imagePath, clientId) {
  const data = fs.readFileSync(imagePath);
  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${clientId}`,
      'Content-Type': 'application/octet-stream',
    },
    body: data,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`Imgur 업로드 실패: ${JSON.stringify(json)}`);
  }
  return json.data.link;
}

// ----- Instagram Graph API -----
const IG_API = 'https://graph.facebook.com/v21.0';

async function igPost(endpoint, params) {
  const url = `${IG_API}${endpoint}`;
  const body = new URLSearchParams(params);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(`IG API 에러: ${JSON.stringify(json.error)}`);
  }
  return json;
}

async function createCarouselItem(userId, accessToken, imageUrl) {
  const r = await igPost(`/${userId}/media`, {
    image_url: imageUrl,
    is_carousel_item: 'true',
    access_token: accessToken,
  });
  return r.id;
}

async function createCarouselContainer(userId, accessToken, childIds, caption) {
  const r = await igPost(`/${userId}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption: caption || '',
    access_token: accessToken,
  });
  return r.id;
}

async function publishContainer(userId, accessToken, creationId) {
  const r = await igPost(`/${userId}/media_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  });
  return r;
}

// 컨테이너 status_code 가 FINISHED 될 때까지 폴링
async function waitContainerReady(containerId, accessToken, maxWaitMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const url = `${IG_API}/${containerId}?fields=status_code&access_token=${accessToken}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status_code === 'FINISHED') return;
    if (json.status_code === 'ERROR') {
      throw new Error(`IG 컨테이너 처리 에러: ${JSON.stringify(json)}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`IG 컨테이너 처리 타임아웃 (${containerId})`);
}

// ----- CLI 파싱 -----
function parseArgs(argv) {
  const args = { episodeDir: null, caption: '', captionFile: null, dryRun: false };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--caption') args.caption = rest[++i];
    else if (a === '--caption-file') args.captionFile = rest[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (!args.episodeDir) args.episodeDir = a;
  }
  return args;
}

// ----- Main -----
(async () => {
  const args = parseArgs(process.argv);
  if (!args.episodeDir) {
    console.error('사용법: node publish.js <episode-dir> [--caption "..."] [--caption-file caption.txt] [--dry-run]');
    process.exit(1);
  }

  const episodeDir = path.resolve(args.episodeDir);
  const projectRoot = path.resolve(__dirname, '..');
  loadEnv(projectRoot);
  loadEnv(episodeDir); // 에피소드별 .env 우선

  const imagesDir = path.join(episodeDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    console.error(`❌ images/ 디렉터리가 없습니다: ${imagesDir}`);
    process.exit(1);
  }

  // 이미지 목록 (card-01.png ~ 순서)
  const images = fs.readdirSync(imagesDir)
    .filter((f) => /^card-\d+\.png$/i.test(f))
    .sort();

  if (images.length === 0) {
    console.error('❌ card-*.png 파일이 없습니다.');
    process.exit(1);
  }
  if (images.length > 10) {
    console.error(`❌ Instagram 캐러셀은 최대 10장. 현재 ${images.length}장.`);
    process.exit(1);
  }

  // 캡션
  let caption = args.caption || '';
  if (args.captionFile) {
    caption = fs.readFileSync(path.resolve(args.captionFile), 'utf8').trim();
  } else if (!caption) {
    const defaultCaptionPath = path.join(episodeDir, 'caption.txt');
    if (fs.existsSync(defaultCaptionPath)) {
      caption = fs.readFileSync(defaultCaptionPath, 'utf8').trim();
    }
  }

  console.log(`\n[publish] 에피소드: ${episodeDir}`);
  console.log(`  이미지: ${images.length}장`);
  console.log(`  캡션: ${caption ? caption.slice(0, 60) + (caption.length > 60 ? '...' : '') : '(없음)'}`);
  console.log(`  dry-run: ${args.dryRun}\n`);

  // 이미지 URL 확보
  let imageUrls = [];
  if (process.env.IMAGE_BASE_URL) {
    // 외부 호스팅 URL 사용
    const base = process.env.IMAGE_BASE_URL.replace(/\/$/, '');
    imageUrls = images.map((f) => `${base}/${f}`);
    console.log('[1/3] IMAGE_BASE_URL 사용 (업로드 생략)');
    imageUrls.forEach((u, i) => console.log(`      ${i + 1}. ${u}`));
  } else {
    // Imgur 업로드
    if (!process.env.IMGUR_CLIENT_ID) {
      console.error('❌ IMGUR_CLIENT_ID 환경변수가 없습니다. (또는 IMAGE_BASE_URL 사용)');
      process.exit(1);
    }
    console.log('[1/3] Imgur 업로드 중...');
    for (const f of images) {
      const url = await uploadToImgur(path.join(imagesDir, f), process.env.IMGUR_CLIENT_ID);
      imageUrls.push(url);
      console.log(`      ✓ ${f} → ${url}`);
    }
  }

  if (args.dryRun) {
    console.log('\n[dry-run] 업로드만 수행. Instagram 게시 생략.');
    console.log(`이미지 URL:\n${imageUrls.map((u, i) => `  ${i + 1}. ${u}`).join('\n')}`);
    return;
  }

  // Instagram 자격증명 확인
  if (!process.env.IG_USER_ID || !process.env.IG_ACCESS_TOKEN) {
    console.error('❌ IG_USER_ID 및 IG_ACCESS_TOKEN 환경변수가 필요합니다.');
    process.exit(1);
  }

  // 캐러셀 아이템 생성
  console.log('\n[2/3] Instagram 캐러셀 아이템 생성...');
  const childIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const id = await createCarouselItem(
      process.env.IG_USER_ID,
      process.env.IG_ACCESS_TOKEN,
      imageUrls[i]
    );
    childIds.push(id);
    console.log(`      ✓ item ${i + 1}: ${id}`);
  }

  // 캐러셀 컨테이너 생성
  console.log('\n[3/3] 캐러셀 컨테이너 생성 & 발행...');
  const carouselId = await createCarouselContainer(
    process.env.IG_USER_ID,
    process.env.IG_ACCESS_TOKEN,
    childIds,
    caption
  );
  console.log(`      ✓ carousel container: ${carouselId}`);

  // 처리 완료 대기
  console.log('      ⏳ 컨테이너 처리 대기 중...');
  await waitContainerReady(carouselId, process.env.IG_ACCESS_TOKEN);
  console.log('      ✓ ready');

  // 게시
  const pub = await publishContainer(
    process.env.IG_USER_ID,
    process.env.IG_ACCESS_TOKEN,
    carouselId
  );
  console.log(`      ✓ published: media_id = ${pub.id}`);

  console.log('\n🎉 Instagram 게시 완료!');
  console.log(`   Media ID: ${pub.id}`);
  console.log(`   피드 확인: https://www.instagram.com/\n`);
})().catch((e) => {
  console.error('\n❌ 오류 발생:', e.message);
  process.exit(1);
});
