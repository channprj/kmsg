# Unified Navigation, Search, and Skill Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify every KMSG site page under one responsive shell, publish a four-locale Skill guide and canonical `/mcp/` route, refine the homepage interactions, and align visible content with SEO/AEO metadata.

**Architecture:** Extend the existing static generator rather than adding a second rendering system. `site/build.mjs` remains responsible for localized routes, shared HTML, structured data, redirects, and discovery files; four focused Markdown sources own Skill content; `site/src/styles.css` owns the shared visual system; and `site/test/build.test.mjs` locks every route and interaction contract before implementation.

**Tech Stack:** Node.js 22, ECMAScript modules, `marked`, `sanitize-html`, static HTML/CSS/JavaScript, Node test runner, GitHub Pages, Swift 6 verification.

---

## File Map

- Create `site/content/ko/skill.md`: Korean coding-agent Skill guide.
- Create `site/content/en/skill.md`: English canonical Skill guide.
- Create `site/content/jp/skill.md`: Japanese Skill guide.
- Create `site/content/cn/skill.md`: Simplified Chinese Skill guide.
- Modify `site/build.mjs`: route definitions, shared header, homepage components,
  redirects, metadata, JSON-LD, robots, sitemap, and LLM discovery output.
- Modify `site/src/styles.css`: shared shell, responsive GNB, homepage geometry,
  FAQ, story cards, and documentation terminal surfaces.
- Modify `site/test/build.test.mjs`: route, rendering, accessibility, SEO/AEO,
  and discovery-file regression contracts.
- Modify `docs/superpowers/plans/2026-07-29-unified-navigation-search-skill.md`:
  mark steps complete while executing.

`site/src/app.js` should remain unchanged unless browser verification reveals a
real interaction defect. Theme, locale persistence, copy feedback, TOC tracking,
and terminal replay already operate on stable data attributes.

---

### Task 1: Canonical MCP routes, shared navigation, and Skill documents

**Files:**

- Create: `site/content/ko/skill.md`
- Create: `site/content/en/skill.md`
- Create: `site/content/jp/skill.md`
- Create: `site/content/cn/skill.md`
- Modify: `site/test/build.test.mjs:9-160`
- Modify: `site/test/build.test.mjs:664-686`
- Modify: `site/build.mjs:26-152`
- Modify: `site/build.mjs:477-758`
- Modify: `site/build.mjs:815-832`
- Modify: `site/build.mjs:1053-1134`
- Modify: `site/build.mjs:1817-1854`
- Modify: `site/src/styles.css:190-340`
- Modify: `site/src/styles.css:2246-2610`

- [x] **Step 1: Write failing route and navigation tests**

Change the test route map so `openclaw` keeps its internal source identity but
publishes at `mcp/`, then add `skill`:

```js
const pages = {
  home: "",
  usage: "usage/",
  architecture: "architecture/",
  openclaw: "mcp/",
  skill: "skill/",
  versioning: "versioning/",
};
```

Add Skill sources and visible copy to the Korean canonical test:

```js
const sources = {
  home: "README.md",
  usage: "site/content/ko/usage.md",
  architecture: "site/content/ko/architecture.md",
  openclaw: "site/content/ko/openclaw.md",
  skill: "site/content/ko/skill.md",
  versioning: "site/content/ko/versioning.md",
};

const visibleCopy = {
  home: "하게 사용하세요\\.",
  usage: "kmsg 사용법",
  architecture: "kmsg 아키텍처",
  openclaw: "OpenClaw 연동 가이드",
  skill: "kmsg 코딩 에이전트 Skill",
  versioning: "kmsg 버전 관리",
};
```

Add a shared navigation contract for every canonical page:

