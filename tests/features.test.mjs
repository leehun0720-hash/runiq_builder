/**
 * 레이아웃 · 링크 · 게시판 · 새 구역 · 그림 재료 · 퍼블리싱 검사.
 *
 * builder.test.mjs 가 뼈대(문서 모델·내보내기·안내)를 지키고, 이 파일은 그 위에
 * 얹은 기능들이 약속대로 도는지 본다.
 */
import assert from "node:assert/strict";
import test from "node:test";

const load = (name) => import(new URL(`../lib/builder/${name}.ts`, import.meta.url).href);

const { renderSite, safeHref, youtubeId, richBody, anchorOf, sortPosts } = await load("render");
const { exportHtml, parseAny, serializeDoc } = await load("export");
const { LAYOUT_PRESETS, SECTION_CATALOG, layoutOf, newSection, DEFAULT_THEME } = await load("types");
const { TEMPLATES, blankDoc, starterDoc } = await load("template");
const { ICONS, ICON_IDS, ILLUSTRATIONS, PATTERNS, iconSvg, illustrationSvg, illustrationDataUrl, samplePhoto } = await load("art");
const { buildManifest, publishGuide, agentPrompt, buildBundle, buildWebhookPayload, makeZip, crc32, slug } = await load("publish");
const { HELP_IDS } = await load("help");

/** 구역 몇 개로 된 문서를 빠르게 만든다 */
function docOf(...kinds) {
  const doc = blankDoc();
  doc.sections = kinds.map((k) => newSection(k));
  return doc;
}

/* ── 레이아웃 ─────────────────────────────────────────────── */

test("레이아웃은 여섯 가지이고 모두 그려진다", () => {
  assert.equal(LAYOUT_PRESETS.length, 6);
  assert.equal(new Set(LAYOUT_PRESETS.map((l) => l.id)).size, 6);
  const doc = starterDoc();
  for (const layout of LAYOUT_PRESETS) {
    const html = renderSite({ ...doc, layout: layout.id }, false);
    assert.match(html, new RegExp(`<div class="bf-page" data-layout="${layout.id}">`), `${layout.id} 틀이 없다`);
    // 구역은 어느 레이아웃에서든 전부 살아 있어야 한다
    for (const s of doc.sections) {
      if (!s.hidden) assert.match(html, new RegExp(`data-id="${s.id}"`), `${layout.id} 에서 ${s.name} 이 빠졌다`);
    }
  }
});

test("모르는 레이아웃이나 옛 문서는 기본형으로 선다", () => {
  assert.equal(layoutOf({}), "stack");
  assert.equal(layoutOf({ layout: "없는-것" }), "stack");
  assert.equal(layoutOf({ layout: "portal" }), "portal");
  const legacy = starterDoc();
  delete legacy.layout;
  assert.match(renderSite(legacy), /data-layout="stack"/);
});

test("사이드 메뉴형은 상단 메뉴를 왼쪽 기둥으로 뺀다", () => {
  const doc = { ...docOf("header", "hero", "cards"), layout: "sidebar" };
  const html = renderSite(doc);
  assert.match(html, /<aside class="bf-side">[\s\S]*bf-sec--header[\s\S]*<\/aside>/);
  assert.match(html, /<div class="bf-main">[\s\S]*bf-sec--hero[\s\S]*bf-sec--cards/);
  // 기둥 안에 히어로가 들어가면 안 된다
  const aside = html.match(/<aside class="bf-side">([\s\S]*?)<\/aside>/)[1];
  assert.doesNotMatch(aside, /bf-sec--hero/);
  // 상단 메뉴가 없으면 기둥 없이 그냥 쌓인다
  const noHeader = { ...docOf("hero", "cards"), layout: "sidebar" };
  assert.doesNotMatch(renderSite(noHeader), /bf-side/);
});

