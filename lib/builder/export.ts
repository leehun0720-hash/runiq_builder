/**
 * 홈페이지 빌더 — 내보내기.
 *
 * 만든 사이트를 파일 하나(HTML)로 뽑는다. 그 파일만 있으면 어디에 올려도
 * 그대로 뜬다 — 빌더가 없어도 결과물이 남아야 도구로서 값을 한다.
 *
 * 미리보기도 같은 함수를 쓴다. 미리보기에서 본 것과 내려받은 파일이
 * 한 글자도 다르지 않아야 한다.
 *
 * 내보낸 HTML 안에는 작업 문서(JSON)도 함께 심는다. 그래서 HTML 파일 하나를
 * 「불러오기」에 넣으면 다시 편집할 수 있고, AI 에이전트가 파일을 받아도
 * 구역 구조를 그대로 읽어 손볼 수 있다.
 */

import { GENERATOR } from "./brand";
import { BUILDER_CSS, escapeHtml, hasBoard, renderSite, safeUrl, themeVars } from "./render";
import { layoutOf, type SiteDoc } from "./types";

/**
 * 게시판 동작 — 내보낸 문서 안에서 홀로 돌아간다.
 *
 * 서버가 없으므로 글은 보는 사람의 브라우저에 남는다. 문서에 심어 둔 글은
 * 씨앗으로 두고, 새로 쓴 글을 앞에 얹는 방식이라 원본이 지워지지 않는다.
 * 말머리 고르기·검색·쪽 나누기도 여기서 한다.
 */