```js
test("every canonical page exposes the same ordered primary navigation", async () => {
  const localizedLabels = {
    ko: ["사용법", "구조", "MCP", "Skill", "GitHub"],
    en: ["Usage", "Architecture", "MCP", "Skill", "GitHub"],
    jp: ["使い方", "構成", "MCP", "Skill", "GitHub"],
    cn: ["使用指南", "架构", "MCP", "Skill", "GitHub"],
  };

  for (const localeId of Object.keys(locales)) {
    for (const pageKey of Object.keys(pages)) {
      const path = localizedPath(localeId, pageKey);
      const html = await readOutput(path);
      const nav = html.match(
        /<nav class="primary-nav"[^>]*>([\s\S]*?)<\/nav>/,
      )?.[1];
      assert.ok(nav, `missing primary navigation in ${path}`);
      const labels = [...nav.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)].map(
        ([, value]) =>
          value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      );
      assert.deepEqual(
        labels.map((label) => label.replace(/\s*↗$/, "")),
        localizedLabels[localeId],
        path,
      );
      assert.equal(
        (nav.match(/aria-current="page"/g) || []).length,
        pageKey === "home" || pageKey === "versioning" ? 0 : 1,
        path,
      );
    }
  }
});
```

Add redirect coverage:

```js
test("legacy OpenClaw routes redirect to localized canonical MCP routes", async () => {
  for (const [localeId, locale] of Object.entries(locales)) {
    const legacy = `${locale.prefix}openclaw/index.html`;
    const html = await readOutput(legacy);
    const canonical = publicUrl(localeId, "openclaw");
    assert.match(html, new RegExp(`url=${canonical.replaceAll("/", "\\/")}`));
    assert.match(
      html,
      new RegExp(`rel="canonical" href="${canonical.replaceAll("/", "\\/")}"`),
    );
    assert.match(html, /name="robots" content="noindex,follow"/);
  }
});
```

- [x] **Step 2: Run the site test and verify the new contract fails**

Run:

```bash
npm test --prefix site
```

Expected: FAIL because `skill/index.html` and `mcp/index.html` do not exist and
the homepage still renders a two-link navigation.

- [x] **Step 3: Create the four complete Skill Markdown sources**

Each file must use this localized section structure:

```markdown
# kmsg 코딩 에이전트 Skill

`kmsg` Skill은 Claude Code와 Codex가 macOS용 KakaoTalk을 같은 안전한 절차로
탐색하고 읽고 전송하도록 안내합니다.

## 준비 사항

- macOS 13 이상
- 로그인된 macOS용 KakaoTalk
- 설치된 `kmsg` 바이너리에 대한 손쉬운 사용 권한

## Skill 설치

```bash
npx skills add channprj/kmsg --skill kmsg --agent claude-code codex -g -y
```

## 에이전트에서 호출

| 에이전트 | 호출 |
|---|---|
| Claude Code | `/kmsg` |
| Codex | `$kmsg` |

## 안전한 기본 흐름

1. `kmsg status --verbose`로 권한과 로그인 상태를 확인합니다.
2. `kmsg chats --limit 20`으로 실제 채팅 이름을 확인합니다.
3. `kmsg read "채팅 이름" --limit 20`으로 최근 메시지를 읽습니다.
4. 전송 전 `kmsg send "채팅 이름" "메시지" --dry-run`을 실행합니다.

## MCP와 함께 사용

장기 실행 이벤트에는 `kmsg watch --json`, 요청·응답 도구에는
`kmsg mcp-server`를 사용합니다. 자세한 구성은 [MCP 문서](../mcp/)에서
확인합니다.

## 문제 해결

명령이 실패하면 `kmsg status --verbose`와 `kmsg inspect --depth 5`를 먼저
확인하고, 전체 옵션은 [사용법](../usage/)을 참고합니다.
```

Translate the prose naturally in the English, Japanese, and Chinese files while
preserving commands, `/kmsg`, `$kmsg`, and relative route intent exactly.

- [x] **Step 4: Add the route and page metadata**

In `pageDefinitions`, change only the public slug for the existing MCP source:

```js
{
  key: "openclaw",
  slug: "mcp",
  type: "docs",
  sources: {
    ko: "site/content/ko/openclaw.md",
    en: "docs/openclaw.md",
    jp: "site/content/jp/openclaw.md",
    cn: "site/content/cn/openclaw.md",
  },
  // keep the existing localized metadata
},
```

Add a `skill` page definition before `versioning` with unique localized titles,
descriptions, and eyebrows. Use these titles:

