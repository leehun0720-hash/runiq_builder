/**
 * 홈페이지 빌더 — 퍼블리싱 꾸러미.
 *
 * 만든 사이트를 「올릴 수 있는 형태」로 묶는다. 사람이 직접 올려도 되고,
 * AI 에이전트(Claude Code 등)에게 폴더째 건네도 된다. 그래서 꾸러미 안에
 * 사람이 읽는 안내(PUBLISH.md)와 기계가 읽는 요약(manifest.json)을 함께 넣는다.
 *
 *  index.html    사이트 그 자체 — 이 파일 하나만 올려도 뜬다
 *  site.json     작업 문서 — 빌더에 다시 불러와 고칠 수 있다
 *  manifest.json 구조 요약 — 에이전트가 무엇이 있는지 한눈에 본다
 *  PUBLISH.md    배포 지시문 — 에이전트에게 그대로 건네면 된다
 *  vercel.json   정적 사이트 배포 설정 (Vercel)
 *
 * ZIP 은 압축 없이(store) 묶는다 — 바깥 라이브러리 없이 60줄이면 되고,
 * 파일이 몇 개 안 되므로 압축의 값이 없다.
 */

import { BRAND, GENERATOR } from "./brand";
import { exportHtml, serializeDoc } from "./export";
import { LAYOUT_PRESETS, SECTION_CATALOG, layoutOf, type SiteDoc } from "./types";

export type Manifest = {
  generator: string;
  version: 1;
  exportedAt: string;
  title: string;
  description: string;
  layout: string;
  layoutName: string;
  theme: { accent: string; heading: string };
  sections: { id: string; kind: string; kindName: string; name: string; title?: string; hidden: boolean; anchor: string }[];
  features: { board: boolean; contactForm: boolean; map: boolean; video: boolean; embeddedImages: number };
  files: { name: string; role: string }[];
  builder: { site: string; reopen: string };
};

