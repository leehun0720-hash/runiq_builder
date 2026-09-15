/**
 * 홈페이지 빌더 — 그리기.
 *
 * 편집 화면(캔버스)과 내보낸 HTML이 **같은 함수**에서 나온다. 둘을 따로 만들면
 * 편집 중에 본 모습과 내보낸 결과가 어긋나는데, 그것이 빌더에서 가장 치명적인
 * 고장이다. 그래서 마크업도 스타일도 여기 한 곳에만 둔다.
 *
 * 편집 모드에서는 글자 요소에 data-edit="경로"를 붙인다. 캔버스가 그 표시를
 * 보고 그 자리에서 고쳐 쓸 수 있게 만든다(경로는 문서에서의 위치를 가리킨다).
 *
 * 레이아웃은 구역 바깥의 뼈대다. 구역 마크업은 그대로 두고, 감싸는 틀
 * (.bf-page[data-layout])과 그 틀에 딸린 스타일만 바꾼다 — 그래서 여섯 가지
 * 레이아웃이 같은 구역 데이터를 나눠 쓴다.
 */

import { layoutOf, type Background, type LayoutId, type Post, type Section, type SiteDoc, type Theme } from "./types";
import { PATTERN_IDS, iconSvg, illustrationSvg } from "./art";

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 이미지 주소는 그대로 style/src에 들어가므로 형식을 확인한다.
 * http(s)와 data 이미지만 통과시켜 javascript: 같은 주소가 끼지 못하게 한다.
 */
export function safeUrl(url: string): string {
  const v = (url ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || /^data:image\//i.test(v) || v.startsWith("/")) {
    return v.replace(/["'\\]/g, "");
  }
  return "";
}

/**
 * 링크 주소 — 같은 페이지 안(#…), 바깥 주소, 메일, 전화만 통과시킨다.
 * 이미지와 달리 data: 는 받지 않는다(링크로는 쓸 일이 없고 위험만 남는다).
 */
export function safeHref(href: string): string {
  const v = (href ?? "").trim();
  if (!v) return "";
  if (/^(#|https?:\/\/|mailto:|tel:|\/)/i.test(v)) return v.replace(/["'\\<>]/g, "");
  return "";
}

/** 구역의 닻 — 메뉴가 「#s-아이디」로 그 구역까지 내려간다 */
export function anchorOf(section: { id: string }): string {
  return `#s-${section.id}`;
}

/** 유튜브 주소 어느 형태에서든 영상 id를 꺼낸다. 아니면 빈 문자열. */
export function youtubeId(url: string): string {
  const v = (url ?? "").trim();
  if (!v) return "";
  const m =
    v.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) ||
    v.match(/^([A-Za-z0-9_-]{11})$/);
  return m ? m[1] : "";
}

/**
 * 편집 표시 — 내보낼 때는 아무것도 붙지 않는다.
 *
 * contenteditable을 마크업에 함께 넣는 것이 중요하다. 그려진 뒤에 자바스크립트로
 * 붙이면, 화면을 다시 그릴 때마다 그 표시가 함께 지워진다(그린 결과의 주인은
 * 리액트다). 마크업에 넣어 두면 몇 번을 다시 그려도 편집 상태가 살아 있다.
 */
function ed(path: string, edit: boolean): string {
  return edit ? ` data-edit="${escapeHtml(path)}" contenteditable="true" spellcheck="false"` : "";
}

/**
 * 누를 수 있는 글자(단추·메뉴) — 링크가 있으면 <a>, 없으면 <span>.
 * 편집 중에는 늘 <span>이다. 눌러서 고치는 글자가 눌러서 이동해 버리면 안 된다.
 */
function clickable(cls: string, text: string, href: string | undefined, path: string, edit: boolean): string {
  const url = edit ? "" : safeHref(href ?? "");
  if (!url) return `<span class="${cls}"${ed(path, edit)}>${escapeHtml(text)}</span>`;
  const external = /^https?:\/\//i.test(url) ? ` target="_blank" rel="noopener"` : "";
  return `<a class="${cls}" href="${escapeHtml(url)}"${external}>${escapeHtml(text)}</a>`;
}

function bgStyle(bg: Background): { style: string; hasImage: boolean } {
  switch (bg.kind) {
    case "solid":
      return { style: `background-color:${escapeHtml(bg.color)};`, hasImage: false };
    case "gradient":
      return {
        style: `background-image:linear-gradient(${Number(bg.angle) || 0}deg,${escapeHtml(bg.from)},${escapeHtml(bg.to)});`,
        hasImage: false,
      };
    case "image": {
      const url = safeUrl(bg.url);
      if (!url) return { style: "", hasImage: false };
      const ov = Math.min(1, Math.max(0, Number(bg.overlay) || 0));
      return {
        style: `background-image:url('${url}');background-size:cover;background-position:center;--bf-ov:${ov};`,
        hasImage: true,
      };
    }
    default:
      return { style: "", hasImage: false };
  }
}

/** 테마 → CSS 변수. 문서 전체를 감싸는 요소에 붙는다. */
export function themeVars(theme: Theme): string {
  const heading =
    theme.heading === "serif"
      ? `"Noto Serif KR", Georgia, serif`
      : `"Noto Sans KR", -apple-system, sans-serif`;
  return [
    `--bf-accent:${theme.accent}`,
    `--bf-accent-ink:${theme.accentInk}`,
    `--bf-paper:${theme.paper}`,
    `--bf-paper-deep:${theme.paperDeep}`,
    `--bf-ink:${theme.ink}`,
    `--bf-ink-strong:${theme.inkStrong}`,
    `--bf-line:${theme.line}`,
    `--bf-muted:${theme.muted}`,
    `--bf-heading:${heading}`,
    `--bf-radius:${theme.radius}px`,
    `--bf-fs:${theme.fontSize}px`,
  ].join(";");
}

/* ────────────────────────────────────────────────────────────
   구역별 마크업
   ──────────────────────────────────────────────────────────── */

function headBlock(
  s: { eyebrow?: string; title?: string; lead?: string },
  p: string,
  edit: boolean
): string {
  const bits: string[] = [];
  if (s.eyebrow !== undefined) bits.push(`<p class="bf-eyebrow"${ed(`${p}.eyebrow`, edit)}>${escapeHtml(s.eyebrow)}</p>`);
  if (s.title !== undefined) bits.push(`<h2 class="bf-h2"${ed(`${p}.title`, edit)}>${escapeHtml(s.title)}</h2>`);
  if (s.lead !== undefined) bits.push(`<p class="bf-lead"${ed(`${p}.lead`, edit)}>${escapeHtml(s.lead)}</p>`);
  return `<div class="bf-head">${bits.join("")}</div>`;
}

/**
 * 글 구역 본문 — 빈 줄로 문단을 나누고, 「## 」로 시작하면 소제목,
 * 「- 」로 시작하는 줄이 이어지면 목록이 된다. 그 밖의 표식은 두지 않는다.
 * 사장님이 외울 규칙은 셋이면 충분하다.
 */
export function richBody(body: string): string {
  return (body ?? "")
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim().length > 0);
      if (!lines.length) return "";
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${escapeHtml(l.replace(/^\s*-\s+/, ""))}</li>`).join("")}</ul>`;
      }
      if (lines.length === 1 && /^##\s+/.test(lines[0])) {
        return `<h3>${escapeHtml(lines[0].replace(/^##\s+/, ""))}</h3>`;
      }
      return `<p>${lines.map(escapeHtml).join("<br>")}</p>`;
    })
    .join("");
}

/** 공지가 먼저, 나머지는 적힌 순서 — 화면과 스크립트가 같은 순서를 쓴다 */
export function sortPosts<T extends Pick<Post, "notice">>(posts: T[]): T[] {
  return [...posts.filter((p) => p.notice), ...posts.filter((p) => !p.notice)];
}