const BOARD_SCRIPT = String.raw`
(function () {
  function store(key) {
    try {
      var raw = localStorage.getItem("bf-board-" + key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function save(key, list) {
    try { localStorage.setItem("bf-board-" + key, JSON.stringify(list)); } catch (e) {}
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function today() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function text(el, sel) { var n = el.querySelector(sel); return n ? n.textContent : ""; }

  Array.prototype.forEach.call(document.querySelectorAll("[data-board]"), function (root) {
    var key = root.getAttribute("data-board");
    var canWrite = root.getAttribute("data-write") === "1";
    var pageSize = Math.max(1, parseInt(root.getAttribute("data-pagesize"), 10) || 8);
    // 문서에 심어 둔 글 = 씨앗. 방문자가 쓴 글은 저장소에만 쌓이고 위에 얹힌다.
    var seeds = Array.prototype.map.call(root.querySelectorAll(".bf-posts .bf-post"), function (li) {
      return {
        id: li.getAttribute("data-post"),
        title: text(li, ".bf-post-title"),
        author: text(li, ".bf-post-author"),
        date: text(li, ".bf-post-date"),
        body: li.getAttribute("data-body") || "",
        category: li.getAttribute("data-cat") || "",
        link: li.getAttribute("data-link") || "",
        notice: text(li, ".bf-post-badge").trim() === "공지",
        seed: true
      };
    });
    var views = {};
    Array.prototype.forEach.call(root.querySelectorAll("[data-view]"), function (v) {
      views[v.getAttribute("data-view")] = v;
    });
    var listEl = root.querySelector(".bf-posts");
    var countEl = root.querySelector(".bf-board-count");
    var pagesEl = root.querySelector(".bf-board-pages");
    var catsEl = root.querySelector(".bf-board-cats");
    var searchEl = root.querySelector('[data-act="search"]');
    var state = { page: 1, cat: "", q: "" };
    var current = null;

    function all() {
      var list = store(key).concat(seeds);
      // 공지가 먼저 — 화면에 심어 둔 순서와 같다
      return list.filter(function (p) { return p.notice; }).concat(list.filter(function (p) { return !p.notice; }));
    }
    function filtered() {
      var q = state.q.toLowerCase();
      return all().filter(function (p) {
        if (state.cat && p.category !== state.cat) return false;
        if (q && (p.title + " " + p.body).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
    }
    function show(name) {
      Object.keys(views).forEach(function (n) { views[n].hidden = n !== name; });
    }
    function paint() {
      var posts = filtered();
      var total = all().length;
      var pages = Math.max(1, Math.ceil(posts.length / pageSize));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * pageSize;
      var slice = posts.slice(start, start + pageSize);
      listEl.innerHTML = slice.map(function (p, i) {
        var no = p.notice ? "공지" : (posts.length - start - i);
        return '<li class="bf-post" data-id="' + esc(p.id) + '">' +
          '<span class="bf-post-badge">' + no + "</span>" +
          '<span class="bf-post-main">' +
            (p.category ? '<span class="bf-post-cat">' + esc(p.category) + "</span>" : "") +
            '<span class="bf-post-title">' + esc(p.title) + "</span>" +
            (p.link ? '<span class="bf-post-clip" aria-label="첨부">📎</span>' : "") +
          "</span>" +
          '<span class="bf-post-author">' + esc(p.author) + "</span>" +
          '<span class="bf-post-date">' + esc(p.date) + "</span></li>";
      }).join("") || '<li class="bf-post bf-post--empty"><span class="bf-post-main"><span class="bf-post-title">' +
        (state.q || state.cat ? "찾는 글이 없습니다" : "아직 글이 없습니다") + "</span></span></li>";
      if (countEl) countEl.textContent = "전체 " + total + "건" + (posts.length !== total ? " · 찾음 " + posts.length + "건" : "");
      if (pagesEl) {
        var html = "";
        if (pages > 1) {
          for (var n = 1; n <= pages; n += 1) {
            html += '<button type="button" data-page="' + n + '"' + (n === state.page ? ' class="is-on"' : "") + ">" + n + "</button>";
          }
        }
        pagesEl.innerHTML = html;
      }
    }

    listEl.addEventListener("click", function (e) {
      var li = e.target.closest(".bf-post");
      if (!li || !li.getAttribute("data-id")) return;
      var id = li.getAttribute("data-id");
      var post = all().filter(function (p) { return p.id === id; })[0];
      if (!post) return;
      current = post;
      views.read.querySelector(".bf-read-cat").textContent = post.category || "";
      views.read.querySelector(".bf-read-title").textContent = post.title;
      views.read.querySelector(".bf-read-meta").textContent = post.author + " · " + post.date;
      views.read.querySelector(".bf-read-body").textContent = post.body || "(내용이 없습니다)";
      var linkWrap = views.read.querySelector(".bf-read-link");
      if (linkWrap) {
        linkWrap.hidden = !post.link;
        var a = linkWrap.querySelector("a");
        if (a) a.href = post.link || "#";
      }
      var del = views.read.querySelector('[data-act="del"]');
      if (del) del.hidden = !!post.seed || !canWrite;
      show("read");
    });

    if (pagesEl) pagesEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-page]");
      if (!b) return;
      state.page = parseInt(b.getAttribute("data-page"), 10) || 1;
      paint();
    });
    if (catsEl) catsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      state.cat = b.getAttribute("data-cat") || "";
      state.page = 1;
      Array.prototype.forEach.call(catsEl.querySelectorAll("button"), function (x) { x.classList.toggle("is-on", x === b); });
      paint(); show("list");
    });
    if (searchEl) searchEl.addEventListener("submit", function (e) {
      e.preventDefault();
      state.q = String(new FormData(searchEl).get("q") || "").trim();
      state.page = 1;
      paint(); show("list");
    });

    root.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (!act) return;
      if (act === "new") { views.write.reset(); show("write"); }
      if (act === "back") { paint(); show("list"); }
      if (act === "del" && current) {
        if (!confirm("이 글을 삭제할까요?")) return;
        save(key, store(key).filter(function (p) { return p.id !== current.id; }));
        paint(); show("list");
      }
    });

    if (views.write) {
      views.write.addEventListener("submit", function (e) {
        e.preventDefault();
        var f = new FormData(views.write);
        var title = String(f.get("title") || "").trim();
        var author = String(f.get("author") || "").trim();
        var body = String(f.get("body") || "").trim();
        var category = String(f.get("category") || "").trim();
        if (!title || !author || !body) return;
        var list = store(key);
        list.unshift({
          id: "p" + Date.now().toString(36),
          title: title, author: author, body: body, date: today(), notice: false, category: category, link: ""
        });
        save(key, list);
        state.page = 1; state.q = ""; state.cat = "";
        if (catsEl) Array.prototype.forEach.call(catsEl.querySelectorAll("button"), function (x, i) { x.classList.toggle("is-on", i === 0); });
        paint(); show("list");
      });
    }

    paint();
  });
})();
`.trim();

export type ExportOptions = {
  includeFontLink?: boolean;
  /** 작업 문서(JSON)를 HTML 안에 심는다 — 그 파일을 다시 불러와 편집할 수 있다 */
  embedDoc?: boolean;
};

