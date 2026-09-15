/**
 * 홈페이지 빌더 — 그림 재료.
 *
 * 사진이 없어도 사이트가 비어 보이지 않아야 한다. 그래서 세 가지를 도구 안에
 * 넣어 둔다. 전부 SVG·CSS로 그리므로 바깥 서버가 필요 없고, 내보낸 파일 안에
 * 그대로 실려 어디서든 뜬다.
 *
 *  - ICONS         카드·단계에 붙는 선 아이콘 (24×24, 선 굵기 1.8)
 *  - ILLUSTRATIONS 히어로 옆에 서는 추상 삽화 — 테마 색을 받아 그린다
 *  - PATTERNS      구역 배경에 옅게 까는 무늬 — CSS 그러데이션만 쓴다
 *
 * 사진이 꼭 필요하면 샘플 사진(samplePhoto)을 임시로 넣고 나중에 바꾼다.
 */

/* ── 아이콘 ────────────────────────────────────────────────
   path 만 적는다. 감싸는 <svg> 는 iconSvg 가 붙인다. */
export const ICONS: Record<string, { name: string; d: string }> = {
  spark: { name: "반짝임 (AI)", d: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM5 3l.7 2 2 .7-2 .7L5 8.4l-.7-2-2-.7 2-.7zM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" },
  book: { name: "책 (교육)", d: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h13M8 7h7" },
  graduation: { name: "학사모", d: "M2 9l10-4 10 4-10 4zM6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4M22 9v5" },
  chart: { name: "막대 차트", d: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  trend: { name: "상승 그래프", d: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  target: { name: "과녁 (목표)", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z" },
  compass: { name: "나침반 (전략)", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM16 8l-2.5 5.5L8 16l2.5-5.5z" },
  layers: { name: "겹 (플랫폼)", d: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5" },
  cpu: { name: "칩 (시스템)", d: "M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" },
  database: { name: "데이터", d: "M12 8c5 0 8-1.3 8-3s-3-3-8-3-8 1.3-8 3 3 3 8 3zM4 5v14c0 1.7 3 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3 3 8 3s8-1.3 8-3" },
  cloud: { name: "클라우드", d: "M7 18a4 4 0 01-.5-8 6 6 0 0111.6 1.5A3.5 3.5 0 0117.5 18z" },
  shield: { name: "방패 (보안)", d: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4" },
  lock: { name: "자물쇠", d: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4M12 15v2" },
  code: { name: "코드", d: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" },
  robot: { name: "로봇", d: "M5 9h14v10H5zM12 5v4M12 3a1 1 0 100 2M9 13h.01M15 13h.01M9 16h6M2 12v4M22 12v4" },
  network: { name: "연결망", d: "M12 5a2 2 0 100-4 2 2 0 000 4zM5 21a2 2 0 100-4 2 2 0 000 4zM19 21a2 2 0 100-4 2 2 0 000 4zM12 5v5M12 10l-7 7M12 10l7 7" },
  users: { name: "사람들 (조직)", d: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" },
  user: { name: "사람", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
  handshake: { name: "악수 (협력)", d: "M3 8l4-3 5 3 5-3 4 3v8l-4 3-5-3-5 3-4-3zM12 8v11" },
  building: { name: "건물 (기관)", d: "M4 21V5l8-3 8 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6M2 21h20" },
  factory: { name: "공장", d: "M2 21V10l6 4v-4l6 4v-4l8 5v6zM2 21h20M6 10V4h3v6" },
  store: { name: "상점", d: "M3 9l1.5-5h15L21 9M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 11v10h14V11M9 21v-6h6v6" },
  briefcase: { name: "서류가방 (사업)", d: "M3 8h18v12H3zM8 8V5a2 2 0 012-2h4a2 2 0 012 2v3M3 13h18" },
  file: { name: "문서", d: "M6 2h8l5 5v15H6zM14 2v5h5M9 13h6M9 17h6" },
  clipboard: { name: "점검표", d: "M8 3h8v3H8zM6 5H5v17h14V5h-1M9 12l2 2 4-4" },
  search: { name: "돋보기 (진단)", d: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5" },
  settings: { name: "톱니 (설정)", d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" },
  tool: { name: "공구 (구축)", d: "M14.7 6.3a4 4 0 005.6 5.6L21 13l-8 8-2-2 6-6-2.3-2.3a4 4 0 01-5.6-5.6L11 3z" },
  check: { name: "체크", d: "M20 6L9 17l-5-5" },
  checkcircle: { name: "체크 원", d: "M22 11.1V12a10 10 0 11-5.9-9.1M22 4L12 14l-3-3" },
  star: { name: "별", d: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1z" },
  award: { name: "메달 (실적)", d: "M12 15a7 7 0 100-14 7 7 0 000 14zM8.2 13.9L7 23l5-3 5 3-1.2-9.1" },
  trophy: { name: "트로피", d: "M6 3h12v6a6 6 0 01-12 0zM6 5H3v2a3 3 0 003 3M18 5h3v2a3 3 0 01-3 3M12 15v4M8 21h8" },
  clock: { name: "시계 (일정)", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" },
  calendar: { name: "달력", d: "M3 5h18v16H3zM16 2v6M8 2v6M3 11h18" },
  phone: { name: "전화", d: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.9.6 2.8.7a2 2 0 011.8 2z" },
  mail: { name: "메일", d: "M3 5h18v14H3zM3 6l9 7 9-7" },
  pin: { name: "위치 핀", d: "M12 22s7-7.3 7-12a7 7 0 10-14 0c0 4.7 7 12 7 12zM12 13a3 3 0 100-6 3 3 0 000 6z" },
  globe: { name: "지구 (글로벌)", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z" },
  home: { name: "집", d: "M3 10l9-7 9 7v11h-6v-7H9v7H3z" },
  truck: { name: "트럭 (물류)", d: "M1 5h14v11H1zM15 9h5l3 3v4h-8zM6 21a2 2 0 100-4 2 2 0 000 4zM18 21a2 2 0 100-4 2 2 0 000 4z" },
  heart: { name: "하트 (복지)", d: "M20.8 5.6a5.5 5.5 0 00-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 000-7.8z" },
  medical: { name: "의료", d: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" },
  leaf: { name: "잎 (환경)", d: "M4 20c0-9 5-16 16-16 0 11-7 16-16 16zM4 20l9-9" },
  sun: { name: "해 (에너지)", d: "M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" },
  coin: { name: "동전 (금융)", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM15 9.5a3 3 0 00-3-1.5c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 01-3-1.5M12 6v2M12 16v2" },
  scale: { name: "저울 (법률)", d: "M12 3v18M5 21h14M3 7l4 7H-1zM17 7l4 7h-8zM2 14a5 5 0 0010 0M12 14a5 5 0 0010 0M6 7h12" },
  megaphone: { name: "확성기 (홍보)", d: "M3 10v4h3l7 4V6l-7 4zM17 9a4 4 0 010 6M19 6a8 8 0 010 12" },
  camera: { name: "카메라", d: "M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 100-8 4 4 0 000 8z" },
  music: { name: "음표 (문화)", d: "M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z" },
  question: { name: "물음표", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" },
  info: { name: "안내", d: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01" },
  arrow: { name: "화살표", d: "M5 12h14M12 5l7 7-7 7" },
  flag: { name: "깃발 (마일스톤)", d: "M4 22V3M4 4h13l-2 4 2 4H4" },
  key: { name: "열쇠", d: "M21 2l-2 2M15.5 7.5l3 3L22 7l-3-3M7 15a5 5 0 105 5l1-1 2.5-2.5 1.5-1.5-3-3-1.5 1.5L10 14z" },
  bell: { name: "종 (알림)", d: "M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0" },
};

export const ICON_IDS = Object.keys(ICONS);

/** 아이콘 하나를 인라인 SVG 로. 모르는 이름이면 빈 문자열. */
export function iconSvg(id: string, cls = "bf-icon"): string {
  const icon = ICONS[id];
  if (!icon) return "";
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icon.d}"/></svg>`;
}

/* ── 배경 무늬 ─────────────────────────────────────────────
   CSS 그러데이션만 쓴다 — 색을 변수로 받을 수 있는 유일한 방법이다.
   (SVG data: 주소 안에서는 var() 가 통하지 않는다) */
export const PATTERNS: { id: string; name: string }[] = [
  { id: "none", name: "없음" },
  { id: "dots", name: "점" },
  { id: "grid", name: "모눈" },
  { id: "diagonal", name: "빗금" },
  { id: "cross", name: "십자" },
  { id: "rings", name: "동심원" },
];

export const PATTERN_IDS = PATTERNS.map((p) => p.id);

/* ── 삽화 ─────────────────────────────────────────────────
   히어로 옆에 서는 추상 그림. 테마 색 둘(강조·보조)로 그린다. 형태가 아니라
   「분위기」를 주는 것이 목적이라 구체적인 사물은 그리지 않는다. */
type Paint = (accent: string, ink: string) => string;

const VIEW = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none"`;

export const ILLUSTRATIONS: { id: string; name: string; paint: Paint }[] = [
  {
    id: "orbits",
    name: "궤도",
    paint: (a, i) => `<svg ${VIEW}>
<circle cx="200" cy="200" r="150" stroke="${i}" stroke-opacity=".25" stroke-width="1.5"/>
<circle cx="200" cy="200" r="110" stroke="${i}" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="6 8"/>
<circle cx="200" cy="200" r="70" stroke="${a}" stroke-width="2"/>
<circle cx="200" cy="200" r="22" fill="${a}"/>
<circle cx="350" cy="200" r="9" fill="${a}"/>
<circle cx="200" cy="90" r="7" fill="${i}" fill-opacity=".6"/>
<circle cx="130" cy="200" r="6" fill="${a}"/>
<circle cx="271" cy="271" r="5" fill="${i}" fill-opacity=".5"/>
</svg>`,
  },
  {
    id: "blocks",
    name: "블록",
    paint: (a, i) => `<svg ${VIEW}>
<path d="M200 60l120 70v140l-120 70-120-70V130z" stroke="${i}" stroke-opacity=".3" stroke-width="1.5"/>
<path d="M200 60v140M200 200l120-70M200 200L80 130" stroke="${i}" stroke-opacity=".3" stroke-width="1.5"/>
<path d="M200 130l60 35v70l-60 35-60-35v-70z" fill="${a}" fill-opacity=".9"/>
<path d="M200 130v70M200 200l60-35M200 200l-60-35" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M260 235l60-35v70l-60 35z" fill="${a}" fill-opacity=".35"/>
<path d="M80 130l60 35v70l-60-35z" fill="${i}" fill-opacity=".18"/>
</svg>`,
  },
  {
    id: "waves",
    name: "물결",
    paint: (a, i) => `<svg ${VIEW}>
<path d="M0 230c60-60 100-60 160 0s100 60 160 0 60-60 80 0" stroke="${a}" stroke-width="3"/>
<path d="M0 270c60-60 100-60 160 0s100 60 160 0 60-60 80 0" stroke="${a}" stroke-opacity=".55" stroke-width="2"/>
<path d="M0 310c60-60 100-60 160 0s100 60 160 0 60-60 80 0" stroke="${i}" stroke-opacity=".3" stroke-width="2"/>
<path d="M0 190c60-60 100-60 160 0s100 60 160 0 60-60 80 0" stroke="${i}" stroke-opacity=".2" stroke-width="2"/>
<circle cx="300" cy="120" r="34" fill="${a}" fill-opacity=".9"/>
</svg>`,
  },
  {
    id: "network",
    name: "연결망",
    paint: (a, i) => `<svg ${VIEW}>
<path d="M80 300L200 110l120 190zM80 300l120 60 120-60M200 110L90 140M200 110l110 30M200 200l-120 100M200 200l120 100M200 200v-90" stroke="${i}" stroke-opacity=".3" stroke-width="1.5"/>
<circle cx="200" cy="200" r="16" fill="${a}"/>
<circle cx="200" cy="110" r="10" fill="${a}"/>
<circle cx="80" cy="300" r="10" fill="${a}" fill-opacity=".8"/>
<circle cx="320" cy="300" r="10" fill="${a}" fill-opacity=".8"/>
<circle cx="200" cy="360" r="8" fill="${i}" fill-opacity=".5"/>
<circle cx="90" cy="140" r="7" fill="${i}" fill-opacity=".5"/>
<circle cx="310" cy="140" r="7" fill="${i}" fill-opacity=".5"/>
</svg>`,
  },
  {
    id: "bars",
    name: "성장",
    paint: (a, i) => `<svg ${VIEW}>
<rect x="60" y="250" width="44" height="90" rx="6" fill="${i}" fill-opacity=".25"/>
<rect x="130" y="210" width="44" height="130" rx="6" fill="${i}" fill-opacity=".35"/>
<rect x="200" y="160" width="44" height="180" rx="6" fill="${a}" fill-opacity=".7"/>
<rect x="270" y="90" width="44" height="250" rx="6" fill="${a}"/>
<path d="M82 220l70-40 70-50 70-70" stroke="${i}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
<circle cx="292" cy="60" r="10" fill="${a}"/>
<path d="M50 340h300" stroke="${i}" stroke-opacity=".4" stroke-width="2"/>
</svg>`,
  },
  {
    id: "mesh",
    name: "격자",
    paint: (a, i) => `<svg ${VIEW}>
<path d="M40 80h320M40 140h320M40 200h320M40 260h320M40 320h320M40 80v240M104 80v240M168 80v240M232 80v240M296 80v240M360 80v240" stroke="${i}" stroke-opacity=".22" stroke-width="1.2"/>
<rect x="168" y="140" width="64" height="60" fill="${a}"/>
<rect x="232" y="200" width="64" height="60" fill="${a}" fill-opacity=".55"/>
<rect x="104" y="200" width="64" height="60" fill="${a}" fill-opacity=".3"/>
<rect x="232" y="80" width="64" height="60" fill="${i}" fill-opacity=".18"/>
<circle cx="168" cy="260" r="8" fill="${a}"/>
</svg>`,
  },
  {
    id: "blob",
    name: "유기체",
    paint: (a, i) => `<svg ${VIEW}>
<path d="M120 90c60-40 150-30 190 30s20 150-40 190-160 40-200-20-10-160 50-200z" fill="${a}" fill-opacity=".85"/>
<path d="M150 150c40-30 100-20 130 20s10 110-30 140-110 30-140-10-0-120 40-150z" fill="#fff" fill-opacity=".14"/>
<circle cx="290" cy="110" r="22" fill="${i}" fill-opacity=".35"/>
<circle cx="90" cy="300" r="12" fill="${i}" fill-opacity=".35"/>
</svg>`,
  },
  {
    id: "target",
    name: "과녁",
    paint: (a, i) => `<svg ${VIEW}>
<circle cx="200" cy="200" r="160" fill="${i}" fill-opacity=".08"/>
<circle cx="200" cy="200" r="120" fill="${a}" fill-opacity=".18"/>
<circle cx="200" cy="200" r="80" fill="${a}" fill-opacity=".45"/>
<circle cx="200" cy="200" r="40" fill="${a}"/>
<path d="M200 200L330 70" stroke="${i}" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>
<path d="M330 70l-40 4M330 70l-4 40" stroke="${i}" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>
</svg>`,
  },
];

export const ILLUSTRATION_IDS = ILLUSTRATIONS.map((x) => x.id);

/** 삽화를 인라인 SVG 로. 모르는 이름이면 빈 문자열. */
export function illustrationSvg(id: string, accent: string, ink: string): string {
  const found = ILLUSTRATIONS.find((x) => x.id === id);
  return found ? found.paint(accent, ink) : "";
}

/**
 * 삽화를 그림 주소(data:)로 — 카드·갤러리의 사진 자리에 넣을 때 쓴다.
 * 브라우저·서버 어디서든 돌도록 base64 대신 URL 인코딩을 쓴다.
 */
export function illustrationDataUrl(id: string, accent: string, ink: string, paper = "#FFFFFF"): string {
  const svg = illustrationSvg(id, accent, ink);
  if (!svg) return "";
  const withBg = svg.replace(`fill="none">`, `fill="none"><rect width="400" height="400" fill="${paper}"/>`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withBg)}`;
}

/**
 * 샘플 사진 — 자리를 채우는 임시 사진. 씨앗이 같으면 늘 같은 사진이 온다.
 * 진짜 사진이 준비되면 바꾸는 자리라는 뜻으로만 쓴다.
 */
export function samplePhoto(seed: string, w = 1200, h = 800): string {
  const clean = String(seed).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || "tenai";
  return `https://picsum.photos/seed/${clean}/${w}/${h}`;
}