function inner(s: Section, p: string, edit: boolean, theme?: Theme): string {
  switch (s.kind) {
    case "header": {
      // 로고 그림이 있으면 그것이 상표다 — 없을 때만 강조색 네모가 대신 선다.
      // 높이만 정하고 가로는 비율대로 두어야 어떤 모양의 로고든 찌그러지지 않는다.
      const logoUrl = safeUrl(s.logoImage ?? "");
      const logoH = Math.min(120, Math.max(16, Number(s.logoHeight) || 34));
      const mark = logoUrl
        ? `<img class="bf-brand-img" src="${logoUrl}" alt="${escapeHtml(s.logo)}" style="height:${logoH}px">`
        : `<span class="bf-brand-mark" aria-hidden="true"></span>`;
      // 좁은 화면의 메뉴 단추는 체크박스 하나로 연다 — 스크립트 없이 CSS만으로 돈다
      const toggleId = `bf-nav-${s.id}`;
      return `<div class="bf-nav">
  <div class="bf-brand">
    ${mark}
    <span class="bf-brand-text">
      <strong${ed(`${p}.logo`, edit)}>${escapeHtml(s.logo)}</strong>
      <small${ed(`${p}.sub`, edit)}>${escapeHtml(s.sub)}</small>
    </span>
  </div>
  <input type="checkbox" class="bf-nav-toggle" id="${toggleId}" hidden>
  <label class="bf-burger" for="${toggleId}" aria-label="메뉴 열기"><span></span></label>
  <nav class="bf-menu">${s.menu
    .map((m, i) => clickable("bf-menu-item", m.label, m.href, `${p}.menu.${i}.label`, edit))
    .join("")}</nav>
  ${clickable("bf-btn bf-btn--sm", s.cta, s.ctaHref, `${p}.cta`, edit)}
</div>`;
    }

    case "hero": {
      // 삽화는 강조색과 글자색으로 그린다 — 어두운 바탕이면 글자색이 밝으므로 그대로 어울린다
      const art = s.art && theme ? illustrationSvg(s.art, theme.accent, s.scheme === "dark" ? "#FFFFFF" : theme.inkStrong) : "";
      return `${art ? `<div class="bf-art" aria-hidden="true">${art}</div>` : ""}<div class="bf-hero">
  <div class="bf-hero-text">
  <p class="bf-eyebrow"${ed(`${p}.eyebrow`, edit)}>${escapeHtml(s.eyebrow)}</p>
  <h1 class="bf-h1"><span${ed(`${p}.title`, edit)}>${escapeHtml(s.title)}</span><br><em${ed(`${p}.titleEm`, edit)}>${escapeHtml(s.titleEm)}</em></h1>
  <p class="bf-hero-desc"${ed(`${p}.desc`, edit)}>${escapeHtml(s.desc)}</p>
  <div class="bf-actions">
    ${clickable("bf-btn", s.primary, s.primaryHref, `${p}.primary`, edit)}
    ${clickable("bf-btn bf-btn--ghost", s.secondary, s.secondaryHref, `${p}.secondary`, edit)}
  </div>
  </div>
  ${
    s.stats.length
      ? `<div class="bf-stats">${s.stats
          .map(
            (st, i) =>
              `<div class="bf-stat"><strong${ed(`${p}.stats.${i}.value`, edit)}>${escapeHtml(st.value)}</strong><span${ed(
                `${p}.stats.${i}.label`,
                edit
              )}>${escapeHtml(st.label)}</span></div>`
          )
          .join("")}</div>`
      : ""
  }
</div>`;
    }

    case "cards":
      return `${headBlock(s, p, edit)}
<div class="bf-cards" data-cols="${Number(s.columns) || 3}">${s.cards
        .map((c, i) => {
          const img = safeUrl(c.image);
          return `<article class="bf-card">
  ${img ? `<span class="bf-card-img" style="background-image:url('${img}')"></span>` : ""}
  ${iconSvg(c.icon ?? "") ? `<span class="bf-card-icon">${iconSvg(c.icon ?? "")}</span>` : ""}
  <span class="bf-card-no"${ed(`${p}.cards.${i}.no`, edit)}>${escapeHtml(c.no)}</span>
  <h3${ed(`${p}.cards.${i}.title`, edit)}>${escapeHtml(c.title)}</h3>
  <span class="bf-card-en"${ed(`${p}.cards.${i}.en`, edit)}>${escapeHtml(c.en)}</span>
  <p${ed(`${p}.cards.${i}.desc`, edit)}>${escapeHtml(c.desc)}</p>
  ${clickable("bf-card-meta", c.meta, c.href, `${p}.cards.${i}.meta`, edit)}
</article>`;
        })
        .join("")}</div>`;

    case "steps":
      return `${headBlock(s, p, edit)}
<div class="bf-steps">${s.steps
        .map(
          (st, i) => `<div class="bf-step" data-gate="${st.gate ? "true" : "false"}">
  ${iconSvg(st.icon ?? "") ? `<span class="bf-step-icon">${iconSvg(st.icon ?? "")}</span>` : ""}
  <span class="bf-step-index"${ed(`${p}.steps.${i}.index`, edit)}>${escapeHtml(st.index)}</span>
  <h3${ed(`${p}.steps.${i}.name`, edit)}>${escapeHtml(st.name)}</h3>
  <p${ed(`${p}.steps.${i}.desc`, edit)}>${escapeHtml(st.desc)}</p>
</div>`
        )
        .join("")}</div>`;

    case "table":
      return `${headBlock(s, p, edit)}
<div class="bf-table-wrap"><table class="bf-table">
  <thead><tr><th></th>${s.columns
    .map((c, i) => `<th${ed(`${p}.columns.${i}`, edit)}>${escapeHtml(c)}</th>`)
    .join("")}</tr></thead>
  <tbody>${s.rows
    .map(
      (r, ri) => `<tr><th scope="row"${ed(`${p}.rows.${ri}.label`, edit)}>${escapeHtml(r.label)}</th>${r.cells
        .map((cell, ci) => {
          const mark = cell === "O" ? "bf-yes" : cell === "X" ? "bf-no" : "";
          return `<td class="${mark}"${ed(`${p}.rows.${ri}.cells.${ci}`, edit)}>${escapeHtml(cell)}</td>`;
        })
        .join("")}</tr>`
    )
    .join("")}</tbody>
</table></div>`;

    case "list":
      return `${headBlock(s, p, edit)}
<ol class="bf-list">${s.items
        .map(
          (it, i) => `<li>
  <span class="bf-list-no"${ed(`${p}.items.${i}.no`, edit)}>${escapeHtml(it.no)}</span>
  <span class="bf-list-label"${ed(`${p}.items.${i}.label`, edit)}>${escapeHtml(it.label)}</span>
  <span class="bf-list-tags">${it.tags.map((t) => `<i>${escapeHtml(t)}</i>`).join("")}</span>
</li>`
        )
        .join("")}</ol>`;

    case "gallery":
      return `${headBlock(s, p, edit)}
<div class="bf-gallery" data-cols="${Number(s.columns) || 3}">${s.images
        .map((im, i) => {
          const url = safeUrl(im.url);
          return `<figure class="bf-shot">
  <span class="bf-shot-img"${url ? ` style="background-image:url('${url}')"` : ` data-empty="1"`}></span>
  <figcaption${ed(`${p}.images.${i}.caption`, edit)}>${escapeHtml(im.caption)}</figcaption>
</figure>`;
        })
        .join("")}</div>`;

    case "rich":
      // 본문은 여러 줄이다 — data-multiline 을 보고 캔버스가 줄바꿈을 살려 둔다
      return `<div class="bf-rich">
  <p class="bf-eyebrow"${ed(`${p}.eyebrow`, edit)}>${escapeHtml(s.eyebrow)}</p>
  <h2 class="bf-h2"${ed(`${p}.title`, edit)}>${escapeHtml(s.title)}</h2>
  <div class="bf-body"${ed(`${p}.body`, edit)}${edit ? ` data-multiline="1"` : ""}>${richBody(s.body)}</div>
</div>`;

    case "cta":
      return `<div class="bf-cta">
  <h2 class="bf-h2"${ed(`${p}.title`, edit)}>${escapeHtml(s.title)}</h2>
  <p${ed(`${p}.desc`, edit)}>${escapeHtml(s.desc)}</p>
  ${clickable("bf-btn", s.button, s.buttonHref, `${p}.button`, edit)}
  <small${ed(`${p}.note`, edit)}>${escapeHtml(s.note)}</small>
</div>`;

    case "board": {
      const style = s.style === "card" ? "card" : "list";
      const cats = (s.categories ?? []).map((c) => c.trim()).filter(Boolean);
      const pageSize = Math.max(1, Number(s.pageSize) || 8);
      // 편집 화면에서는 원래 순서(오른쪽 목록과 같은 순서)로 두어 몇 번째 글인지 맞아떨어지게 한다.
      // 내보낼 때는 공지가 위로 올라간다.
      const ordered = edit ? s.posts.map((post, i) => ({ post, i })) : sortPosts(s.posts.map((post, i) => ({ post, i, notice: post.notice })));
      const rows = ordered
        .map(({ post, i }, order) => {
          const link = safeUrl(post.link ?? "") || safeHref(post.link ?? "");
          const cat = (post.category ?? "").trim();
          return `<li class="bf-post" data-post="${escapeHtml(post.id)}" data-body="${escapeHtml(post.body)}"${
            cat ? ` data-cat="${escapeHtml(cat)}"` : ""
          }${link ? ` data-link="${escapeHtml(link)}"` : ""}${!edit && order >= pageSize ? " hidden" : ""}>
  <span class="bf-post-badge">${post.notice ? "공지" : String(s.posts.length - i)}</span>
  <span class="bf-post-main">${cat ? `<span class="bf-post-cat">${escapeHtml(cat)}</span>` : ""}<span class="bf-post-title"${ed(
            `${p}.posts.${i}.title`,
            edit
          )}>${escapeHtml(post.title)}</span>${link ? `<span class="bf-post-clip" aria-label="첨부">📎</span>` : ""}</span>
  <span class="bf-post-author"${ed(`${p}.posts.${i}.author`, edit)}>${escapeHtml(post.author)}</span>
  <span class="bf-post-date"${ed(`${p}.posts.${i}.date`, edit)}>${escapeHtml(post.date)}</span>
</li>`;
        })
        .join("");
      const tools =
        cats.length || s.search
          ? `<div class="bf-board-tools">${
              cats.length
                ? `<div class="bf-board-cats"><button type="button" class="is-on" data-cat="">전체</button>${cats
                    .map((c) => `<button type="button" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
                    .join("")}</div>`
                : ""
            }${
              s.search
                ? `<form class="bf-board-search" data-act="search"><input type="search" name="q" placeholder="제목·내용 검색" aria-label="검색"><button type="submit" class="bf-btn bf-btn--sm bf-btn--ghost">검색</button></form>`
                : ""
            }</div>`
          : "";
      return `${headBlock(s, p, edit)}
<div class="bf-board" data-board="${escapeHtml(s.boardKey)}" data-pagesize="${pageSize}" data-write="${
        s.allowWrite ? "1" : "0"
      }" data-style="${style}">
  ${tools}
  <div class="bf-board-view" data-view="list">
    <div class="bf-board-head"><span>제목</span><span>작성자</span><span>날짜</span></div>
    <ul class="bf-posts">${rows}</ul>
    <div class="bf-board-foot">
      <span class="bf-board-count">전체 ${s.posts.length}건</span>
      <nav class="bf-board-pages" aria-label="쪽"></nav>
      ${s.allowWrite ? `<button type="button" class="bf-btn bf-btn--sm" data-act="new">글쓰기</button>` : ""}
    </div>
  </div>
  <div class="bf-board-view" data-view="read" hidden>
    <p class="bf-read-cat"></p>
    <h3 class="bf-read-title"></h3>
    <p class="bf-read-meta"></p>
    <div class="bf-read-body"></div>
    <p class="bf-read-link" hidden><a class="bf-btn bf-btn--sm" target="_blank" rel="noopener">첨부·링크 열기</a></p>
    <div class="bf-board-foot"><button type="button" class="bf-btn bf-btn--sm bf-btn--ghost" data-act="back">목록</button><button type="button" class="bf-btn bf-btn--sm bf-btn--ghost" data-act="del">삭제</button></div>
  </div>
  <form class="bf-board-view bf-board-form" data-view="write" hidden>
    ${
      cats.length
        ? `<label>말머리<select name="category">${cats
            .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
            .join("")}</select></label>`
        : ""
    }
    <label>제목<input name="title" required maxlength="120"></label>
    <label>작성자<input name="author" required maxlength="40"></label>
    <label>내용<textarea name="body" rows="6" required maxlength="4000"></textarea></label>
    <div class="bf-board-foot"><button type="submit" class="bf-btn bf-btn--sm">등록</button><button type="button" class="bf-btn bf-btn--sm bf-btn--ghost" data-act="back">취소</button></div>
  </form>
</div>`;
    }

    case "faq":
      // 편집 중에는 모두 펼쳐 둔다 — 접힌 답은 눌러 고칠 수 없다
      return `${headBlock(s, p, edit)}
<div class="bf-faq">${s.items
        .map(
          (it, i) => `<details class="bf-faq-item"${edit ? " open" : ""}>
  <summary><span${ed(`${p}.items.${i}.q`, edit)}>${escapeHtml(it.q)}</span></summary>
  <div class="bf-faq-a"${ed(`${p}.items.${i}.a`, edit)}${edit ? ` data-multiline="1"` : ""}>${escapeHtml(it.a)}</div>
</details>`
        )
        .join("")}</div>`;

    case "contact": {
      /**
       * 서버가 없어도 문의가 닿아야 한다. 받을 주소(endpoint)가 있으면 거기로
       * 보내고, 없으면 mailto: 로 방문자의 메일 프로그램을 연다.
       */
      const endpoint = safeHref(s.endpoint ?? "");
      const mail = (s.email ?? "").trim();
      const action = endpoint
        ? ` action="${escapeHtml(endpoint)}" method="post"`
        : mail
          ? ` action="mailto:${escapeHtml(mail)}" method="post" enctype="text/plain"`
          : "";
      const info: [string, string, string][] = [
        ["이메일", s.email, "email"],
        ["전화", s.phone, "phone"],
        ["주소", s.address, "address"],
        ["운영 시간", s.hours, "hours"],
      ];
      return `${headBlock(s, p, edit)}
<div class="bf-contact">
  <dl class="bf-contact-info">${info
    .filter(([, v]) => edit || (v ?? "").trim())
    .map(([k, v, key]) => `<div><dt>${k}</dt><dd${ed(`${p}.${key}`, edit)}>${escapeHtml(v ?? "")}</dd></div>`)
    .join("")}</dl>
  <form class="bf-contact-form"${action}>
    <label>이름<input name="name" required maxlength="40" placeholder="성함"></label>
    <label>연락처<input name="contact" required maxlength="80" placeholder="이메일 또는 전화번호"></label>
    <label>문의 내용<textarea name="message" rows="5" required maxlength="3000" placeholder="궁금하신 점을 적어 주십시오"></textarea></label>
    <button type="submit" class="bf-btn"${ed(`${p}.button`, edit)}>${escapeHtml(s.button)}</button>
    <small${ed(`${p}.note`, edit)}>${escapeHtml(s.note)}</small>
  </form>
</div>`;
    }

    case "map": {
      const q = ((s.query ?? "").trim() || (s.address ?? "").trim());
      const h = Math.min(720, Math.max(200, Number(s.height) || 360));
      // 편집 중에는 지도를 부르지 않는다 — 글자 하나 고칠 때마다 지도가 다시 뜨면 화면이 무겁다
      const frame =
        !edit && q
          ? `<iframe class="bf-map-frame" style="height:${h}px" src="https://www.google.com/maps?q=${encodeURIComponent(
              q
            )}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="지도"></iframe>`
          : `<div class="bf-map-ph" style="height:${h}px">${q ? "지도는 미리보기·내보낸 파일에서 표시됩니다" : "주소를 적으면 지도가 들어갑니다"}</div>`;
      return `${headBlock(s, p, edit)}
<div class="bf-map">
  ${frame}
  <div class="bf-map-side">
    <p class="bf-map-addr"${ed(`${p}.address`, edit)}>${escapeHtml(s.address)}</p>
    <ul class="bf-map-dirs">${(s.directions ?? [])
      .map((d, i) => `<li${ed(`${p}.directions.${i}`, edit)}>${escapeHtml(d)}</li>`)
      .join("")}</ul>
  </div>
</div>`;
    }

    case "video": {
      const id = youtubeId(s.url ?? "");
      const frame = !id
        ? `<div class="bf-video-ph" data-empty="1">유튜브 주소를 붙여 넣으십시오</div>`
        : edit
          ? `<div class="bf-video-ph" style="background-image:url('https://img.youtube.com/vi/${id}/hqdefault.jpg')"></div>`
          : `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="동영상" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      return `${headBlock(s, p, edit)}
<figure class="bf-video">
  <div class="bf-video-frame">${frame}</div>
  <figcaption${ed(`${p}.caption`, edit)}>${escapeHtml(s.caption)}</figcaption>
</figure>`;
    }

    case "footer":
      return `<div class="bf-footer">
  <div>
    <strong class="bf-foot-brand"${ed(`${p}.brand`, edit)}>${escapeHtml(s.brand)}</strong>
    ${s.lines.map((l, i) => `<p${ed(`${p}.lines.${i}`, edit)}>${escapeHtml(l)}</p>`).join("")}
  </div>
  <nav class="bf-foot-links">${s.links
    .map((l, i) => clickable("bf-foot-link", l.label, l.href, `${p}.links.${i}.label`, edit))
    .join("")}</nav>
</div>`;
  }
}

