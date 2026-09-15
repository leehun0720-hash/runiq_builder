/**
 * 홈페이지 빌더 — 문서 모델.
 *
 * 이 파일은 순수 데이터 정의만 둔다(서버·브라우저 모두에서 쓰이고, 테스트도
 * 여기서 시작한다). 화면으로 그리는 일은 render.ts, 내보내기는 export.ts가 맡는다.
 *
 * 설계 원칙 — 구역(Section)이 단위다. 잘 만든 기업 사이트가 히어로·서비스 카드·
 * 진행 절차·비교표·목록·게시판·푸터로 짜여 있는 것과 같은 골격을 그대로 조립
 * 부품으로 만든 것이다. 부품마다 배경·여백·정렬·색 반전을 따로 갖는다.
 *
 * 색과 예시 문구는 텐에이아이 톤(미니멀·신뢰감)을 따른다. 고객이 중소기업이든
 * 공공기관이든 글자만 바꾸면 그대로 쓸 수 있는 자리를 만들어 둔다.
 */

import { BRAND_COLORS } from "./brand";

/** 배경 — 구역마다 따로 정한다 */
export type Background =
  | { kind: "none" }
  | { kind: "solid"; color: string }
  | { kind: "gradient"; from: string; to: string; angle: number }
  | { kind: "image"; url: string; overlay: number };

export type Padding = "sm" | "md" | "lg" | "xl";
export type Width = "narrow" | "normal" | "wide" | "full";
export type Align = "left" | "center";
/** 어두운 바탕에서는 글자색을 통째로 뒤집는다 */
export type Scheme = "light" | "dark";

export type SectionBase = {
  id: string;
  /** 좌측 구역 목록에 뜨는 이름 — 회장님이 알아보실 이름이다 */
  name: string;
  background: Background;
  padding: Padding;
  width: Width;
  align: Align;
  scheme: Scheme;
  hidden?: boolean;
  /** 배경 위에 옅게 까는 무늬 — art.ts 의 PATTERNS 가운데 하나 */
  pattern?: string;
};

/**
 * 링크 — 같은 페이지의 구역(#s-아이디), 바깥 주소(https://…), 메일(mailto:), 전화(tel:).
 * 비어 있으면 그냥 글자로만 선다. 편집 화면에서는 눌러도 이동하지 않는다.
 */
export type MenuItem = { label: string; href?: string };
export type Stat = { value: string; label: string };
export type Card = { no: string; title: string; en: string; desc: string; meta: string; image: string; href?: string; icon?: string };
export type Step = { index: string; name: string; desc: string; gate: boolean; icon?: string };
export type TableRow = { label: string; cells: string[] };
export type ListItem = { no: string; label: string; meta: string; tags: string[] };
export type GalleryImage = { url: string; caption: string };
export type Post = {
  id: string;
  title: string;
  author: string;
  date: string;
  body: string;
  notice: boolean;
  /** 말머리 — 게시판의 분류 목록 가운데 하나 */
  category?: string;
  /** 첨부 파일이나 관련 주소 — 자료실에서 쓴다 */
  link?: string;
};
export type FooterLink = { label: string; href?: string };
export type FaqItem = { q: string; a: string };

export type HeaderSection = SectionBase & {
  kind: "header";
  logo: string;
  sub: string;
  /** 로고 그림. 비어 있으면 강조색 네모가 대신 선다. */
  logoImage: string;
  /** 화면에 세울 로고 높이(px). 가로는 비율대로 따라간다. */
  logoHeight: number;
  menu: MenuItem[];
  cta: string;
  ctaHref?: string;
  /** 스크롤해도 위에 붙어 있게 */
  sticky?: boolean;
};

export type HeroSection = SectionBase & {
  kind: "hero";
  eyebrow: string;
  title: string;
  titleEm: string;
  desc: string;
  primary: string;
  secondary: string;
  primaryHref?: string;
  secondaryHref?: string;
  stats: Stat[];
  /** 오른쪽에 서는 삽화 — art.ts 의 ILLUSTRATIONS 가운데 하나. 비우면 없음 */
  art?: string;
};