```js
{
  ko: "kmsg 코딩 에이전트 Skill — Claude Code와 Codex에서 사용하기",
  en: "kmsg coding agent Skill — use KakaoTalk from Claude Code and Codex",
  jp: "kmsgコーディングエージェントSkill — Claude CodeとCodexで利用",
  cn: "kmsg编程智能体Skill — 在Claude Code与Codex中使用",
}
```

Extend `markdownPageKey`:

```js
if (["skill.md", "skill"].includes(basename)) return "skill";
```

- [x] **Step 5: Replace the conditional header with one shared five-link header**

Add localized UI strings:

```js
// ko
skill: "Skill",
// en
skill: "Skill",
// jp
skill: "Skill",
// cn
skill: "Skill",
```

Resolve `skillLink` and render a single `primaryLinks` string for every template:

```js
const skillLink = relativeAsset(
  page.output,
  localizedPage(page.locale, "skill").output,
);

const navLink = (key, href, label, external = false) => {
  const current = page.pageKey === key ? ' aria-current="page"' : "";
  const target = external
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";
  return `<a href="${href}"${current}${target}>${label}</a>`;
};

const primaryLinks = [
  navLink("usage", usageLink, ui.usage),
  navLink("architecture", architectureLink, ui.architecture),
  navLink("openclaw", openClawLink, "MCP"),
  navLink("skill", skillLink, ui.skill),
  navLink(null, site.repositoryUrl, 'GitHub <span aria-hidden="true">↗</span>', true),
].join("");
```

Use the same icon-based theme control on every page. Remove the conditional
home-only GitHub icon and document-only `LLM.txt` header link; retain LLM links
in the footer and `<head>`.

- [x] **Step 6: Generate canonical and legacy redirects without sitemap duplication**

Keep canonical documents in `documents`. After writing them, generate:

```js
for (const pageKey of [
  "usage",
  "architecture",
  "openclaw",
  "skill",
  "versioning",
]) {
  const koreanPage = localizedPage("ko", pageKey);
  const legacyOutput = join(outputDir, "ko", koreanPage.path, "index.html");
  await mkdir(dirname(legacyOutput), { recursive: true });
  await writeFile(
    legacyOutput,
    buildRedirect(pageUrl(koreanPage.path)),
    "utf8",
  );
}

for (const localeId of localeOrder) {
  const mcpPage = localizedPage(localeId, "openclaw");
  const localePrefix = locales[localeId].prefix;
  const legacyOutput = join(
    outputDir,
    ...[localePrefix, "openclaw", "index.html"].filter(Boolean),
  );
  await mkdir(dirname(legacyOutput), { recursive: true });
  await writeFile(
    legacyOutput,
    buildRedirect(pageUrl(mcpPage.path), mcpPage.lang),
    "utf8",
  );
}
```

Also emit `/ko/openclaw/index.html` as a legacy-of-a-legacy redirect to `/mcp/`.

- [x] **Step 7: Make all five links available at every viewport**

Remove `.is-home .site-header`, `.is-home .primary-nav`, and the mobile
`display: none` navigation rules. Add:

```css
.primary-nav a[aria-current="page"] {
  color: var(--ink);
}

.primary-nav a[aria-current="page"]::after {
  transform: scaleX(1);
}

@media (max-width: 1060px) {
  .header-inner {
    padding-top: 9px;
    grid-template-columns: 1fr auto;
    gap: 8px 16px;
  }

  .primary-nav {
    width: 100%;
    padding: 0 0 10px;
    overflow-x: auto;
    grid-column: 1 / -1;
    grid-row: 2;
    gap: 20px;
    scrollbar-width: none;
  }

  .primary-nav::-webkit-scrollbar {
    display: none;
  }

  .primary-nav a {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .header-tools {
    grid-column: 2;
    grid-row: 1;
  }
}
```

- [x] **Step 8: Run route tests and verify they pass**

Run:

```bash
npm test --prefix site
git diff --check
```

Expected: all tests PASS, canonical output reports `Built 24 pages`, and there
are no whitespace errors.

- [x] **Step 9: Commit and push checkpoint 2**