/** 구역 하나를 감싸서 그린다 */
export function renderSection(s: Section, index: number, edit: boolean, span?: "half" | "full", theme?: Theme): string {
  if (s.hidden) return "";
  const { style, hasImage } = bgStyle(s.background);
  const p = `sections.${index}`;
  const sticky = s.kind === "header" && s.sticky ? ` data-sticky="1"` : "";
  const pattern = s.pattern && s.pattern !== "none" && PATTERN_IDS.includes(s.pattern) ? ` data-pattern="${s.pattern}"` : "";
  return `<section class="bf-sec bf-sec--${s.kind}" id="s-${escapeHtml(s.id)}" data-id="${escapeHtml(s.id)}" data-pad="${s.padding}" data-scheme="${
    s.scheme
  }"${span ? ` data-span="${span}"` : ""}${sticky}${pattern}${hasImage ? ` data-hasimg="1"` : ""}${style ? ` style="${style}"` : ""}>
<div class="bf-inner" data-w="${s.width}" data-align="${s.align}">${inner(s, p, edit, theme)}</div>
</section>`;
}

/** 포털형에서 반쪽 자리에 들어갈 수 있는 구역 — 나머지는 늘 가로로 꽉 찬다 */
const HALF_KINDS = new Set<Section["kind"]>(["cards", "steps", "table", "list", "rich", "board", "faq", "contact", "map", "video"]);