/** 문서에 실린 data: 그림 수 — 파일 크기의 대부분을 차지하므로 알려 준다 */
function countEmbeddedImages(doc: SiteDoc): number {
  return (JSON.stringify(doc).match(/data:image\//g) ?? []).length;
}

export function buildManifest(doc: SiteDoc, builderUrl: string): Manifest {
  const layout = layoutOf(doc);
  const kindName = (kind: string) => SECTION_CATALOG.find((c) => c.kind === kind)?.name ?? kind;
  return {
    generator: GENERATOR,
    version: 1,
    exportedAt: new Date().toISOString(),
    title: doc.title,
    description: doc.description ?? "",
    layout,
    layoutName: LAYOUT_PRESETS.find((l) => l.id === layout)?.name ?? layout,
    theme: { accent: doc.theme.accent, heading: doc.theme.heading },
    sections: doc.sections.map((s) => ({
      id: s.id,
      kind: s.kind,
      kindName: kindName(s.kind),
      name: s.name,
      title: "title" in s ? (s as { title?: string }).title : undefined,
      hidden: !!s.hidden,
      anchor: `#s-${s.id}`,
    })),
    features: {
      board: doc.sections.some((s) => s.kind === "board" && !s.hidden),
      contactForm: doc.sections.some((s) => s.kind === "contact" && !s.hidden),
      map: doc.sections.some((s) => s.kind === "map" && !s.hidden),
      video: doc.sections.some((s) => s.kind === "video" && !s.hidden),
      embeddedImages: countEmbeddedImages(doc),
    },
    files: [
      { name: "index.html", role: "site — 이 파일 하나로 사이트가 뜬다 (작업 문서가 안에 심겨 있다)" },
      { name: "site.json", role: "빌더 작업 문서 — 다시 불러와 편집" },
      { name: "manifest.json", role: "이 요약" },
      { name: "PUBLISH.md", role: "배포 지시문 (사람·AI 에이전트 공용)" },
      { name: "vercel.json", role: "Vercel 정적 배포 설정" },
    ],
    builder: { site: BRAND.siteHref, reopen: `${builderUrl || ""}/builder` },
  };
}

/**
 * AI 에이전트에게 그대로 건네는 지시문.
 *
 * 에이전트가 무엇을 받았고, 무엇을 하면 되고, 무엇을 하면 안 되는지를 한 장에
 * 적는다. 사람이 읽어도 그대로 따라 할 수 있게 쓴다.
 */
export function publishGuide(doc: SiteDoc, manifest: Manifest): string {
  const sectionLines = manifest.sections
    .map((s) => `| ${s.kindName} | ${s.name}${s.title ? ` — ${s.title}` : ""} | \`${s.anchor}\` |${s.hidden ? " (숨김)" : ""}`)
    .join("\n");
  const notes: string[] = [];
  if (manifest.features.board)
    notes.push(
      "- **게시판**: 서버 없이 동작합니다. 빌더에서 넣은 글은 모두에게 보이고, 방문자가 새로 쓴 글은 그 사람 브라우저(localStorage)에만 남습니다. 여러 사람이 함께 쓰는 게시판이 필요하면 백엔드(DB + API)를 붙이고 `index.html` 의 게시판 스크립트가 그 API 를 부르도록 바꾸십시오."
    );
  if (manifest.features.contactForm)
    notes.push(
      "- **문의 폼**: 「받을 주소(endpoint)」가 비어 있으면 `mailto:` 로 방문자의 메일 프로그램이 열립니다. 서버에서 받으려면 Formspree·Getform 같은 서비스 주소나 자체 API 주소를 `site.json` 의 contact 구역 `endpoint` 에 넣고 다시 내보내십시오."
    );
  if (manifest.features.map) notes.push("- **지도**: Google Maps 임베드를 씁니다. API 키가 필요 없고, 주소로 검색합니다.");
  if (manifest.features.video) notes.push("- **동영상**: youtube-nocookie.com 임베드입니다.");
  if (manifest.features.embeddedImages > 0)
    notes.push(
      `- **그림 ${manifest.features.embeddedImages}장**이 data: 주소로 파일 안에 들어 있습니다. 파일이 크다고 느껴지면 그림을 \`images/\` 폴더로 빼고 \`src\`/\`background-image\` 를 상대 경로로 바꾸어도 됩니다.`
    );

  return `# ${doc.title} — 배포 안내

이 폴더는 **${GENERATOR}** 로 만든 정적 웹사이트입니다.
${manifest.exportedAt.slice(0, 10)} 에 내보냈고, 레이아웃은 「${manifest.layoutName}」입니다.

## 무엇이 들어 있나

| 파일 | 역할 |
| --- | --- |
${manifest.files.map((f) => `| \`${f.name}\` | ${f.role} |`).join("\n")}

**\`index.html\` 하나만 올려도 사이트가 뜹니다.** 서버 코드·데이터베이스·환경변수·빌드 단계가 전혀 없습니다.

## AI 에이전트에게 (Claude Code · 기타 코딩 에이전트)

이 폴더를 통째로 건네고 아래 가운데 하나를 말하면 됩니다.

\`\`\`
이 폴더의 index.html 을 Vercel 에 정적 사이트로 배포해줘. 프로젝트 이름은 "${slug(doc.title)}".
\`\`\`
\`\`\`
이 폴더를 GitHub 저장소 <계정>/<저장소> 에 올리고 GitHub Pages 로 공개해줘.
\`\`\`
\`\`\`
index.html 의 히어로 제목을 "…" 로 바꾸고 다시 배포해줘. (site.json 도 같이 고쳐줘)
\`\`\`

에이전트가 지켜야 할 것:

1. **\`index.html\` 은 완성본**입니다. 빌드하지 말고 그대로 올리십시오. (프레임워크 없음, Output Directory = 이 폴더)
2. 내용을 고칠 때는 \`site.json\` 을 함께 고쳐 두십시오. 그래야 빌더(${manifest.builder.reopen})에서 「불러오기」로 다시 열립니다. \`index.html\` 안에도 같은 문서가 \`<script type="application/json" id="bf-doc">\` 로 심겨 있으니 그것도 같은 값으로 맞추십시오.
3. 스타일은 \`<style>\` 안에 전부 들어 있습니다. 외부 CSS·JS 를 더하지 마십시오(글꼴 링크만 예외).
4. 도메인을 붙일 때는 배포 서비스의 Domains 설정에서 합니다. 코드에 주소가 박혀 있지 않습니다.

## 사람이 직접 올릴 때

| 방법 | 순서 |
| --- | --- |
| **Vercel** | vercel.com → Add New → Project → 이 폴더를 끌어다 놓기 (또는 \`npx vercel --prod\`) |
| **Netlify** | app.netlify.com/drop 에 이 폴더를 끌어다 놓기 |
| **GitHub Pages** | 저장소에 올리고 Settings → Pages → Branch: main / (root) |
| **기존 웹호스팅** | FTP 로 \`index.html\` 을 public_html(또는 www) 폴더에 복사 |

## 사이트 구조

| 구역 | 이름 | 닻(anchor) |
| --- | --- | --- |
${sectionLines}

메뉴는 \`#s-아이디\` 닻으로 같은 페이지 안의 구역으로 내려갑니다.

## 알아 둘 것
${notes.length ? notes.join("\n") : "- 특별히 없습니다."}

## 다시 편집하려면

${manifest.builder.reopen} 을 열고 「불러오기」에 \`site.json\` (또는 \`index.html\`) 을 넣으십시오.
브라우저 안에서만 도는 도구라 로그인이 없습니다.

---
${BRAND.companyFull} · ${BRAND.email} · ${BRAND.siteHref}
`;
}