```bash
git add site/build.mjs site/src/styles.css site/test/build.test.mjs \
  site/content/ko/skill.md site/content/en/skill.md \
  site/content/jp/skill.md site/content/cn/skill.md
git diff --cached --check
git commit -m "feat(site): unify navigation and add Skill guide"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...origin/main
```

Expected parity: `0 0`.

---

### Task 2: Homepage hierarchy, terminal, stories, FAQ, and document consistency

**Files:**

- Modify: `site/test/build.test.mjs:150-330`
- Modify: `site/test/build.test.mjs:430-820`
- Modify: `site/build.mjs:153-476`
- Modify: `site/build.mjs:1135-1430`
- Modify: `site/build.mjs:1635-1647`
- Modify: `site/src/styles.css:650-815`
- Modify: `site/src/styles.css:975-1710`
- Modify: `site/src/styles.css:1860-2020`
- Modify: `site/src/styles.css:2246-2815`

- [x] **Step 1: Write failing homepage refinement tests**

Assert all command prompts and terminal spacing:

```js
test("homepage replay uses shell prompts and relaxed terminal rhythm", async () => {
  const [html, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.doesNotMatch(html, /❯/);
  assert.ok((html.match(/class="terminal-prompt">\$<\/span>/g) || []).length >= 4);
  assert.match(
    styles,
    /\.terminal-body\s*{[^}]*line-height:\s*1\.2;/s,
  );
});
```

Assert centered actions and equal story media:

```js
test("homepage centers hero actions and normalizes story geometry", async () => {
  const [html, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.match(
    styles,
    /\.product-hero \.hero-actions\s*{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-row:\s*4;[^}]*justify-content:\s*center;/s,
  );
  assert.match(
    styles,
    /\.stories-section \.story-grid\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.doesNotMatch(styles, /\.stories-section \.story-card:nth-child\(2\)/);
  assert.match(
    styles,
    /\.stories-section \.story-media\s*{[^}]*aspect-ratio:\s*16\s*\/\s*9;[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    html,
    /href="https:\/\/www\.google\.com\/search\?q=kmsg\+%EC%B9%B4%EC%B9%B4%EC%98%A4" target="_blank" rel="noopener noreferrer"/,
  );
});
```

Assert visible FAQ and matching schema:

```js
test("homepage renders every FAQ represented by structured data", async () => {
  const html = await readOutput("index.html");
  const data = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)[1],
  );
  const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
  assert.match(html, /<section class="product-section faq-section" id="faq">/);
  assert.equal((html.match(/<details class="faq-item">/g) || []).length, 6);
  for (const item of faq.mainEntity) {
    assert.ok(html.includes(item.name));
    assert.ok(html.includes(item.acceptedAnswer.text));
  }
});
```

- [x] **Step 2: Run tests and verify the old visual contract fails**

Run:

```bash
npm test --prefix site
```

Expected: FAIL on `❯`, line height `1.1`, asymmetric story columns, missing
external action, and missing visible FAQ.

- [x] **Step 3: Add localized homepage action and FAQ labels**

Add these fields to `homeContent`:

```js
// ko
moreStoriesAction: "더 많은 사례 보기",
faqLabel: "자주 묻는 질문",
faqTitle: "kmsg를 시작하기 전에 알아둘 것.",
faqDescription: "설치, 지원 환경, 접근 방식과 MCP에 관한 핵심 답변입니다.",

// en
moreStoriesAction: "See more examples",
faqLabel: "Frequently asked questions",
faqTitle: "What to know before using kmsg.",
faqDescription: "Concise answers about setup, support, access, and MCP.",

// jp
moreStoriesAction: "その他の活用事例を見る",
faqLabel: "よくある質問",
faqTitle: "kmsgを使う前に知っておくこと。",
faqDescription: "導入、対応環境、アクセス方法、MCPの要点です。",

// cn
moreStoriesAction: "查看更多案例",
faqLabel: "常见问题",
faqTitle: "使用kmsg前需要了解的内容。",
faqDescription: "关于安装、支持环境、访问方式和MCP的核心解答。",
```

- [x] **Step 4: Render the external story action and visible FAQ**

Append this action after `.story-grid`:

```js
const moreStoriesUrl =
  "https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4";

<div class="section-action">
  <a class="text-action" href="${moreStoriesUrl}" target="_blank" rel="noopener noreferrer">
    ${escapeHtml(copy.moreStoriesAction)}
    <span aria-hidden="true">↗</span>
  </a>
</div>
```

Add:

```js
const renderHomeFaq = (copy, faqs) => `
  <section class="product-section faq-section" id="faq">
    ${renderSectionHeading(copy.faqLabel, copy.faqTitle, copy.faqDescription)}
    <div class="faq-list">
      ${faqs
        .map(
          ({ question, answer }) => `
        <details class="faq-item">
          <summary>${escapeHtml(question)}<span aria-hidden="true">+</span></summary>
          <p>${escapeHtml(answer)}</p>
        </details>`,
        )
        .join("")}
    </div>
  </section>`;
```

Pass `faqs` through `renderProductHome(page, faqs)` and render the FAQ between
stories and install.

- [x] **Step 5: Implement terminal, hero, story, FAQ, and docs visual rules**

Change both `.terminal-prompt` occurrences in `site/build.mjs` to `$`, then set:

```css
.terminal-body {
  line-height: 1.2;
}

.product-hero .hero-actions {
  margin-top: 38px;
  grid-column: 1 / -1;
  grid-row: 4;
  justify-content: center;
}

.stories-section .story-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.stories-section .story-media {
  display: block;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.section-action {
  display: flex;
  margin-top: 28px;
  justify-content: center;
}

.text-action {
  display: inline-flex;
  min-height: 44px;
  padding: 10px 14px;
  align-items: center;
  gap: 8px;
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

.faq-list {
  border-top: 1px solid var(--line);
}

.faq-item {
  border-bottom: 1px solid var(--line);
}

.faq-item summary {
  display: flex;
  min-height: 72px;
  padding: 20px 0;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: var(--ink);
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  list-style: none;
}

.faq-item p {
  max-width: 760px;
  margin: -4px 0 24px;
  color: var(--ink-muted);
}
```

Remove the desktop second-story margin rule. Keep the mobile one-column grid.
Change Markdown terminal surfaces to the same `#282c34` background family and
traffic-light bar used by the homepage terminal without changing code
scrollability.

- [x] **Step 6: Run tests and inspect the generated HTML contract**

Run:

```bash
npm test --prefix site
node -e '
const fs=require("fs");
const html=fs.readFileSync("site/dist/index.html","utf8");
console.log({
  prompts:(html.match(/class="terminal-prompt">\$<\/span>/g)||[]).length,
  faqs:(html.match(/<details class="faq-item">/g)||[]).length,
  more:html.includes("google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4")
})'
git diff --check
```

Expected: all tests PASS and the object reports at least four prompts, six Korean
FAQs, and `more: true`.

- [x] **Step 7: Commit and push checkpoint 3**

```bash
git add site/build.mjs site/src/styles.css site/test/build.test.mjs
git diff --cached --check
git commit -m "style(site): unify homepage and documentation rhythm"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...origin/main
```

Expected parity: `0 0`.

---

### Task 3: SEO and answer-engine metadata

**Files:**

- Modify: `site/test/build.test.mjs:750-930`
- Modify: `site/build.mjs:1485-1613`
- Modify: `site/build.mjs:1654-1690`
- Modify: `site/build.mjs:1730-1880`

- [x] **Step 1: Write failing metadata and crawler tests**

Add:

```js
test("social metadata is complete and localized", async () => {
  for (const path of contentFiles) {
    const html = await readOutput(path);
    assert.match(html, /<meta property="og:image:type" content="image\/jpeg">/);
    assert.match(html, /<meta property="og:image:width" content="1000">/);
    assert.match(html, /<meta property="og:image:height" content="1000">/);
    assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/);
    assert.equal((html.match(/property="og:locale:alternate"/g) || []).length, 3);
  }
});

test("structured data matches visible product facts", async () => {
  const html = await readOutput("index.html");
  const data = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)[1],
  );
  const software = data["@graph"].find(
    (node) => node["@type"] === "SoftwareApplication",
  );
  const page = data["@graph"].find((node) => node["@type"] === "WebPage");
  assert.equal(software.image.width, 1000);
  assert.equal(software.image.height, 1000);
  assert.ok(software.featureList.includes("Native stdio MCP server"));
  assert.match(software.softwareRequirements, /Accessibility permission/);
  assert.deepEqual(page.mainEntity, { "@id": `${publicUrl("ko", "home")}#software` });
});
```

Extend the robots test:

```js
assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
assert.match(robots, /User-agent: ChatGPT-User\nAllow: \//);
```

Assert the sitemap contains `/mcp/` and `/skill/` but not canonical
`/openclaw/` entries.

- [x] **Step 2: Run tests and verify metadata gaps fail**

Run:

```bash
npm test --prefix site
```

Expected: FAIL because social dimensions, alternate OG locales, enhanced
software facts, page `mainEntity`, and explicit OpenAI crawler blocks are absent.

- [x] **Step 3: Complete metadata and structured data**

Add an image node reused by SoftwareApplication:

```js
const imageObject = {
  "@type": "ImageObject",
  url: pageUrl(site.imagePath),
  width: 1000,
  height: 1000,
};
```

Enhance SoftwareApplication:

```js
image: imageObject,
featureList: [
  "List KakaoTalk chats",
  "Read recent messages",
  "Watch new messages",
  "Send text and images",
  "Native stdio MCP server",
],
softwareRequirements:
  "macOS 13 or later; KakaoTalk for macOS; Accessibility permission",
inLanguage: localeOrder.map((localeId) => locales[localeId].lang),
```

Build the page node before adding it to the graph and include this only on home:

```js
if (page.type === "home") {
  pageNode.mainEntity = { "@id": productId };
}
```

Render:

```html
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1000">
<meta property="og:image:height" content="1000">
<meta name="twitter:image:alt" content="kmsg KakaoTalk CLI logo">
```

For each non-current locale, emit:

```html
<meta property="og:locale:alternate" content="en_US">
```

Use `article` as `og:type` and add `article:modified_time` on documentation
pages; keep `website` on home.

- [x] **Step 4: Make OpenAI search crawling explicit**

Generate exactly:

```text
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

Sitemap: https://channprj.github.io/kmsg/sitemap.xml
```

Do not add a restrictive GPTBot rule: the wildcard already expresses the
project's public crawl policy, while the two answer/search user agents are
explicit for operational clarity.

- [x] **Step 5: Run full static-site verification**

Run:

```bash
npm test --prefix site
git diff --check
```

Expected: all tests PASS, `Built 24 pages and discovery files`, and no
whitespace errors.

- [x] **Step 6: Commit and push checkpoint 4**

```bash
git add site/build.mjs site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): strengthen search and answer discovery"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...origin/main
```

Expected parity: `0 0`.

---

### Task 4: Guideline review, browser QA, and production proof

**Files:**

- Modify if findings require it: `site/build.mjs`
- Modify if findings require it: `site/src/styles.css`
- Modify if findings require it: `site/src/app.js`
- Modify if findings require it: `site/test/build.test.mjs`

- [x] **Step 1: Run the complete local gates**

```bash
npm test --prefix site
swift build
git diff --check
git status --short --branch
```

Expected: all site tests PASS, Swift debug build completes, no diff errors, and
only planned verification fixes remain.

- [x] **Step 2: Review against the current Web Interface Guidelines**

Fetch the latest Vercel guidelines and audit `site/build.mjs`,
`site/src/styles.css`, and `site/src/app.js`. Verify at minimum:

- no `transition: all`;
- all icon controls have stable accessible names;
- links navigate and buttons act;
- all images have dimensions and useful alt behavior;
- focus states remain visible;
- hover does not carry essential-only information;
- mobile controls are at least 44 CSS pixels;
- external links use secure new-tab attributes; and
- reduced motion remains respected.

Fix every relevant finding with a regression assertion.

- [x] **Step 3: Start a local production-like server**

```bash
python3 -m http.server 43129 --bind 127.0.0.1 --directory site/dist
```

Use an isolated browser session named `kmsg-unified-final`.

- [x] **Step 4: Verify desktop and tablet layouts**

At 1440×1000 and 768×1024, inspect `/`, `/usage/`, `/mcp/`, and `/skill/`.
For each representative page assert:

```js
({
  width: innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  nav: [...document.querySelectorAll(".primary-nav a")].map((a) =>
    a.textContent.trim()
  ),
  current: document.querySelector('.primary-nav a[aria-current="page"]')
    ?.textContent.trim(),
  errors: window.__qaErrors ?? [],
})
```

Expected: `scrollWidth === width`, ordered five-link navigation, the correct
active item, no console errors, and visual alignment across home/docs.

On home additionally verify:

```js
({
  prompt: document.querySelector(".terminal-prompt")?.textContent,
  lineHeight: getComputedStyle(document.querySelector(".terminal-body")).lineHeight,
  actionsCentered:
    getComputedStyle(document.querySelector(".product-hero .hero-actions"))
      .justifyContent === "center",
  storyWidths: [...document.querySelectorAll(".stories-section .story-card")]
    .map((node) => Math.round(node.getBoundingClientRect().width)),
  storyRatios: [...document.querySelectorAll(".stories-section .story-media")]
    .map((node) => node.getBoundingClientRect().width /
      node.getBoundingClientRect().height),
})
```

Expected: `$`, approximately `1.2 × 13px`, equal story widths, and ratios near
`1.777`.

- [x] **Step 5: Verify mobile navigation and all locales**

At 390×844 and 320×800:

- verify the primary navigation remains present and horizontally scrollable;
- verify page-level `scrollWidth === innerWidth`;
- verify centered hero actions do not wrap awkwardly;
- open and close FAQ disclosure items with the keyboard;
- switch dark/paper themes;
- visit root, `/en/`, `/jp/`, and `/cn/`;
- visit `/skill/`, `/en/skill/`, `/jp/skill/`, and `/cn/skill/`;
- confirm locale selection maps Skill to Skill and MCP to MCP;
- verify `/usage/` persistence after locale selection; and
- capture full-page dark and paper screenshots for visual inspection.

- [x] **Step 6: Verify external and legacy navigation**

Click “more examples” with new-tab behavior and verify the tab URL is exactly:

```text
https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4
```

Request `/openclaw/`, `/en/openclaw/`, `/jp/openclaw/`, and `/cn/openclaw/`.
Expected: each page is `noindex,follow`, canonicalizes to its localized `/mcp/`,
and exposes a working redirect/fallback link.

- [x] **Step 7: Validate structured output**

Parse every JSON-LD block locally with Node. Confirm every canonical route has
one canonical URL, four `hreflang` alternates plus `x-default`, complete social
metadata, and no `openclaw` URL in the sitemap.

Use Schema.org Validator or Google's Rich Results Test where the public
deployment is required; do not claim eligibility solely from JSON parsing.

- [x] **Step 8: Commit any verification fixes as a corrective checkpoint**

Only if QA reveals defects:

```bash
git add <explicit affected paths>
git diff --cached --check
git commit -m "fix(site): resolve final responsive review findings"
git push origin refs/heads/main:refs/heads/main
```

Do not manufacture a commit if no fixes are needed.

- [x] **Step 9: Prove remote parity and watch deployment**

```bash
git fetch origin refs/heads/main:refs/remotes/origin/main
git rev-list --left-right --count HEAD...origin/main
git status --short --branch
gh run list --commit "$(git rev-parse HEAD)" --limit 10
```

Expected: parity `0 0`, clean tree, successful Swift CI, and successful Pages
build/deploy for the final SHA.

- [x] **Step 10: Repeat production browser checks**

Against `https://channprj.github.io/kmsg/` verify:

- 200 responses for all 24 canonical routes;
- localized `/mcp/` and `/skill/` pages;
- representative 1440px and 390px home/docs screenshots;
- shared five-link navigation;
- `$` terminal prompts and computed `1.2` line height;
- equal `16:9` story cards and the external action;
- visible FAQ/schema agreement;
- no console errors or horizontal overflow; and
- dark/paper theme and locale persistence.

- [x] **Step 11: Complete the requirement-by-requirement audit**

Re-read the user request and the approved design. Map every explicit requirement
to source, test, browser, deployment, and parity evidence. Keep working if any
evidence is missing or indirect.