test("포털형은 본문 구역을 둘씩 짝짓고 홀로 남은 것은 꽉 채운다", () => {
  // header(full) hero(full) cards steps board(짝 없음) cta(full) footer(full)
  const doc = { ...docOf("header", "hero", "cards", "steps", "board", "cta", "footer"), layout: "portal" };
  const html = renderSite(doc);
  const rows = html.match(/<div class="bf-row">/g) ?? [];
  assert.equal(rows.length, 1, "짝 지은 줄이 하나여야 한다");
  const row = html.match(/<div class="bf-row">([\s\S]*?)<\/div>\n<section/)[1];
  assert.match(row, /bf-sec--cards[^]*data-span="half"/);
  assert.match(row, /bf-sec--steps/);
  assert.doesNotMatch(row, /bf-sec--board/);
  assert.match(html, /bf-sec--board" id="[^"]+" data-id="[^"]+" data-pad="[^"]+" data-scheme="[^"]+" data-span="full"/);
  // 히어로·푸터는 늘 꽉 찬다
  assert.match(html, /bf-sec--hero[^>]*data-span="full"/);
  assert.match(html, /bf-sec--footer[^>]*data-span="full"/);
});

test("박스형은 상자로 감싸고, 내보낸 문서에도 레이아웃이 적힌다", () => {
  const doc = { ...docOf("header", "hero"), layout: "boxed" };
  assert.match(renderSite(doc), /<div class="bf-page" data-layout="boxed"><div class="bf-box">/);
  assert.match(exportHtml(doc), /<html lang="ko" data-layout="boxed">/);
});

test("레이아웃 스타일은 여섯 가지 모두 파일 안에 들어 있다", () => {
  const html = exportHtml(starterDoc());
  for (const id of ["boxed", "sidebar", "centered", "split", "portal"]) {
    assert.match(html, new RegExp(`\\.bf-page\\[data-layout="${id}"\\]`), `${id} 스타일이 없다`);
  }
});

/* ── 링크 · 상단 메뉴 ──────────────────────────────────────── */

test("링크 주소는 안전한 것만 통과한다", () => {
  assert.equal(safeHref("#s-abc"), "#s-abc");
  assert.equal(safeHref("https://tenai.kr"), "https://tenai.kr");
  assert.equal(safeHref("mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(safeHref("tel:02-000-0000"), "tel:02-000-0000");
  assert.equal(safeHref("/about"), "/about");
  assert.equal(safeHref("javascript:alert(1)"), "");
  assert.equal(safeHref("data:text/html,hi"), "");
  assert.equal(safeHref('https://x.y/"><script>'), "https://x.y/script");
});

test("메뉴·단추 링크는 내보낼 때만 <a> 가 되고 편집 중에는 글자다", () => {
  const doc = docOf("header", "hero", "cta", "footer");
  const [header, hero, cta, footer] = doc.sections;
  header.menu = [{ label: "소개", href: anchorOf(hero) }, { label: "바깥", href: "https://tenai.kr" }, { label: "없음" }];
  header.ctaHref = anchorOf(cta);
  hero.primaryHref = "mailto:a@b.c";
  cta.buttonHref = "tel:02-000-0000";
  footer.links = [{ label: "오시는 길", href: anchorOf(cta) }];

  const out = exportHtml(doc);
  assert.match(out, new RegExp(`<a class="bf-menu-item" href="${anchorOf(hero)}">소개</a>`));
  assert.match(out, /<a class="bf-menu-item" href="https:\/\/tenai\.kr" target="_blank" rel="noopener">바깥<\/a>/);
  assert.match(out, /<span class="bf-menu-item">없음<\/span>/);
  assert.match(out, /<a class="bf-btn" href="mailto:a@b\.c">/);
  assert.match(out, /<a class="bf-btn" href="tel:02-000-0000">/);
  assert.match(out, new RegExp(`<a class="bf-foot-link" href="${anchorOf(cta)}">오시는 길</a>`));
  // 닻이 실제로 그 구역에 붙어 있다
  assert.match(out, new RegExp(`id="s-${hero.id}"`));

  const edit = renderSite(doc, true);
  assert.doesNotMatch(edit, /<a class="bf-menu-item"/);
  assert.match(edit, /<span class="bf-menu-item" data-edit="sections\.0\.menu\.0\.label"/);
});

test("상단 메뉴는 좁은 화면 단추와 고정 표시를 갖는다", () => {
  const doc = docOf("header");
  let html = exportHtml(doc);
  assert.match(html, /<input type="checkbox" class="bf-nav-toggle" id="bf-nav-[^"]+" hidden>/);
  assert.match(html, /<label class="bf-burger" for="bf-nav-/);
  assert.doesNotMatch(html, /<section class="bf-sec bf-sec--header"[^>]*data-sticky="1"/);
  doc.sections[0].sticky = true;
  html = exportHtml(doc);
  assert.match(html, /bf-sec--header" id="[^"]+" data-id="[^"]+" data-pad="[^"]+" data-scheme="[^"]+" data-sticky="1"/);
  // 스크립트 없이 CSS 만으로 열리는 규칙이 파일 안에 있다
  assert.match(html, /\.bf-nav:has\(\.bf-nav-toggle:checked\) \.bf-menu\{display:flex/);
});

/* ── 게시판 ─────────────────────────────────────────────── */

test("게시판은 말머리·검색·쪽 나누기·첨부를 갖춘다", () => {
  const doc = docOf("board");
  const board = doc.sections[0];
  board.categories = ["공지", "자료"];
  board.search = true;
  board.pageSize = 2;
  board.posts = [
    { id: "a", title: "보통 글", author: "관리자", date: "2026-09-01", body: "b1", notice: false, category: "자료", link: "https://x.y/f.pdf" },
    { id: "b", title: "공지 글", author: "관리자", date: "2026-09-02", body: "b2", notice: true, category: "공지" },
    { id: "c", title: "셋째", author: "관리자", date: "2026-09-03", body: "b3", notice: false },
  ];
  const html = exportHtml(doc);
  // 도구 줄
  assert.match(html, /<button type="button" class="is-on" data-cat="">전체<\/button><button type="button" data-cat="공지">공지<\/button>/);
  assert.match(html, /<form class="bf-board-search" data-act="search">/);
  // 글 속성
  assert.match(html, /data-post="a" data-body="b1" data-cat="자료" data-link="https:\/\/x\.y\/f\.pdf"/);
  assert.match(html, /<span class="bf-post-clip"/);
  // 공지가 먼저 오고, 한 쪽(2건)을 넘는 글은 숨겨 둔다
  const order = [...html.matchAll(/data-post="([abc])"/g)].map((m) => m[1]);
  assert.deepEqual(order, ["b", "a", "c"]);
  assert.match(html, /data-post="c"[^>]*hidden>/);
  assert.doesNotMatch(html, /data-post="b"[^>]*hidden>/);
  // 글쓰기에 말머리 고르기가 붙는다
  assert.match(html, /<select name="category"><option value="공지">공지<\/option><option value="자료">자료<\/option><\/select>/);
  // 스크립트가 쪽·말머리·검색을 안다
  assert.match(html, /data-pagesize="2"/);
  assert.match(html, /state\.cat/);
  assert.match(html, /bf-board-pages/);
});

test("게시판 편집 화면은 적힌 순서를 지켜 몇 번째 글인지 맞아떨어진다", () => {
  const doc = docOf("board");
  doc.sections[0].posts = [
    { id: "a", title: "보통", author: "x", date: "d", body: "", notice: false },
    { id: "b", title: "공지", author: "x", date: "d", body: "", notice: true },
  ];
  const edit = renderSite(doc, true);
  const order = [...edit.matchAll(/data-post="([ab])"/g)].map((m) => m[1]);
  assert.deepEqual(order, ["a", "b"]);
  assert.match(edit, /data-post="b"[^>]*>\s*<span class="bf-post-badge">공지/);
  assert.match(edit, /data-edit="sections\.0\.posts\.1\.title"/);
  assert.deepEqual(sortPosts([{ notice: false, n: 1 }, { notice: true, n: 2 }]).map((p) => p.n), [2, 1]);
});

test("게시판 모양은 목록형과 카드형이 있다", () => {
  const doc = docOf("board");
  assert.match(exportHtml(doc), /data-style="list"/);
  doc.sections[0].style = "card";
  const html = exportHtml(doc);
  assert.match(html, /data-style="card"/);
  assert.match(html, /\.bf-board\[data-style="card"\] \.bf-posts\{display:grid/);
});

test("게시판 옛 문서(분류·검색 없음)도 그대로 열린다", () => {
  const doc = docOf("board");
  const legacy = { ...doc.sections[0] };
  delete legacy.style;
  delete legacy.categories;
  delete legacy.search;
  legacy.posts = [{ id: "p", title: "t", author: "a", date: "d", body: "b", notice: false }];
  doc.sections = [legacy];
  const html = exportHtml(doc);
  assert.match(html, /data-post="p" data-body="b">/);
  assert.doesNotMatch(html, /<div class="bf-board-tools">/);
});

/* ── 새 구역: FAQ · 문의 폼 · 오시는 길 · 동영상 ─────────────── */

test("구역 목록에 새 구역 넷이 있고 모두 만들어진다", () => {
  const kinds = SECTION_CATALOG.map((c) => c.kind);
  for (const k of ["faq", "contact", "map", "video"]) assert.ok(kinds.includes(k), `${k} 가 목록에 없다`);
  assert.equal(kinds[kinds.length - 1], "footer", "푸터는 맨 끝에 둔다");
});

test("FAQ 는 접히는 문답이고 편집 중에는 모두 펼쳐진다", () => {
  const doc = docOf("faq");
  const out = exportHtml(doc);
  assert.match(out, /<details class="bf-faq-item">\s*<summary><span>상담은 어떻게 신청하나요\?<\/span><\/summary>/);
  assert.doesNotMatch(out, /<details class="bf-faq-item" open>/);
  const edit = renderSite(doc, true);
  assert.match(edit, /<details class="bf-faq-item" open>/);
  assert.match(edit, /data-edit="sections\.0\.items\.0\.a"[^>]*data-multiline="1"/);
});

test("문의 폼은 받을 주소가 없으면 메일로, 있으면 그 주소로 보낸다", () => {
  const doc = docOf("contact");
  const c = doc.sections[0];
  c.email = "hello@tenai.kr";
  c.endpoint = "";
  let html = exportHtml(doc);
  assert.match(html, /<form class="bf-contact-form" action="mailto:hello@tenai\.kr" method="post" enctype="text\/plain">/);
  assert.match(html, /<input name="name" required/);
  assert.match(html, /<textarea name="message"/);
  c.endpoint = "https://formspree.io/f/abc";
  html = exportHtml(doc);
  assert.match(html, /<form class="bf-contact-form" action="https:\/\/formspree\.io\/f\/abc" method="post">/);
  // 위험한 주소는 버린다
  c.endpoint = "javascript:alert(1)";
  c.email = "";
  html = exportHtml(doc);
  assert.match(html, /<form class="bf-contact-form">/);
  // 빈 연락처 줄은 내보낼 때 빠지고, 편집 중에는 채울 자리로 남는다
  c.phone = "";
  assert.doesNotMatch(exportHtml(doc), /<dt>전화<\/dt>/);
  assert.match(renderSite(doc, true), /<dt>전화<\/dt>/);
});

test("오시는 길은 내보낼 때만 지도를 부르고 주소를 찾는다", () => {
  const doc = docOf("map");
  const m = doc.sections[0];
  m.address = "서울 서초구 서초동 1604-19";
  m.height = 5000;
  const out = exportHtml(doc);
  assert.match(out, /<iframe class="bf-map-frame" style="height:720px" src="https:\/\/www\.google\.com\/maps\?q=%EC%84%9C%EC%9A%B8/);
  assert.match(out, /지하철 —/);
  const edit = renderSite(doc, true);
  assert.doesNotMatch(edit, /<iframe/);
  assert.match(edit, /bf-map-ph/);
  // 검색어가 따로 있으면 그것으로 찾는다
  m.query = "텐에이아이";
  assert.match(exportHtml(doc), new RegExp(`maps\\?q=${encodeURIComponent("텐에이아이")}&amp;output=embed`));
  // 주소가 비면 지도 대신 안내
  m.query = "";
  m.address = "";
  assert.doesNotMatch(exportHtml(doc), /<iframe/);
});

test("유튜브 주소는 어느 형태든 영상 id 를 찾고, 편집 중에는 썸네일만 보인다", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ",
    "dQw4w9WgXcQ",
  ]) {
    assert.equal(youtubeId(url), "dQw4w9WgXcQ", url);
  }
  assert.equal(youtubeId("https://vimeo.com/123"), "");
  assert.equal(youtubeId(""), "");
  const doc = docOf("video");
  doc.sections[0].url = "https://youtu.be/dQw4w9WgXcQ";
  assert.match(exportHtml(doc), /<iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ"/);
  const edit = renderSite(doc, true);
  assert.doesNotMatch(edit, /<iframe/);
  assert.match(edit, /img\.youtube\.com\/vi\/dQw4w9WgXcQ\/hqdefault\.jpg/);
  doc.sections[0].url = "";
  assert.match(exportHtml(doc), /유튜브 주소를 붙여 넣으십시오/);
});

test("글 구역 본문은 문단·소제목·목록을 안다", () => {
  const html = richBody("첫 문단\n둘째 줄\n\n## 소제목\n\n- 하나\n- 둘\n\n마지막 <b>");
  assert.equal(html, "<p>첫 문단<br>둘째 줄</p><h3>소제목</h3><ul><li>하나</li><li>둘</li></ul><p>마지막 &lt;b&gt;</p>");
  assert.equal(richBody(""), "");
  // 편집 중에는 여러 줄 표시가 붙는다
  assert.match(renderSite(docOf("rich"), true), /class="bf-body" data-edit="sections\.0\.body"[^>]*data-multiline="1"/);
});

/* ── 그림 재료 ────────────────────────────────────────────── */

test("아이콘·삽화·무늬는 이름이 겹치지 않고 모두 그려진다", () => {
  assert.ok(ICON_IDS.length >= 40, "아이콘이 너무 적다");
  for (const id of ICON_IDS) {
    assert.ok(ICONS[id].name.trim().length > 0, `${id} 이름이 없다`);
    assert.match(iconSvg(id), /^<svg class="bf-icon" viewBox="0 0 24 24"[^>]*><path d="[^"]+"\/><\/svg>$/, `${id} 가 그려지지 않는다`);
  }
  assert.equal(iconSvg("없는-것"), "");
  assert.ok(ILLUSTRATIONS.length >= 8);
  for (const art of ILLUSTRATIONS) {
    const svg = illustrationSvg(art.id, "#0570DE", "#0A2540");
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 400 400"/, art.id);
    assert.match(svg, /#0570DE/, `${art.id} 가 강조색을 쓰지 않는다`);
    assert.match(illustrationDataUrl(art.id, "#0570DE", "#0A2540"), /^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
  }
  assert.equal(illustrationSvg("없는-것", "#000", "#000"), "");
  assert.equal(new Set(PATTERNS.map((p) => p.id)).size, PATTERNS.length);
  assert.equal(PATTERNS[0].id, "none");
  // 샘플 사진은 씨앗이 같으면 같은 주소, 이상한 씨앗은 걸러진다
  assert.equal(samplePhoto("abc"), samplePhoto("abc"));
  assert.match(samplePhoto("이상한/씨앗"), /^https:\/\/picsum\.photos\/seed\/tenai\/1200\/800$/);
});

test("카드·단계 아이콘, 히어로 삽화, 구역 무늬가 결과물에 실린다", () => {
  const doc = docOf("hero", "cards", "steps");
  const [hero, cards, steps] = doc.sections;
  hero.art = "orbits";
  cards.cards[0].icon = "book";
  cards.cards[1].icon = "없는-것";
  cards.pattern = "dots";
  steps.steps[0].icon = "search";
  steps.pattern = "없는-무늬";
  const html = exportHtml(doc);
  assert.match(html, /<div class="bf-art" aria-hidden="true"><svg/);
  assert.match(html, /<span class="bf-card-icon"><svg class="bf-icon"/);
  assert.equal((html.match(/<span class="bf-card-icon">/g) ?? []).length, 1, "모르는 아이콘은 그리지 않는다");
  assert.match(html, /<span class="bf-step-icon"><svg class="bf-icon"/);
  assert.match(html, /bf-sec--cards[^>]*data-pattern="dots"/);
  assert.doesNotMatch(html, /data-pattern="없는-무늬"/);
  // 어두운 바탕 히어로의 삽화는 흰색으로 그린다
  assert.match(html, /<div class="bf-art"[^]*?#FFFFFF/);
  // 삽화가 없으면 아무것도 붙지 않는다
  hero.art = undefined;
  assert.doesNotMatch(exportHtml(doc), /<div class="bf-art"/);
});

/* ── 내보내기 · 퍼블리싱 ──────────────────────────────────── */

test("내보낸 파일은 소개·아이콘을 머리에 적고 작업 문서를 안에 심는다", () => {
  const doc = docOf("hero");
  doc.title = "검사 사이트";
  doc.description = "한 줄 소개 <b>";
  doc.favicon = "data:image/png;base64,AAAA";
  const html = exportHtml(doc);
  assert.match(html, /<meta name="description" content="한 줄 소개 &lt;b&gt;">/);
  assert.match(html, /<meta property="og:title" content="검사 사이트">/);
  assert.match(html, /<link rel="icon" href="data:image\/png;base64,AAAA">/);
  assert.match(html, /<script type="application\/json" id="bf-doc">\{"version":1/);
  assert.match(html, /html\{scroll-behavior:smooth\}/);
  // 심지 않을 수도 있다
  assert.doesNotMatch(exportHtml(doc, { embedDoc: false }), /id="bf-doc"/);
  // 위험한 파비콘 주소는 버린다
  doc.favicon = "javascript:alert(1)";
  assert.doesNotMatch(exportHtml(doc), /rel="icon"/);
});

test("내보낸 HTML 을 다시 불러오면 같은 문서가 나온다 — 글 속 </script> 도 견딘다", () => {
  const doc = starterDoc();
  doc.sections[1].title = "닫는 태그 </script> 시험";
  const html = exportHtml(doc);
  const back = parseAny(html);
  assert.ok(back, "HTML 에서 문서를 꺼내지 못했다");
  assert.equal(back.sections.length, doc.sections.length);
  assert.equal(back.sections[1].title, "닫는 태그 </script> 시험");
  assert.equal(back.layout, doc.layout);
  // 심어 둔 JSON 에는 < 가 하나도 없다 — 글 속 태그가 스크립트를 닫거나 태그로 읽힐 수 없다
  const embedded = html.match(/<script type="application\/json" id="bf-doc">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(embedded, /</);
  assert.match(embedded, /\\u003c\/script>/);
  // JSON 도, 아무 글도 그대로
  assert.equal(parseAny(serializeDoc(doc)).title, doc.title);
  assert.equal(parseAny("<html><body>남의 파일</body></html>"), null);
});

test("퍼블리싱 요약은 구조를 말하고 안내는 에이전트가 지킬 것을 적는다", () => {
  const doc = starterDoc();
  const manifest = buildManifest(doc, "https://runiq-builder.vercel.app");
  assert.equal(manifest.version, 1);
  assert.equal(manifest.title, doc.title);
  assert.equal(manifest.layout, "stack");
  assert.equal(manifest.sections.length, doc.sections.length);
  assert.ok(manifest.features.board && manifest.features.contactForm && manifest.features.map);
  assert.equal(manifest.builder.reopen, "https://runiq-builder.vercel.app/builder");
  assert.deepEqual(
    manifest.files.map((f) => f.name),
    ["index.html", "site.json", "manifest.json", "PUBLISH.md", "vercel.json"],
  );
  const guide = publishGuide(doc, manifest);
  for (const needle of ["index.html", "site.json", "PUBLISH.md", "Vercel", "GitHub Pages", "bf-doc", "빌드하지 말고", "게시판", "문의 폼"]) {
    assert.ok(guide.includes(needle), `안내에 「${needle}」가 없다`);
  }
  const prompt = agentPrompt(doc, manifest);
  assert.ok(prompt.includes("index.html") && prompt.includes("site.json") && prompt.includes(slug(doc.title)));
  assert.equal(slug("TEN AI 소개!"), "ten-ai");
  assert.equal(slug("한글만"), "site");
});

test("배포 꾸러미는 다섯 파일이 든 올바른 ZIP 이다", () => {
  const doc = starterDoc();
  const { files } = buildBundle(doc, "");
  assert.equal(files.length, 5);
  assert.match(files.find((f) => f.name === "index.html").data, /^<!DOCTYPE html>/);
  assert.equal(JSON.parse(files.find((f) => f.name === "site.json").data).title, doc.title);
  assert.equal(JSON.parse(files.find((f) => f.name === "manifest.json").data).generator, "TEN AI SITE BUILDER (tenai.kr)");

  // CRC32 표준 값 ("123456789" → CBF43926)
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);

  const zip = makeZip(files, new Date(2026, 8, 15, 12, 0, 0));
  const u32 = (at) => zip[at] | (zip[at + 1] << 8) | (zip[at + 2] << 16) | ((zip[at + 3] << 24) >>> 0);
  assert.equal(u32(0), 0x04034b50, "로컬 파일 머리표");
  // 끝 기록: 마지막 22바이트
  const end = zip.length - 22;
  assert.equal(u32(end), 0x06054b50, "중앙 디렉터리 끝 표시");
  assert.equal(zip[end + 10] | (zip[end + 11] << 8), 5, "파일 수");
  // 첫 항목의 이름과 크기가 맞는다
  const nameLen = zip[26] | (zip[27] << 8);
  assert.equal(new TextDecoder().decode(zip.slice(30, 30 + nameLen)), "index.html");
  assert.equal(u32(22), new TextEncoder().encode(files[0].data).length, "압축 없는 크기");
  // 웹훅 꾸러미는 파일 이름을 열쇠로 둔다
  const payload = buildWebhookPayload(doc, "");
  assert.equal(payload.type, "tenai-site-publish");
  assert.ok(payload.files["index.html"].startsWith("<!DOCTYPE html>"));
});

/* ── 템플릿 · 안내 ────────────────────────────────────────── */

test("템플릿마다 레이아웃이 정해져 있고 메뉴가 실제 구역으로 이어진다", () => {
  const seen = new Set();
  for (const entry of TEMPLATES) {
    const doc = entry.build();
    assert.ok(LAYOUT_PRESETS.some((l) => l.id === doc.layout), `${entry.id} 에 레이아웃이 없다`);
    seen.add(doc.layout);
    if (entry.id === "blank") continue;
    const header = doc.sections.find((s) => s.kind === "header");
    const anchors = new Set(doc.sections.map(anchorOf));
    for (const m of header.menu) {
      assert.ok(m.href && anchors.has(m.href), `${entry.id} 메뉴 「${m.label}」가 구역으로 이어지지 않는다`);
    }
    assert.ok(header.sticky, `${entry.id} 상단 메뉴가 고정되지 않았다`);
    assert.ok(header.ctaHref && anchors.has(header.ctaHref), `${entry.id} 오른쪽 단추가 이어지지 않는다`);
    for (const k of ["faq", "contact"]) assert.ok(doc.sections.some((s) => s.kind === k), `${entry.id} 에 ${k} 가 없다`);
    const hero = doc.sections.find((s) => s.kind === "hero");
    assert.ok(hero.art, `${entry.id} 히어로에 삽화가 없다`);
    const cards = doc.sections.find((s) => s.kind === "cards");
    if (cards) assert.ok(cards.cards.every((c) => c.icon && ICONS[c.icon]), `${entry.id} 카드 아이콘이 빠지거나 틀렸다`);
    // 내보내도 링크가 죽지 않는다
    const html = exportHtml(doc);
    for (const m of header.menu) assert.match(html, new RegExp(`id="s-${m.href.slice(3)}"`));
  }
  assert.ok(seen.size >= 5, "템플릿들이 서로 다른 레이아웃을 보여 주어야 한다");
});

test("새 탭과 퍼블리시에도 안내가 있다", () => {
  for (const id of ["tab-layout", "tab-settings", "publish"]) assert.ok(HELP_IDS.includes(id), `${id} 안내가 없다`);
});

test("기본 테마로 그린 새 구역들은 편집 표시 없이 내보내진다", () => {
  const doc = docOf("faq", "contact", "map", "video", "board");
  doc.theme = { ...DEFAULT_THEME };
  const html = exportHtml(doc);
  assert.doesNotMatch(html, /data-edit=/);
  assert.doesNotMatch(html, /contenteditable/);
});