/** 에이전트 채팅창에 붙여 넣는 한 문단 — 꾸러미 없이 말로만 건넬 때 */
export function agentPrompt(doc: SiteDoc, manifest: Manifest): string {
  return `아래는 ${GENERATOR} 로 만든 정적 웹사이트 배포 꾸러미(ZIP)입니다. index.html 하나로 완성된 사이트이며 빌드 단계가 없습니다.

할 일: 이 꾸러미를 풀어 Vercel(또는 Netlify·GitHub Pages)에 정적 사이트로 배포하고 공개 주소를 알려 주세요. 프로젝트 이름은 "${slug(doc.title)}".
지킬 것: (1) index.html 을 그대로 올릴 것 — 프레임워크 없음, 빌드 없음. (2) 내용을 고치면 site.json 과 index.html 안의 <script id="bf-doc"> JSON 도 같이 고칠 것. (3) 외부 스크립트를 더하지 말 것.

사이트: ${doc.title}${doc.description ? ` — ${doc.description}` : ""}
레이아웃: ${manifest.layoutName} · 구역 ${manifest.sections.filter((s) => !s.hidden).length}개 (${manifest.sections
    .filter((s) => !s.hidden)
    .map((s) => s.kindName)
    .join(", ")})
자세한 안내는 꾸러미 안 PUBLISH.md 에 있습니다.`;
}

/** 주소·프로젝트 이름에 쓸 수 있는 꼴로 — 한글은 남기지 않는다 */
export function slug(title: string): string {
  const s = (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "site";
}

export type BundleFile = { name: string; data: string };

/** 꾸러미에 들어갈 파일들 — ZIP 으로 묶기 전의 모습 */
export function buildBundle(doc: SiteDoc, builderUrl: string): { manifest: Manifest; files: BundleFile[] } {
  const manifest = buildManifest(doc, builderUrl);
  const files: BundleFile[] = [
    { name: "index.html", data: exportHtml(doc) },
    { name: "site.json", data: serializeDoc(doc) },
    { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
    { name: "PUBLISH.md", data: publishGuide(doc, manifest) },
    {
      name: "vercel.json",
      data: JSON.stringify({ cleanUrls: true, trailingSlash: false, headers: [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] }] }, null, 2),
    },
  ];
  return { manifest, files };
}

/**
 * 연동 주소(웹훅)로 보낼 꾸러미 — ZIP 대신 JSON 한 덩어리.
 * 받는 쪽(자체 서버·n8n·Make·에이전트)이 파일을 꺼내 쓰기 쉽도록 파일 이름을 열쇠로 둔다.
 */
export function buildWebhookPayload(doc: SiteDoc, builderUrl: string): Record<string, unknown> {
  const { manifest, files } = buildBundle(doc, builderUrl);
  return {
    type: "tenai-site-publish",
    generator: GENERATOR,
    title: doc.title,
    manifest,
    files: Object.fromEntries(files.map((f) => [f.name, f.data])),
  };
}

/* ── ZIP (store) ─────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** 파일 목록 → ZIP 바이트. 압축은 하지 않는다(store). 이름은 UTF-8. */
export function makeZip(files: BundleFile[], now = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const { time, date } = dosTime(now);
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff];
  const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

  for (const file of files) {
    const name = enc.encode(file.name);
    const data = enc.encode(file.data);
    const crc = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(time), ...u16(date),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
    ]);
    const entry = new Uint8Array(local.length + name.length + data.length);
    entry.set(local, 0);
    entry.set(name, local.length);
    entry.set(data, local.length + name.length);
    locals.push(entry);

    const central = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(time), ...u16(date),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
    ]);
    const cEntry = new Uint8Array(central.length + name.length);
    cEntry.set(central, 0);
    cEntry.set(name, central.length);
    centrals.push(cEntry);
    offset += entry.length;
  }

  const cdSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0),
  ]);

  const out = new Uint8Array(offset + cdSize + end.length);
  let pos = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}