/**
 * 문서 전체 — 캔버스와 내보내기가 공유한다.
 *
 * 레이아웃마다 구역을 감싸는 틀이 다르다.
 *  - 사이드 메뉴형: 상단 메뉴 구역이 왼쪽 기둥(aside)으로 빠진다
 *  - 포털형: 이어지는 본문 구역을 둘씩 짝지어 한 줄(.bf-row)에 놓는다. 짝이 없으면 꽉 찬다
 *  - 박스형: 가운데 상자(.bf-box)에 담는다
 *  - 나머지는 CSS만 다르다
 */
export function renderSite(doc: SiteDoc, edit = false): string {
  const layout: LayoutId = layoutOf(doc);
  const visible = doc.sections.map((s, i) => ({ s, i })).filter(({ s }) => !s.hidden);
  const one = (x: { s: Section; i: number }, span?: "half" | "full") => renderSection(x.s, x.i, edit, span, doc.theme);

  if (layout === "sidebar" && visible.some(({ s }) => s.kind === "header")) {
    const side = visible.filter(({ s }) => s.kind === "header");
    const main = visible.filter(({ s }) => s.kind !== "header");
    return `<div class="bf-page" data-layout="sidebar">
<aside class="bf-side">${side.map((x) => one(x)).join("\n")}</aside>
<div class="bf-main">${main.map((x) => one(x)).join("\n")}</div>
</div>`;
  }

  if (layout === "portal") {
    const out: string[] = [];
    let run: { s: Section; i: number }[] = [];
    const flush = () => {
      // 둘씩 짝을 짓고, 홀로 남은 마지막 하나는 꽉 찬 띠로 돌려보낸다
      const pairs = run.slice(0, run.length - (run.length % 2));
      const rest = run.slice(pairs.length);
      if (pairs.length) out.push(`<div class="bf-row">${pairs.map((x) => one(x, "half")).join("\n")}</div>`);
      rest.forEach((x) => out.push(one(x, "full")));
      run = [];
    };
    for (const x of visible) {
      if (HALF_KINDS.has(x.s.kind)) run.push(x);
      else {
        flush();
        out.push(one(x, "full"));
      }
    }
    flush();
    return `<div class="bf-page" data-layout="portal">\n${out.join("\n")}\n</div>`;
  }

  const body = visible.map((x) => one(x)).join("\n");
  if (layout === "boxed") return `<div class="bf-page" data-layout="boxed"><div class="bf-box">\n${body}\n</div></div>`;
  return `<div class="bf-page" data-layout="${layout}">\n${body}\n</div>`;
}

/** 게시판이 하나라도 있는지 — 내보낼 때 스크립트를 넣을지 정한다 */
export function hasBoard(doc: SiteDoc): boolean {
  return doc.sections.some((s) => s.kind === "board" && !s.hidden);
}

/* ────────────────────────────────────────────────────────────
   스타일 — 캔버스와 내보낸 문서가 같은 것을 쓴다
   ──────────────────────────────────────────────────────────── */