/** HTML 안에 심는 문서 표식 — 불러오기가 이 id 를 찾는다 */
export const EMBED_ID = "bf-doc";

/** 문서 → 혼자 서는 HTML 한 장 */
export function exportHtml(doc: SiteDoc, options: ExportOptions = {}): string {
  const { includeFontLink = true, embedDoc = true } = options;
  const body = renderSite(doc, false);
  /**
   * 웹폰트는 글을 막지 않고 뒤따라 온다.
   * 그냥 stylesheet로 걸면 폰트 서버가 느리거나 막힌 곳에서는 그동안 화면이
   * 하얗게 남는다 — 글씨는 먼저 보이고 글꼴이 나중에 갈아 끼는 편이 언제나 낫다.
   */
  const fontHref =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&family=Noto+Serif+KR:wght@700;800;900&display=swap";
  const fonts = includeFontLink
    ? `\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fontHref}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${fontHref}"></noscript>`
    : "";
  const description = (doc.description ?? "").trim();
  const favicon = safeUrl(doc.favicon ?? "");
  const meta = [
    description ? `<meta name="description" content="${escapeHtml(description)}">` : "",
    `<meta property="og:title" content="${escapeHtml(doc.title)}">`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}">` : "",
    `<meta property="og:type" content="website">`,
    favicon ? `<link rel="icon" href="${favicon}">` : "",
  ]
    .filter(Boolean)
    .join("\n");
  // 글 속의 < 는 전부 \u003c 로 적는다 — </script> 로 스크립트가 닫히거나 태그로 읽힐 길이 없다.
  // JSON.parse 는 \u003c 를 그대로 < 로 읽으므로 되읽을 때 손댈 것이 없다.
  const embedded = embedDoc
    ? `\n<script type="application/json" id="${EMBED_ID}">${JSON.stringify(doc).replace(/</g, "\\u003c")}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="ko" data-layout="${layoutOf(doc)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="${escapeHtml(GENERATOR)}">
<title>${escapeHtml(doc.title)}</title>
${meta}${fonts}
<style>
*{margin:0;padding:0}
html{scroll-behavior:smooth}
body{margin:0}
${BUILDER_CSS}
</style>
</head>
<body>
<div class="bf-root" style="${themeVars(doc.theme)}">
${body}
</div>
${hasBoard(doc) ? `<script>\n${BOARD_SCRIPT}\n</script>` : ""}${embedded}
</body>
</html>`;
}

/**
 * 내려받을 파일 이름을 만든다.
 *
 * 사이트 이름은 고객이 자유롭게 적는 칸이다. 거기에 「A/B 테스트」처럼 슬래시가
 * 들어가면 브라우저가 경로로 읽어 이름이 잘리거나 통째로 버려진다. 파일 이름에
 * 쓸 수 없는 글자만 걷어내고, 남는 것이 없으면 site 로 물러난다.
 *
 * 한글은 그대로 둔다 — 쓰는 분들의 컴퓨터에서는 한글 이름이 정상으로 붙는다.
 */
export function downloadName(title: string, extension: string): string {
  const cleaned = (title ?? "")
    // 경로 구분자와 파일 이름에 못 쓰는 글자
    .replace(/[\\/:*?"<>|]/g, " ")
    // 눈에 보이지 않는 제어 문자
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // 앞뒤 점은 숨김 파일이 되거나 확장자로 오해된다
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 80)
    .trim();
  return `${cleaned || "site"}.${extension}`;
}

/** 문서를 파일로 주고받기 위한 직렬화 — 되읽을 때 형식을 확인한다 */
export function serializeDoc(doc: SiteDoc): string {
  return JSON.stringify(doc, null, 2);
}

export function parseDoc(raw: string): SiteDoc | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SiteDoc>;
    if (!parsed || parsed.version !== 1) return null;
    if (!Array.isArray(parsed.sections) || !parsed.theme) return null;
    return parsed as SiteDoc;
  } catch {
    return null;
  }
}

/**
 * JSON 이든, 빌더가 내보낸 HTML 이든 문서를 꺼낸다.
 * HTML 이면 심어 둔 <script type="application/json" id="bf-doc"> 를 찾는다.
 */
export function parseAny(raw: string): SiteDoc | null {
  const direct = parseDoc(raw);
  if (direct) return direct;
  const m = raw.match(new RegExp(`<script type="application/json" id="${EMBED_ID}">([\\s\\S]*?)</script>`));
  if (!m) return null;
  return parseDoc(m[1]);
}