export type CardsSection = SectionBase & {
  kind: "cards";
  eyebrow: string;
  title: string;
  lead: string;
  columns: number;
  cards: Card[];
};

export type StepsSection = SectionBase & {
  kind: "steps";
  eyebrow: string;
  title: string;
  lead: string;
  steps: Step[];
};

export type TableSection = SectionBase & {
  kind: "table";
  eyebrow: string;
  title: string;
  lead: string;
  columns: string[];
  rows: TableRow[];
};

export type ListSection = SectionBase & {
  kind: "list";
  eyebrow: string;
  title: string;
  lead: string;
  items: ListItem[];
};

export type GallerySection = SectionBase & {
  kind: "gallery";
  eyebrow: string;
  title: string;
  lead: string;
  columns: number;
  images: GalleryImage[];
};

export type RichSection = SectionBase & {
  kind: "rich";
  eyebrow: string;
  title: string;
  body: string;
};

export type CtaSection = SectionBase & {
  kind: "cta";
  title: string;
  desc: string;
  button: string;
  buttonHref?: string;
  note: string;
};

export type BoardSection = SectionBase & {
  kind: "board";
  eyebrow: string;
  title: string;
  lead: string;
  /** 브라우저 저장소에서 이 게시판의 글을 구분하는 열쇠 */
  boardKey: string;
  pageSize: number;
  allowWrite: boolean;
  /** 목록형(공지·자료실) / 카드형(소식·블로그) */
  style?: "list" | "card";
  /** 말머리 목록 — 비어 있으면 분류 없이 한 줄로 */
  categories?: string[];
  /** 제목·본문 검색 칸 */
  search?: boolean;
  posts: Post[];
};

export type FaqSection = SectionBase & {
  kind: "faq";
  eyebrow: string;
  title: string;
  lead: string;
  items: FaqItem[];
};

export type ContactSection = SectionBase & {
  kind: "contact";
  eyebrow: string;
  title: string;
  lead: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  /**
   * 문의를 받을 주소(Formspree 같은 폼 수신 서비스). 비우면 방문자의 메일
   * 프로그램이 열려 위 메일 주소로 보내진다 — 서버 없이도 문의가 닿는다.
   */
  endpoint: string;
  button: string;
  note: string;
};

export type MapSection = SectionBase & {
  kind: "map";
  eyebrow: string;
  title: string;
  lead: string;
  address: string;
  /** 지도에서 찾을 검색어 — 비우면 주소를 그대로 찾는다 */
  query: string;
  height: number;
  /** 교통·주차 안내 줄 */
  directions: string[];
};

export type VideoSection = SectionBase & {
  kind: "video";
  eyebrow: string;
  title: string;
  lead: string;
  /** 유튜브 주소 — 어느 형태로 붙여 넣어도 영상 id를 찾아낸다 */
  url: string;
  caption: string;
};

export type FooterSection = SectionBase & {
  kind: "footer";
  brand: string;
  lines: string[];
  links: FooterLink[];
};

export type Section =
  | HeaderSection
  | HeroSection
  | CardsSection
  | StepsSection
  | TableSection
  | ListSection
  | GallerySection
  | RichSection
  | CtaSection
  | BoardSection
  | FaqSection
  | ContactSection
  | MapSection
  | VideoSection
  | FooterSection;

export type SectionKind = Section["kind"];

export type Theme = {
  accent: string;
  accentInk: string;
  paper: string;
  paperDeep: string;
  ink: string;
  inkStrong: string;
  line: string;
  muted: string;
  heading: "serif" | "sans";
  radius: number;
  /** 본문 기준 글자 크기(px) — 전체 배율의 기준이 된다 */
  fontSize: number;
};