export const BUILDER_CSS = `
.bf-root{font-family:"Noto Sans KR",-apple-system,BlinkMacSystemFont,sans-serif;font-size:var(--bf-fs);line-height:1.75;color:var(--bf-ink);background:var(--bf-paper);word-break:keep-all;-webkit-font-smoothing:antialiased}
.bf-root *{box-sizing:border-box}
.bf-root p{margin:0}
.bf-root a{color:inherit}

.bf-sec{position:relative;background-color:var(--bf-paper);scroll-margin-top:76px}
.bf-sec[data-hasimg="1"]::before{content:"";position:absolute;inset:0;background:rgba(18,12,10,var(--bf-ov,.5))}
.bf-sec[data-pad="sm"]{padding:18px 24px}
.bf-sec[data-pad="md"]{padding:clamp(40px,6vw,64px) 24px}
.bf-sec[data-pad="lg"]{padding:clamp(56px,8vw,104px) 24px}
.bf-sec[data-pad="xl"]{padding:clamp(72px,11vw,148px) 24px}
/* 배경 무늬 — 글자 뒤에 옅게 깔린다. 색은 글자색을 따라가므로 밝은 바탕·어두운 바탕 어디서나 보인다 */
.bf-sec[data-pattern]::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.14}
.bf-sec[data-pattern="dots"]::after{background-image:radial-gradient(currentColor 1.2px,transparent 1.3px);background-size:22px 22px}
.bf-sec[data-pattern="grid"]::after{background-image:linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px);background-size:40px 40px;opacity:.09}
.bf-sec[data-pattern="diagonal"]::after{background-image:repeating-linear-gradient(45deg,currentColor 0 1px,transparent 1px 14px);opacity:.09}
.bf-sec[data-pattern="cross"]::after{background-image:linear-gradient(currentColor 1.5px,transparent 1.5px),linear-gradient(90deg,currentColor 1.5px,transparent 1.5px);background-size:28px 28px;background-position:center;opacity:.07}
.bf-sec[data-pattern="rings"]::after{background-image:repeating-radial-gradient(circle at 85% 30%,transparent 0 38px,currentColor 38px 39px);opacity:.1}
.bf-sec[data-scheme="dark"]{color:#EDE6E2}
.bf-sec[data-scheme="dark"]:not([style*="background"]):not([data-hasimg]){background-color:var(--bf-ink-strong)}
/* 고정 메뉴 — 스크롤해도 위에 붙어 있다 */
.bf-sec--header[data-sticky="1"]{position:sticky;top:0;z-index:30;box-shadow:0 1px 0 var(--bf-line),0 6px 24px rgba(0,0,0,.05)}

.bf-inner{position:relative;z-index:1;margin:0 auto;width:100%}
.bf-inner[data-w="narrow"]{max-width:760px}
.bf-inner[data-w="normal"]{max-width:1100px}
.bf-inner[data-w="wide"]{max-width:1340px}
.bf-inner[data-w="full"]{max-width:none}
.bf-inner[data-align="center"]{text-align:center}
.bf-inner[data-align="center"] .bf-head{margin-left:auto;margin-right:auto}
.bf-inner[data-align="center"] .bf-actions,.bf-inner[data-align="center"] .bf-stats{justify-content:center}

.bf-eyebrow{font-size:.69em;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--bf-accent-ink);margin:0 0 10px!important}
[data-scheme="dark"] .bf-eyebrow{color:var(--bf-accent);filter:brightness(1.75)}
.bf-h1{font-family:var(--bf-heading);font-size:clamp(34px,5.6vw,68px);font-weight:900;line-height:1.16;letter-spacing:-.02em;margin:0 0 20px}
.bf-h1 em{font-style:normal;color:var(--bf-accent)}
[data-scheme="dark"] .bf-h1 em{filter:brightness(1.5)}
.bf-h2{font-family:var(--bf-heading);font-size:clamp(23px,3.1vw,38px);font-weight:800;line-height:1.32;letter-spacing:-.01em;color:var(--bf-ink-strong);margin:0 0 12px}
[data-scheme="dark"] .bf-h2{color:#fff}
.bf-head{max-width:760px;margin-bottom:clamp(28px,4vw,48px)}
.bf-lead{color:var(--bf-muted);font-size:.97em}
[data-scheme="dark"] .bf-lead{color:#C6BAB4}

.bf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 26px;background:var(--bf-accent);color:#fff;font-weight:700;font-size:.92em;border:0;border-radius:var(--bf-radius);cursor:pointer;text-decoration:none;font-family:inherit;line-height:1.4}
a.bf-btn:hover{filter:brightness(1.08)}
.bf-btn--sm{padding:9px 18px;font-size:.84em}
.bf-btn--ghost{background:transparent;color:currentColor;border:1px solid currentColor;opacity:.9}
.bf-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}

.bf-nav{display:flex;align-items:center;gap:28px}
.bf-brand{display:flex;align-items:center;gap:11px}
.bf-brand-mark{width:26px;height:26px;background:var(--bf-accent);border-radius:calc(var(--bf-radius) + 2px);flex:none}
/* 높이만 정하고 가로는 auto — 가로세로 어느 모양의 로고든 찌그러지지 않는다 */
.bf-brand-img{display:block;width:auto;max-width:260px;object-fit:contain;flex:none}
.bf-brand-text strong{display:block;font-family:var(--bf-heading);font-size:1.06em;font-weight:800;line-height:1.2}
.bf-brand-text small{display:block;font-size:.62em;letter-spacing:.22em;color:var(--bf-muted);margin-top:1px}
[data-scheme="dark"] .bf-brand-text small{color:#B3A7A1}
.bf-menu{display:flex;gap:24px;margin-left:auto;font-size:.9em;font-weight:600}
.bf-menu-item{text-decoration:none;white-space:nowrap}
a.bf-menu-item:hover{color:var(--bf-accent-ink)}
[data-scheme="dark"] a.bf-menu-item:hover{color:var(--bf-accent);filter:brightness(1.6)}
.bf-nav .bf-btn{flex:none}
/* 좁은 화면 메뉴 단추 — 체크박스 하나로 열고 닫는다 */
.bf-burger{display:none;width:40px;height:40px;flex:none;place-items:center;border:1px solid var(--bf-line);border-radius:var(--bf-radius);cursor:pointer;margin-left:auto}
[data-scheme="dark"] .bf-burger{border-color:rgba(255,255,255,.3)}
.bf-burger span,.bf-burger span::before,.bf-burger span::after{display:block;width:18px;height:2px;background:currentColor;border-radius:2px;position:relative}
.bf-burger span::before,.bf-burger span::after{content:"";position:absolute;left:0}
.bf-burger span::before{top:-6px}
.bf-burger span::after{top:6px}

/* 히어로 삽화 — 오른쪽에 서고, 좁은 화면에서는 글자 뒤로 물러난다 */
.bf-art{position:absolute;right:0;top:50%;transform:translateY(-50%);width:min(38%,460px);aspect-ratio:1;pointer-events:none;z-index:0}
.bf-art svg{width:100%;height:100%;display:block}
.bf-inner[data-align="center"] .bf-art{left:50%;right:auto;transform:translate(-50%,-50%);opacity:.28;width:min(60%,520px)}
.bf-hero{position:relative;z-index:1;max-width:860px}
.bf-card-icon{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:calc(var(--bf-radius) - 2px);background:color-mix(in srgb,var(--bf-accent) 12%,transparent);color:var(--bf-accent-ink);margin-bottom:6px}
[data-scheme="dark"] .bf-card-icon{background:rgba(255,255,255,.1);color:#fff}
.bf-card-icon .bf-icon,.bf-step-icon .bf-icon{width:24px;height:24px}
.bf-step-icon{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--bf-accent) 12%,transparent);color:var(--bf-accent-ink);margin-bottom:8px}
[data-scheme="dark"] .bf-step-icon{background:rgba(255,255,255,.1);color:#fff}
.bf-step-icon .bf-icon{width:20px;height:20px}
.bf-inner[data-align="center"] .bf-hero{margin:0 auto}
.bf-hero-desc{font-size:1.03em;opacity:.86;max-width:600px}
.bf-inner[data-align="center"] .bf-hero-desc{margin:0 auto}
.bf-stats{display:flex;flex-wrap:wrap;gap:clamp(24px,5vw,56px);margin-top:clamp(32px,5vw,56px);padding-top:26px;border-top:1px solid currentColor;border-color:color-mix(in srgb,currentColor 22%,transparent)}
.bf-stat strong{display:block;font-family:var(--bf-heading);font-size:1.9em;font-weight:800;line-height:1.1;color:var(--bf-accent)}
[data-scheme="dark"] .bf-stat strong{filter:brightness(1.5)}
.bf-stat span{font-size:.76em;letter-spacing:.1em;opacity:.72}

.bf-cards{display:grid;gap:20px}
.bf-cards[data-cols="2"]{grid-template-columns:repeat(2,minmax(0,1fr))}
.bf-cards[data-cols="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
.bf-cards[data-cols="4"]{grid-template-columns:repeat(4,minmax(0,1fr))}
.bf-card{border:1px solid var(--bf-line);border-radius:var(--bf-radius);background:#fff;padding:24px 22px 22px;display:flex;flex-direction:column;gap:7px;transition:transform .18s,box-shadow .18s}
.bf-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(20,14,12,.09)}
[data-scheme="dark"] .bf-card{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.16)}
.bf-card-img{display:block;height:132px;margin:-24px -22px 14px;background-size:cover;background-position:center;border-radius:var(--bf-radius) var(--bf-radius) 0 0}
.bf-card-no{font-size:.68em;font-weight:800;letter-spacing:.16em;color:var(--bf-accent-ink)}
[data-scheme="dark"] .bf-card-no{color:var(--bf-accent);filter:brightness(1.7)}
.bf-card h3{font-family:var(--bf-heading);font-size:1.2em;font-weight:800;margin:0;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-card h3{color:#fff}
.bf-card-en{font-size:.65em;letter-spacing:.2em;color:var(--bf-muted);text-transform:uppercase}
.bf-card p{font-size:.88em;color:var(--bf-muted);margin-top:4px}
[data-scheme="dark"] .bf-card p,[data-scheme="dark"] .bf-card-en{color:#BFB3AD}
.bf-card-meta{margin-top:auto;padding-top:12px;font-size:.78em;font-weight:700;color:var(--bf-accent-ink);text-decoration:none}
[data-scheme="dark"] .bf-card-meta{color:var(--bf-accent);filter:brightness(1.7)}

.bf-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.bf-step{border-top:2px solid var(--bf-line);padding:16px 4px 0}
.bf-step[data-gate="true"]{border-top-color:var(--bf-accent)}
.bf-step-index{font-size:.68em;font-weight:800;letter-spacing:.16em;color:var(--bf-muted)}
.bf-step[data-gate="true"] .bf-step-index{color:var(--bf-accent-ink)}
[data-scheme="dark"] .bf-step[data-gate="true"] .bf-step-index{color:var(--bf-accent);filter:brightness(1.7)}
.bf-step h3{font-family:var(--bf-heading);font-size:1.12em;font-weight:800;margin:6px 0 5px;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-step h3{color:#fff}
.bf-step p{font-size:.86em;color:var(--bf-muted)}
[data-scheme="dark"] .bf-step p{color:#BFB3AD}

.bf-table-wrap{overflow-x:auto}
.bf-table{width:100%;border-collapse:collapse;min-width:520px}
.bf-table th,.bf-table td{padding:13px 16px;text-align:center;font-size:.88em;border-bottom:1px solid var(--bf-line)}
.bf-table thead th{background:var(--bf-paper-deep);font-weight:700;color:var(--bf-ink-strong);border-bottom:2px solid var(--bf-ink-strong)}
.bf-table tbody th{text-align:left;font-weight:600;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-table thead th,[data-scheme="dark"] .bf-table tbody th{color:#fff;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2)}
[data-scheme="dark"] .bf-table td{border-color:rgba(255,255,255,.12)}
.bf-yes{color:var(--bf-accent-ink);font-weight:800}
[data-scheme="dark"] .bf-yes{color:var(--bf-accent);filter:brightness(1.7)}
.bf-no{color:var(--bf-muted);opacity:.55}

.bf-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--bf-line)}
.bf-list li{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 6px;border-bottom:1px solid var(--bf-line)}
[data-scheme="dark"] .bf-list,[data-scheme="dark"] .bf-list li{border-color:rgba(255,255,255,.14)}
.bf-list-no{font-size:.76em;font-weight:800;color:var(--bf-accent-ink)}
[data-scheme="dark"] .bf-list-no{color:var(--bf-accent);filter:brightness(1.7)}
.bf-list-label{font-weight:600;font-size:.95em}
.bf-list-tags{display:flex;gap:5px}
.bf-list-tags i{font-style:normal;font-size:.66em;font-weight:700;letter-spacing:.06em;border:1px solid var(--bf-line);padding:3px 7px;color:var(--bf-muted);border-radius:calc(var(--bf-radius) / 2)}

.bf-gallery{display:grid;gap:14px}
.bf-gallery[data-cols="2"]{grid-template-columns:repeat(2,minmax(0,1fr))}
.bf-gallery[data-cols="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
.bf-gallery[data-cols="4"]{grid-template-columns:repeat(4,minmax(0,1fr))}
.bf-shot{margin:0}
.bf-shot-img{display:block;aspect-ratio:4/3;background-size:cover;background-position:center;background-color:var(--bf-paper-deep);border-radius:var(--bf-radius)}
.bf-shot-img[data-empty="1"]{background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.05) 0 10px,transparent 10px 20px)}
.bf-shot figcaption{font-size:.8em;color:var(--bf-muted);margin-top:8px}

.bf-rich .bf-body{font-size:.98em;color:var(--bf-ink)}
.bf-rich .bf-body p{margin:0 0 1.05em}
.bf-rich .bf-body h3{font-family:var(--bf-heading);font-size:1.25em;font-weight:800;margin:1.4em 0 .5em;color:var(--bf-ink-strong)}
.bf-rich .bf-body h3:first-child{margin-top:0}
.bf-rich .bf-body ul{margin:0 0 1.05em;padding-left:1.3em}
.bf-rich .bf-body li{margin:.25em 0}
[data-scheme="dark"] .bf-rich .bf-body{color:#D9CFCA}
[data-scheme="dark"] .bf-rich .bf-body h3{color:#fff}

.bf-cta{text-align:center;max-width:680px;margin:0 auto}
.bf-cta p{opacity:.85;margin-bottom:22px}
.bf-cta small{display:block;margin-top:14px;font-size:.76em;opacity:.6}

.bf-board{border-top:2px solid var(--bf-ink-strong)}
[data-scheme="dark"] .bf-board{border-top-color:rgba(255,255,255,.5)}
.bf-board-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:14px 0}
.bf-board-cats{display:flex;flex-wrap:wrap;gap:4px}
.bf-board-cats button{font:inherit;font-size:.78em;font-weight:700;padding:6px 13px;border:1px solid var(--bf-line);border-radius:999px;background:transparent;color:var(--bf-muted);cursor:pointer}
.bf-board-cats button.is-on{background:var(--bf-ink-strong);color:#fff;border-color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-board-cats button{border-color:rgba(255,255,255,.25);color:#C6BAB4}
[data-scheme="dark"] .bf-board-cats button.is-on{background:#fff;color:var(--bf-ink-strong);border-color:#fff}
.bf-board-search{margin-left:auto;display:flex;gap:4px}
.bf-board-search input{font:inherit;font-size:.86em;padding:7px 11px;border:1px solid var(--bf-line);border-radius:var(--bf-radius);min-width:170px;color:var(--bf-ink);background:#fff}
.bf-board-head{display:grid;grid-template-columns:64px minmax(0,1fr) 110px 108px;gap:12px;padding:12px 14px;font-size:.76em;font-weight:700;letter-spacing:.06em;color:var(--bf-muted);background:var(--bf-paper-deep);border-bottom:1px solid var(--bf-line)}
.bf-board-head span:first-child{grid-column:2}
[data-scheme="dark"] .bf-board-head{background:rgba(255,255,255,.06);color:#C6BAB4;border-color:rgba(255,255,255,.14)}
.bf-posts{list-style:none;margin:0;padding:0}
.bf-post{display:grid;grid-template-columns:64px minmax(0,1fr) 110px 108px;gap:12px;align-items:center;padding:14px;border-bottom:1px solid var(--bf-line);cursor:pointer}
.bf-post[hidden]{display:none}
.bf-post:hover{background:var(--bf-paper-deep)}
[data-scheme="dark"] .bf-post{border-color:rgba(255,255,255,.12)}
[data-scheme="dark"] .bf-post:hover{background:rgba(255,255,255,.05)}
.bf-post-badge{font-size:.72em;font-weight:700;color:var(--bf-muted);text-align:center;white-space:nowrap}
.bf-post-main{display:flex;align-items:center;gap:8px;min-width:0}
.bf-post-cat{flex:none;font-size:.7em;font-weight:800;letter-spacing:.04em;color:var(--bf-accent-ink);border:1px solid currentColor;padding:1px 7px;border-radius:999px;opacity:.85}
[data-scheme="dark"] .bf-post-cat{color:var(--bf-accent);filter:brightness(1.7)}
.bf-post-clip{flex:none;font-size:.8em;opacity:.6}
.bf-post-title{font-weight:600;font-size:.94em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bf-post-author,.bf-post-date{font-size:.79em;color:var(--bf-muted)}
.bf-board-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 4px 0}
.bf-board-count{font-size:.79em;color:var(--bf-muted);margin-right:auto}
.bf-board-pages{display:flex;gap:3px}
.bf-board-pages:empty{display:none}
.bf-board-pages button{font:inherit;font-size:.78em;min-width:30px;height:30px;padding:0 6px;border:1px solid var(--bf-line);background:transparent;border-radius:6px;cursor:pointer;color:var(--bf-muted)}
.bf-board-pages button.is-on{background:var(--bf-accent);color:#fff;border-color:var(--bf-accent)}
.bf-read-cat{font-size:.74em;font-weight:800;letter-spacing:.08em;color:var(--bf-accent-ink);margin-top:22px}
.bf-read-cat:empty{display:none}
.bf-read-title{font-family:var(--bf-heading);font-size:1.35em;font-weight:800;margin:6px 0 6px}
.bf-read-meta{font-size:.79em;color:var(--bf-muted);padding-bottom:16px;border-bottom:1px solid var(--bf-line)}
.bf-read-body{padding:20px 0;font-size:.93em;white-space:pre-wrap}
.bf-read-link{padding-bottom:16px}
.bf-read-link[hidden]{display:none}
.bf-board-form{display:grid;gap:14px;padding-top:22px}
/* 화면 전환은 hidden으로 한다 — display를 준 화면이 hidden을 이겨 두 화면이 겹치지 않게 */
.bf-board-view[hidden]{display:none!important}
.bf-board-form label{display:grid;gap:6px;font-size:.8em;font-weight:700;color:var(--bf-muted)}
.bf-board-form input,.bf-board-form textarea,.bf-board-form select{font:inherit;font-size:1rem;font-weight:400;color:var(--bf-ink);padding:11px 13px;border:1px solid var(--bf-line);border-radius:var(--bf-radius);background:#fff;width:100%}
.bf-board-form textarea{resize:vertical}
/* 카드형 — 소식·블로그처럼 제목이 큰 카드로 선다 */
.bf-board[data-style="card"]{border-top:0}
.bf-board[data-style="card"] .bf-board-head{display:none}
.bf-board[data-style="card"] .bf-posts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.bf-board[data-style="card"] .bf-post{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto 1fr auto;gap:8px 6px;align-items:start;padding:20px;border:1px solid var(--bf-line);border-radius:var(--bf-radius);background:#fff}
.bf-board[data-style="card"] .bf-post:hover{background:#fff;transform:translateY(-3px);box-shadow:0 12px 30px rgba(20,14,12,.09)}
[data-scheme="dark"] .bf-board[data-style="card"] .bf-post{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.16)}
.bf-board[data-style="card"] .bf-post-badge{grid-column:1/-1;text-align:left;font-size:.66em;letter-spacing:.14em;text-transform:uppercase}
.bf-board[data-style="card"] .bf-post-main{grid-column:1/-1;flex-wrap:wrap}
.bf-board[data-style="card"] .bf-post-title{white-space:normal;font-size:1.05em;font-family:var(--bf-heading);font-weight:800;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-board[data-style="card"] .bf-post-title{color:#fff}
.bf-board[data-style="card"] .bf-post-author{grid-column:1;align-self:end;padding-top:8px}
.bf-board[data-style="card"] .bf-post-author::after{content:" ·"}
.bf-board[data-style="card"] .bf-post-date{grid-column:2;align-self:end;padding-top:8px}

.bf-faq{display:grid;gap:10px;max-width:860px}
.bf-faq-item{border:1px solid var(--bf-line);border-radius:var(--bf-radius);background:#fff;padding:0 20px}
[data-scheme="dark"] .bf-faq-item{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.16)}
.bf-faq-item summary{list-style:none;cursor:pointer;display:flex;gap:14px;align-items:flex-start;padding:16px 0;font-weight:700;font-size:1em;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-faq-item summary{color:#fff}
.bf-faq-item summary::-webkit-details-marker{display:none}
.bf-faq-item summary::before{content:"Q";flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:var(--bf-accent);color:#fff;font-size:.72em;font-weight:800;margin-top:2px}
.bf-faq-item summary::after{content:"+";margin-left:auto;color:var(--bf-muted);font-weight:400;font-size:1.3em;line-height:1.2}
.bf-faq-item[open] summary::after{content:"−"}
.bf-faq-item summary > span{flex:1;min-width:0}
.bf-faq-a{padding:0 0 18px 40px;font-size:.93em;color:var(--bf-muted);white-space:pre-wrap}
[data-scheme="dark"] .bf-faq-a{color:#C6BAB4}

.bf-contact{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(24px,5vw,56px);align-items:start}
.bf-contact-info{display:grid;gap:16px;margin:0;font-size:.95em}
.bf-contact-info dt{font-size:.68em;font-weight:800;letter-spacing:.16em;color:var(--bf-muted);text-transform:uppercase}
.bf-contact-info dd{margin:2px 0 0;font-weight:600;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-contact-info dd{color:#fff}
.bf-contact-form{display:grid;gap:12px;padding:24px;border:1px solid var(--bf-line);border-radius:var(--bf-radius);background:#fff;margin:0}
[data-scheme="dark"] .bf-contact-form{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.16)}
.bf-contact-form label{display:grid;gap:6px;font-size:.8em;font-weight:700;color:var(--bf-muted)}
[data-scheme="dark"] .bf-contact-form label{color:#C6BAB4}
.bf-contact-form input,.bf-contact-form textarea{font:inherit;font-size:1rem;font-weight:400;color:var(--bf-ink);padding:11px 13px;border:1px solid var(--bf-line);border-radius:var(--bf-radius);background:#fff;width:100%;resize:vertical}
.bf-contact-form .bf-btn{justify-self:start}
.bf-contact-form small{font-size:.76em;color:var(--bf-muted)}

.bf-map{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:clamp(20px,4vw,48px);align-items:start}
.bf-map-frame{width:100%;border:0;border-radius:var(--bf-radius);background:var(--bf-paper-deep);display:block}
.bf-map-ph{display:grid;place-items:center;border-radius:var(--bf-radius);background:var(--bf-paper-deep);color:var(--bf-muted);font-size:.86em;border:1px dashed var(--bf-line);text-align:center;padding:20px}
.bf-map-addr{font-weight:700;font-size:1.05em;margin-bottom:14px;color:var(--bf-ink-strong)}
[data-scheme="dark"] .bf-map-addr{color:#fff}
.bf-map-dirs{list-style:none;margin:0;padding:0;display:grid;gap:9px;font-size:.9em;color:var(--bf-muted)}
[data-scheme="dark"] .bf-map-dirs{color:#C6BAB4}
.bf-map-dirs li{padding-left:16px;position:relative}
.bf-map-dirs li::before{content:"";position:absolute;left:0;top:.72em;width:6px;height:6px;border-radius:50%;background:var(--bf-accent)}

.bf-video{max-width:960px;margin:0}
.bf-video-frame{position:relative;aspect-ratio:16/9;border-radius:var(--bf-radius);overflow:hidden;background:#0B0F14}
.bf-video-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.bf-video-ph{position:absolute;inset:0;display:grid;place-items:center;background-size:cover;background-position:center;color:#fff;font-size:.9em}
.bf-video-ph:not([data-empty])::after{content:"▶";width:64px;height:64px;display:grid;place-items:center;border-radius:50%;background:rgba(0,0,0,.6);font-size:22px;padding-left:4px}
.bf-video figcaption{margin-top:10px;font-size:.84em;color:var(--bf-muted)}

.bf-footer{display:flex;flex-wrap:wrap;gap:22px;justify-content:space-between;align-items:flex-start}
.bf-foot-brand{display:block;font-family:var(--bf-heading);font-size:1.1em;font-weight:800;margin-bottom:10px}
.bf-footer p{font-size:.82em;opacity:.72;margin:2px 0}
.bf-foot-links{display:flex;flex-wrap:wrap;gap:18px;font-size:.82em;opacity:.85}
.bf-foot-link{text-decoration:none}
a.bf-foot-link:hover{text-decoration:underline}

/* ── 레이아웃 ──────────────────────────────────────────────
   구역 마크업은 같고, 감싸는 틀과 그 틀에 딸린 규칙만 다르다. */
.bf-page{min-height:100%}

/* 박스형 — 가운데 상자, 바깥은 진한 바탕 */
.bf-page[data-layout="boxed"]{background:var(--bf-paper-deep);padding:clamp(14px,3vw,44px) clamp(12px,3vw,32px)}
.bf-box{max-width:1180px;margin:0 auto;box-shadow:0 24px 70px rgba(10,20,30,.16);border-radius:calc(var(--bf-radius) * 1.5)}
.bf-box > .bf-sec:first-child{border-radius:calc(var(--bf-radius) * 1.5) calc(var(--bf-radius) * 1.5) 0 0}
.bf-box > .bf-sec:last-child{border-radius:0 0 calc(var(--bf-radius) * 1.5) calc(var(--bf-radius) * 1.5)}
.bf-box > .bf-sec--header[data-sticky="1"]{border-radius:0}

/* 센터형 — 모든 것이 가운데 */
.bf-page[data-layout="centered"] .bf-inner{text-align:center}
.bf-page[data-layout="centered"] .bf-head,.bf-page[data-layout="centered"] .bf-hero,.bf-page[data-layout="centered"] .bf-hero-desc,.bf-page[data-layout="centered"] .bf-rich,.bf-page[data-layout="centered"] .bf-faq,.bf-page[data-layout="centered"] .bf-video{margin-left:auto;margin-right:auto}
.bf-page[data-layout="centered"] .bf-actions,.bf-page[data-layout="centered"] .bf-stats{justify-content:center}
.bf-page[data-layout="centered"] .bf-nav{flex-direction:column;gap:14px}
.bf-page[data-layout="centered"] .bf-menu{margin-left:0;justify-content:center;flex-wrap:wrap}
.bf-page[data-layout="centered"] .bf-burger{margin-left:0}
.bf-page[data-layout="centered"] .bf-card,.bf-page[data-layout="centered"] .bf-step{align-items:center;text-align:center}
.bf-page[data-layout="centered"] .bf-step{border-top:0;border-bottom:2px solid var(--bf-line);padding:0 4px 16px}
.bf-page[data-layout="centered"] .bf-step[data-gate="true"]{border-bottom-color:var(--bf-accent)}
.bf-page[data-layout="centered"] .bf-rich{max-width:760px}
.bf-page[data-layout="centered"] .bf-list,.bf-page[data-layout="centered"] .bf-board,.bf-page[data-layout="centered"] .bf-faq,.bf-page[data-layout="centered"] .bf-contact,.bf-page[data-layout="centered"] .bf-map,.bf-page[data-layout="centered"] .bf-table tbody th{text-align:left}
.bf-page[data-layout="centered"] .bf-footer{flex-direction:column;align-items:center}
.bf-page[data-layout="centered"] .bf-art{left:50%;right:auto;transform:translate(-50%,-50%);opacity:.28;width:min(60%,520px)}

/* 포털형 — 본문 구역 둘이 한 줄에 */
.bf-page[data-layout="portal"] .bf-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
.bf-page[data-layout="portal"] .bf-row > .bf-sec{padding-left:clamp(20px,3vw,40px);padding-right:clamp(20px,3vw,40px)}
.bf-page[data-layout="portal"] .bf-row > .bf-sec:first-child{box-shadow:inset -1px 0 var(--bf-line)}
.bf-page[data-layout="portal"] .bf-row .bf-inner{max-width:630px}
.bf-page[data-layout="portal"] .bf-row > .bf-sec:first-child .bf-inner{margin-right:0}
.bf-page[data-layout="portal"] .bf-row > .bf-sec:last-child .bf-inner{margin-left:0}
.bf-page[data-layout="portal"] .bf-row .bf-head{margin-bottom:22px}
.bf-page[data-layout="portal"] .bf-row .bf-h2{font-size:clamp(20px,2.2vw,27px)}
.bf-page[data-layout="portal"] .bf-row .bf-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.bf-page[data-layout="portal"] .bf-row .bf-card{padding:18px 16px 16px}
.bf-page[data-layout="portal"] .bf-row .bf-contact,.bf-page[data-layout="portal"] .bf-row .bf-map{grid-template-columns:1fr}
.bf-page[data-layout="portal"] .bf-row .bf-board[data-style="card"] .bf-posts{grid-template-columns:repeat(2,minmax(0,1fr))}
.bf-page[data-layout="portal"] .bf-row .bf-board-search input{min-width:120px}

@media (min-width:901px){
  /* 사이드 메뉴형 — 상단 메뉴가 왼쪽 기둥이 된다 */
  .bf-page[data-layout="sidebar"]{display:grid;grid-template-columns:272px minmax(0,1fr)}
  .bf-side{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;border-right:1px solid var(--bf-line);z-index:2}
  .bf-side .bf-sec{min-height:100vh;padding:30px 22px}
  .bf-side .bf-sec--header[data-sticky="1"]{position:static;box-shadow:none}
  .bf-side .bf-inner{max-width:none}
  .bf-side .bf-nav{flex-direction:column;align-items:stretch;gap:26px;min-height:calc(100vh - 60px)}
  .bf-side .bf-brand{align-items:center}
  .bf-side .bf-menu{flex-direction:column;gap:2px;margin-left:0;font-size:.95em}
  .bf-side .bf-menu-item{padding:10px 12px;border-radius:var(--bf-radius)}
  .bf-side a.bf-menu-item:hover{background:var(--bf-paper-deep)}
  .bf-side .bf-nav .bf-btn{margin-top:auto;width:100%}
  .bf-side .bf-burger{display:none}

  /* 분할형 — 제목은 왼쪽, 내용은 오른쪽 */
  .bf-page[data-layout="split"] .bf-sec--cards .bf-inner,.bf-page[data-layout="split"] .bf-sec--steps .bf-inner,.bf-page[data-layout="split"] .bf-sec--table .bf-inner,.bf-page[data-layout="split"] .bf-sec--list .bf-inner,.bf-page[data-layout="split"] .bf-sec--gallery .bf-inner,.bf-page[data-layout="split"] .bf-sec--board .bf-inner,.bf-page[data-layout="split"] .bf-sec--faq .bf-inner,.bf-page[data-layout="split"] .bf-sec--contact .bf-inner,.bf-page[data-layout="split"] .bf-sec--map .bf-inner,.bf-page[data-layout="split"] .bf-sec--video .bf-inner{display:grid;grid-template-columns:minmax(200px,.7fr) minmax(0,2fr);gap:clamp(28px,5vw,64px);align-items:start}
  .bf-page[data-layout="split"] .bf-head{margin-bottom:0;position:sticky;top:96px}
  .bf-page[data-layout="split"] .bf-inner[data-align="center"]{text-align:left}
  .bf-page[data-layout="split"] .bf-hero{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.8fr);gap:clamp(28px,5vw,72px);max-width:none;align-items:center}
  .bf-page[data-layout="split"] .bf-stats{flex-direction:column;gap:22px;margin:0;padding:0 0 0 36px;border-top:0;border-left:1px solid color-mix(in srgb,currentColor 22%,transparent)}
  .bf-page[data-layout="split"] .bf-rich{display:grid;grid-template-columns:minmax(200px,.7fr) minmax(0,2fr);gap:clamp(28px,5vw,64px);align-items:start}
  .bf-page[data-layout="split"] .bf-rich .bf-body{grid-column:2;grid-row:1/span 2}
  .bf-page[data-layout="split"] .bf-inner[data-w="narrow"]{max-width:1100px}
  .bf-page[data-layout="split"] .bf-cta{max-width:none;text-align:left;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 36px;align-items:center}
  .bf-page[data-layout="split"] .bf-cta .bf-btn{grid-column:2;grid-row:1/span 3}
  .bf-page[data-layout="split"] .bf-cta p{margin-bottom:0}
  .bf-page[data-layout="split"] .bf-cta small{margin-top:4px}
  .bf-page[data-layout="split"] .bf-faq{max-width:none}
  .bf-page[data-layout="split"] .bf-art{display:none}
}

@media (max-width:900px){
  .bf-cards[data-cols="3"],.bf-cards[data-cols="4"]{grid-template-columns:repeat(2,minmax(0,1fr))}
  .bf-gallery[data-cols="4"]{grid-template-columns:repeat(2,minmax(0,1fr))}
  .bf-board[data-style="card"] .bf-posts{grid-template-columns:repeat(2,minmax(0,1fr))}
  .bf-menu{display:none}
  .bf-burger{display:grid}
  .bf-nav{flex-wrap:wrap;gap:14px}
  .bf-nav:has(.bf-nav-toggle:checked) .bf-menu{display:flex;flex-direction:column;gap:0;width:100%;order:10;margin:4px 0 0;padding-top:8px;border-top:1px solid var(--bf-line)}
  .bf-nav:has(.bf-nav-toggle:checked) .bf-menu-item{padding:11px 4px;border-bottom:1px solid var(--bf-line)}
  .bf-nav:has(.bf-nav-toggle:checked) .bf-burger span{background:transparent}
  .bf-nav:has(.bf-nav-toggle:checked) .bf-burger span::before{transform:rotate(45deg);top:0}
  .bf-nav:has(.bf-nav-toggle:checked) .bf-burger span::after{transform:rotate(-45deg);top:0}
  .bf-contact,.bf-map{grid-template-columns:1fr}
  .bf-art{width:min(70%,360px);opacity:.22;right:-10%}
  .bf-page[data-layout="portal"] .bf-row{grid-template-columns:1fr}
  .bf-page[data-layout="portal"] .bf-row > .bf-sec:first-child{box-shadow:none}
  .bf-page[data-layout="portal"] .bf-row .bf-inner{max-width:none}
  .bf-page[data-layout="boxed"]{padding:0}
  .bf-box,.bf-box > .bf-sec:first-child,.bf-box > .bf-sec:last-child{border-radius:0;box-shadow:none}
}
@media (max-width:620px){
  .bf-cards[data-cols="2"],.bf-cards[data-cols="3"],.bf-cards[data-cols="4"]{grid-template-columns:1fr}
  .bf-gallery[data-cols="2"],.bf-gallery[data-cols="3"],.bf-gallery[data-cols="4"]{grid-template-columns:1fr}
  .bf-board[data-style="card"] .bf-posts{grid-template-columns:1fr}
  .bf-board-head{display:none}
  .bf-post{grid-template-columns:auto minmax(0,1fr);gap:6px 10px}
  .bf-post-main{grid-column:2}
  .bf-post-title{white-space:normal}
  .bf-post-author,.bf-post-date{grid-column:2;display:inline}
  .bf-board-search{margin-left:0;width:100%}
  .bf-board-search input{flex:1;min-width:0}
  .bf-stats{gap:20px}
}
`.trim();