/**
 * 레이아웃 — 같은 구역들을 어떤 골격 위에 놓을지.
 *
 * 테마가 「색과 글꼴」이라면 레이아웃은 「뼈대」다. 내용은 그대로 두고 이것만
 * 바꿔도 전혀 다른 사이트처럼 보인다. 여섯 가지 모두 같은 구역 데이터를 쓰므로
 * 언제든 서로 바꿀 수 있다.
 */
export type LayoutId = "stack" | "boxed" | "sidebar" | "centered" | "split" | "portal";

export const LAYOUT_PRESETS: { id: LayoutId; name: string; desc: string }[] = [
  { id: "stack", name: "기본형", desc: "구역이 위에서 아래로 가득 찬 띠로 쌓입니다. 가장 흔한 회사 사이트 골격." },
  { id: "boxed", name: "박스형", desc: "페이지가 가운데 상자에 담기고 바깥은 진한 바탕. 브로슈어·안내문 느낌." },
  { id: "sidebar", name: "사이드 메뉴형", desc: "메뉴가 왼쪽에 세로로 고정되고 본문은 오른쪽에서 흐릅니다. 포털·자료 사이트." },
  { id: "centered", name: "센터형", desc: "로고·메뉴·제목이 모두 가운데. 여백이 넉넉한 미니멀 사이트." },
  { id: "split", name: "분할형", desc: "구역 제목은 왼쪽, 내용은 오른쪽 2단. 편집 매거진 같은 인상." },
  { id: "portal", name: "포털형", desc: "본문 구역이 2열 격자로 나란히. 게시판·카드가 한눈에 보이는 기관 사이트." },
];

export const DEFAULT_LAYOUT: LayoutId = "stack";

export type SiteDoc = {
  version: 1;
  title: string;
  theme: Theme;
  /** 비어 있으면 기본형 — 레이아웃 이전에 저장한 문서도 그대로 열린다 */
  layout?: LayoutId;
  /** 검색 결과와 링크 미리보기에 뜨는 한 줄 소개 */
  description?: string;
  /** 브라우저 탭에 뜨는 작은 아이콘 — 그림 주소나 올린 파일 */
  favicon?: string;
  sections: Section[];
};

/** 문서의 레이아웃 — 모르는 값이 들어와도 기본형으로 선다 */
export function layoutOf(doc: { layout?: string }): LayoutId {
  return LAYOUT_PRESETS.some((l) => l.id === doc.layout) ? (doc.layout as LayoutId) : DEFAULT_LAYOUT;
}

/** 구역 추가 화면에 뜨는 목록 — 이름과 한 줄 설명 */
export const SECTION_CATALOG: { kind: SectionKind; name: string; desc: string }[] = [
  { kind: "header", name: "상단 메뉴", desc: "로고 그림·메뉴·오른쪽 버튼" },
  { kind: "hero", name: "히어로", desc: "큰 제목·설명·버튼과 성과 숫자" },
  { kind: "cards", name: "카드 그리드", desc: "분야·서비스·상품을 카드로 나열" },
  { kind: "steps", name: "단계 흐름", desc: "STEP 01~04처럼 순서를 보여 준다" },
  { kind: "table", name: "비교표", desc: "등급·요금처럼 항목을 견주는 표" },
  { kind: "list", name: "목록", desc: "주제·커리큘럼처럼 번호가 붙는 줄 목록" },
  { kind: "gallery", name: "이미지 갤러리", desc: "사진을 격자로 배치" },
  { kind: "rich", name: "글 구역", desc: "제목과 본문 문단" },
  { kind: "cta", name: "강조 배너", desc: "문의·신청을 부르는 띠" },
  { kind: "board", name: "게시판", desc: "공지·자료실·소식 — 분류·검색·글쓰기" },
  { kind: "faq", name: "자주 묻는 질문", desc: "질문을 누르면 답이 펼쳐지는 FAQ" },
  { kind: "contact", name: "문의 폼", desc: "연락처와 문의 양식 — 메일로 받기" },
  { kind: "map", name: "오시는 길", desc: "지도와 교통·주차 안내" },
  { kind: "video", name: "동영상", desc: "유튜브 영상을 넣습니다" },
  { kind: "footer", name: "푸터", desc: "회사 정보와 하단 링크" },
];

export const THEME_PRESETS: { id: string; name: string; theme: Theme }[] = [
  {
    id: "tenai",
    name: "텐에이아이 (기본)",
    theme: {
      accent: BRAND_COLORS.primary,
      accentInk: "#0B4A86",
      paper: BRAND_COLORS.paper,
      paperDeep: BRAND_COLORS.tint,
      ink: "#22303F",
      inkStrong: BRAND_COLORS.deep,
      line: "#D6E3F0",
      muted: "#5A6B7C",
      heading: "sans",
      radius: 12,
      fontSize: 16,
    },
  },
  {
    id: "gov",
    name: "중앙부처 (감청·정중)",
    theme: {
      accent: "#1C3F6E",
      accentInk: "#16345C",
      paper: "#F4F6F9",
      paperDeep: "#E8EDF4",
      ink: "#232B35",
      inkStrong: "#141C26",
      line: "#D2DAE4",
      muted: "#5B6673",
      heading: "serif",
      radius: 4,
      fontSize: 16,
    },
  },
  {
    id: "local",
    name: "지자체 (청록·친근)",
    theme: {
      accent: "#0E7C7B",
      accentInk: "#0B6665",
      paper: "#F2F8F7",
      paperDeep: "#E3F0EF",
      ink: "#1F2A2A",
      inkStrong: "#12201F",
      line: "#CCE0DE",
      muted: "#536665",
      heading: "sans",
      radius: 10,
      fontSize: 16,
    },
  },
  {
    id: "edu",
    name: "교육·아카데미 (따뜻한 주황)",
    theme: {
      accent: "#E0632A",
      accentInk: "#BF4E1D",
      paper: "#FBF7F3",
      paperDeep: "#F5EDE5",
      ink: "#2C2621",
      inkStrong: "#1E1916",
      line: "#E4D9CD",
      muted: "#6B5F55",
      heading: "sans",
      radius: 14,
      fontSize: 16,
    },
  },
  {
    id: "mono",
    name: "모노 (IT·스타트업)",
    theme: {
      accent: "#111111",
      accentInk: "#111111",
      paper: "#FFFFFF",
      paperDeep: "#F4F4F4",
      ink: "#1A1A1A",
      inkStrong: "#000000",
      line: "#E0E0E0",
      muted: "#666666",
      heading: "sans",
      radius: 14,
      fontSize: 16,
    },
  },
];

export const DEFAULT_THEME: Theme = THEME_PRESETS[0].theme;

/** 충돌하지 않는 짧은 id — 문서 안에서만 유일하면 된다 */
export function newId(prefix = "s"): string {
  return `${prefix}${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 6)}`;
}

const BASE = (name: string): SectionBase => ({
  id: newId(),
  name,
  background: { kind: "none" },
  padding: "lg",
  width: "normal",
  align: "left",
  scheme: "light",
});

/** 구역을 새로 하나 만든다 — 빈 껍데기가 아니라 바로 보기 좋은 예시가 들어간다 */
export function newSection(kind: SectionKind): Section {
  switch (kind) {
    case "header":
      return {
        ...BASE("상단 메뉴"),
        kind,
        padding: "sm",
        width: "wide",
        logo: "브랜드 이름",
        sub: "BRAND",
        logoImage: "",
        logoHeight: 34,
        menu: [{ label: "회사소개" }, { label: "서비스" }, { label: "공지사항" }, { label: "문의" }],
        cta: "상담 신청",
      };
    case "hero":
      return {
        ...BASE("히어로"),
        kind,
        padding: "xl",
        scheme: "dark",
        background: { kind: "gradient", from: BRAND_COLORS.deep, to: "#123A63", angle: 160 },
        eyebrow: "ABOUT US",
        title: "한 줄로 각인되는",
        titleEm: "핵심 메시지",
        desc: "무엇을 하는 회사인지, 왜 당신에게 필요한지를 두세 문장으로 설명합니다.",
        primary: "상담 신청",
        secondary: "회사 소개",
        stats: [
          { value: "○○년", label: "업력" },
          { value: "○○건", label: "수행 실적" },
          { value: "○개", label: "전문 분야" },
        ],
      };
    case "cards":
      return {
        ...BASE("카드 그리드"),
        kind,
        eyebrow: "SERVICES",
        title: "주요 업무",
        lead: "제공하는 서비스를 한눈에 보여 주는 구역입니다.",
        columns: 3,
        cards: [1, 2, 3].map((n) => ({
          no: String(n).padStart(2, "0"),
          title: `서비스 ${n}`,
          en: `SERVICE ${n}`,
          desc: "이 서비스가 고객의 어떤 문제를 푸는지 한두 문장으로 적습니다.",
          meta: "자세히 보기",
          image: "",
        })),
      };
    case "steps":
      return {
        ...BASE("단계 흐름"),
        kind,
        eyebrow: "PROCESS",
        title: "진행 절차",
        lead: "문의부터 완료까지 어떻게 흘러가는지 보여 줍니다.",
        steps: [
          { index: "STEP 01", name: "문의 접수", desc: "상담 신청을 남기시면 담당자가 연락드립니다.", gate: false },
          { index: "STEP 02", name: "검토·제안", desc: "요건을 검토하고 방향과 일정을 제안합니다.", gate: false },
          { index: "STEP 03", name: "계약", desc: "조건을 확정하고 계약을 체결합니다.", gate: true },
          { index: "STEP 04", name: "수행·완료", desc: "합의한 일정에 따라 수행하고 결과를 보고합니다.", gate: false },
        ],
      };
    case "table":
      return {
        ...BASE("비교표"),
        kind,
        eyebrow: "PLANS",
        title: "제공 범위",
        lead: "등급이나 요금제별로 무엇이 열리는지 비교합니다.",
        columns: ["기본", "표준", "프리미엄"],
        rows: [
          { label: "기본 상담", cells: ["O", "O", "O"] },
          { label: "정기 리포트", cells: ["X", "O", "O"] },
          { label: "전담 담당자", cells: ["X", "X", "O"] },
        ],
      };
    case "list":
      return {
        ...BASE("목록"),
        kind,
        eyebrow: "CURRICULUM",
        title: "세부 주제",
        lead: "번호가 붙는 목록으로 항목을 정리합니다.",
        items: [1, 2, 3, 4].map((n) => ({
          no: String(n).padStart(2, "0"),
          label: `주제 ${n} — 다루는 내용을 한 줄로`,
          meta: "",
          tags: ["기본", "심화"],
        })),
      };
    case "gallery":
      return {
        ...BASE("이미지 갤러리"),
        kind,
        eyebrow: "GALLERY",
        title: "현장 사진",
        lead: "이미지를 격자로 배치합니다. 사진을 올리거나 주소를 붙여 넣으세요.",
        columns: 3,
        images: [
          { url: "", caption: "사진 설명 1" },
          { url: "", caption: "사진 설명 2" },
          { url: "", caption: "사진 설명 3" },
        ],
      };
    case "rich":
      return {
        ...BASE("글 구역"),
        kind,
        width: "narrow",
        eyebrow: "ABOUT",
        title: "회사 소개",
        body:
          "여기에 본문을 씁니다. 줄을 바꾸면 문단이 나뉩니다.\n\n두 번째 문단입니다. 연혁·철학·인사말처럼 긴 글을 담는 자리입니다.",
      };
    case "cta":
      return {
        ...BASE("강조 배너"),
        kind,
        padding: "lg",
        align: "center",
        scheme: "dark",
        background: { kind: "solid", color: BRAND_COLORS.deep },
        title: "지금 상담을 신청하세요",
        desc: "담당자가 영업일 기준 1일 이내에 연락드립니다.",
        button: "상담 신청",
        note: "· 상담은 무료이며 비밀이 보장됩니다",
      };
    case "board":
      return {
        ...BASE("게시판"),
        kind,
        eyebrow: "BOARD",
        title: "공지사항",
        lead: "새 소식과 자료를 올리는 게시판입니다.",
        boardKey: newId("b"),
        pageSize: 8,
        allowWrite: true,
        style: "list",
        categories: ["공지", "안내", "자료"],
        search: true,
        posts: [
          {
            id: newId("p"),
            title: "홈페이지를 새로 열었습니다",
            author: "관리자",
            date: "2026-09-01",
            body: "새 홈페이지를 공개했습니다. 앞으로 이곳에서 소식을 전해 드리겠습니다.",
            notice: true,
            category: "공지",
          },
          {
            id: newId("p"),
            title: "추석 연휴 상담 안내",
            author: "관리자",
            date: "2026-09-03",
            body: "연휴 기간에는 접수만 받고, 회신은 연휴 다음 영업일에 순차적으로 드립니다.",
            notice: false,
            category: "안내",
          },
          {
            id: newId("p"),
            title: "회사 소개서 (PDF)",
            author: "관리자",
            date: "2026-09-05",
            body: "회사 소개서를 첨부합니다. 아래 단추를 눌러 내려받으십시오.",
            notice: false,
            category: "자료",
            link: "",
          },
        ],
      };
    case "faq":
      return {
        ...BASE("자주 묻는 질문"),
        kind,
        width: "narrow",
        eyebrow: "FAQ",
        title: "자주 묻는 질문",
        lead: "문의가 잦은 내용을 먼저 모았습니다. 질문을 누르면 답이 펼쳐집니다.",
        items: [
          { q: "상담은 어떻게 신청하나요?", a: "아래 문의 폼이나 대표 전화로 신청하시면 담당자가 영업일 기준 1일 이내에 연락드립니다." },
          { q: "비용은 어떻게 정해지나요?", a: "범위와 기간을 듣고 견적을 드립니다. 첫 상담은 무료입니다." },
          { q: "어느 지역까지 가능한가요?", a: "전국 어디든 가능하며, 원격으로도 진행합니다." },
        ],
      };
    case "contact":
      return {
        ...BASE("문의 폼"),
        kind,
        eyebrow: "CONTACT",
        title: "문의하기",
        lead: "궁금한 점을 남겨 주시면 담당자가 연락드립니다.",
        email: "contact@example.com",
        phone: "02-000-0000",
        address: "서울특별시 ○○구 ○○로 00, 0층",
        hours: "평일 09:00 – 18:00 (주말·공휴일 휴무)",
        endpoint: "",
        button: "문의 보내기",
        note: "남겨 주신 연락처는 답변에만 쓰고 보관하지 않습니다.",
      };
    case "map":
      return {
        ...BASE("오시는 길"),
        kind,
        eyebrow: "LOCATION",
        title: "오시는 길",
        lead: "방문 전에 연락 주시면 주차 안내를 도와드립니다.",
        address: "서울특별시 서초구 서초동 1604-19",
        query: "",
        height: 360,
        directions: ["지하철 — ○호선 ○○역 ○번 출구에서 도보 5분", "버스 — ○○, ○○번 ○○정류장 하차", "주차 — 건물 지하 주차장 2시간 무료"],
      };
    case "video":
      return {
        ...BASE("동영상"),
        kind,
        eyebrow: "VIDEO",
        title: "소개 영상",
        lead: "유튜브 주소를 붙여 넣으면 영상이 들어갑니다.",
        url: "",
        caption: "영상 설명을 적는 자리입니다.",
      };
    case "footer":
      return {
        ...BASE("푸터"),
        kind,
        padding: "md",
        scheme: "dark",
        background: { kind: "solid", color: BRAND_COLORS.deep },
        brand: "브랜드 이름",
        lines: ["서울특별시 ○○구 ○○로 00, 0층", "대표전화 02-000-0000 · 사업자등록번호 000-00-00000"],
        links: [{ label: "개인정보처리방침" }, { label: "이용약관" }, { label: "오시는 길" }],
      };
  }
}
