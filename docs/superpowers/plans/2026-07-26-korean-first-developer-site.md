# Korean-first developer site implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Korean the canonical README and homepage, then ship a polished
1280px-wide developer documentation shell with visible LLM-readable resources.

**Architecture:** Keep the existing Node static-site generator and GitHub Pages
workflow. Rename the Markdown sources, make locale routing explicit in page
metadata, generate a redirect for the legacy Korean route, and share one
server-rendered shell across home and documentation pages. CSS remains a single
purpose-built visual system and the small client script handles only progressive
enhancement.

**Tech Stack:** Node.js 22, ECMAScript modules, Marked, sanitize-html, semantic
HTML, modern CSS, vanilla JavaScript, Node test runner, GitHub Actions/Pages.

**Execution note:** The user explicitly requested realtime commits directly on
the synchronized `main` branch, so implementation proceeds there rather than in
a separate worktree. Every task below ends with tests, an ordinary push, and
`0 0` upstream parity.

---

## File map

- `README.md` — canonical Korean project README after the rename.
- `README.en.md` — canonical English project README after the rename.
- `site/build.mjs` — page registry, route/link rewriting, shared HTML shell,
  structured data, discovery files, redirects, and build output.
- `site/test/build.test.mjs` — route, metadata, content, shell, and discovery
  regression coverage.
- `site/src/styles.css` — 1280px shell, two themes, homepage, docs, story cards,
  responsive behavior, focus, print, and reduced motion.
- `site/src/app.js` — theme labels/persistence, copy controls, sticky header,
  and active table of contents.
- `.github/workflows/pages.yml` — Pages rebuild path filters for renamed READMEs.
- `docs/superpowers/specs/2026-07-26-korean-first-developer-site-design.md`
  — approved design source of truth.

### Task 1: Make Korean the canonical README source

**Files:**

- Rename: `README.md` → `README.en.md`
- Rename: `README.ko.md` → `README.md`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `.github/workflows/pages.yml`

- [ ] **Step 1: Rename the two README sources without losing history**

Apply the equivalent of:

```bash
git mv README.md README.en.md
git mv README.ko.md README.md
```

Expected:

```text
README.md     contains "# kmsg — macOS용 카카오톡 CLI 및 MCP 서버"
README.en.md  contains "# kmsg — KakaoTalk CLI & MCP server for macOS"
```

- [ ] **Step 2: Update cross-language links and the Korean story heading**

The Korean document must contain:

```markdown
[프로젝트 홈페이지](https://channprj.github.io/kmsg/) · [English](README.en.md)

## 실사용 후기
```

Its two thumbnail images retain:

```html
width="400"
```

The English document must contain:

```markdown
[Project website](https://channprj.github.io/kmsg/en/) · [한국어](README.md)
```

Its documentation list points to the canonical Korean file:

```markdown
- [Korean README](README.md) — Korean version of this document
```

- [ ] **Step 3: Update the Pages workflow path filters**

Replace the obsolete filter with the renamed English source:

```yaml
paths:
  - ".github/workflows/pages.yml"
  - "README.md"
  - "README.en.md"
```

Keep all existing source, asset, and `site/**` filters unchanged.

- [ ] **Step 4: Verify the file-level migration**

Run:

```bash
test -f README.md
test -f README.en.md
test ! -f README.ko.md
rg -n '^## 실사용 후기$|width="400"' README.md
rg -n '^## Featured video$|width="400"' README.en.md
git diff --check
```

Expected: both files exist under their canonical names, four 400px thumbnail
attributes are found across them, and `git diff --check` exits 0.

### Task 2: Generate Korean at root and English at `/en/`

**Files:**

- Modify: `site/test/build.test.mjs`
- Modify: `site/build.mjs`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Write failing route and source assertions**

Change the expected home outputs to:

```js
const expectedFiles = [
  "index.html",
  "en/index.html",
  "ko/index.html",
  // existing documentation and asset outputs
];
```

Add tests with these exact contracts:

```js
test("Korean homepage is canonical at root", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /<html lang="ko"/);
  assert.match(html, /<body data-source="README\.md">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/">/,
  );
  assert.match(
    html,
    /hreflang="en" href="https:\/\/channprj\.github\.io\/kmsg\/en\/"/,
  );
  assert.match(html, /실사용 후기/);
  assert.match(html, /id="설치"/);
});

test("English homepage is canonical at its locale path", async () => {
  const html = await readOutput("en/index.html");
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<body data-source="README\.en\.md">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/en\/">/,
  );
  assert.match(
    html,
    /hreflang="ko" href="https:\/\/channprj\.github\.io\/kmsg\/"/,
  );
  assert.match(html, /Featured video/);
});

test("legacy Korean route redirects to the canonical root", async () => {
  const html = await readOutput("ko/index.html");
  assert.match(html, /url=https:\/\/channprj\.github\.io\/kmsg\//);
  assert.match(
    html,
    /rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/"/,
  );
});
```

- [ ] **Step 2: Run the tests and prove they fail for the old routing**

Run:

```bash
npm test --prefix site
```

Expected: FAIL because `en/index.html` is missing and `index.html` is still
English.

- [ ] **Step 3: Replace the two homepage page definitions**

The page registry begins with:

```js
const pages = [
  {
    source: "README.md",
    output: "index.html",
    path: "",
    lang: "ko",
    type: "home",
    title: "kmsg — macOS용 카카오톡 CLI 및 MCP 서버",
    description:
      "macOS용 비공식 카카오톡 CLI 및 네이티브 MCP 서버입니다. 손쉬운 사용 자동화로 메시지를 읽고, 감시하고, 전송합니다.",
    eyebrow: "카카오톡 자동화 · macOS 13 이상",
    heroTitle: "카카오톡을<br><em>터미널 안으로.</em>",
    primaryAction: "kmsg 설치하기",
    docsAction: "문서 읽기",
    sourceLabel: "README.md에서 자동 생성",
  },
  {
    source: "README.en.md",
    output: "en/index.html",
    path: "en/",
    lang: "en",
    type: "home",
    title: "kmsg — KakaoTalk CLI & MCP server for macOS",
    description:
      "Unofficial KakaoTalk CLI and native MCP server for macOS. Read, watch, and send messages through Accessibility automation for scripts and AI agents.",
    eyebrow: "KakaoTalk automation · macOS 13+",
    heroTitle: "Your KakaoTalk.<br><em>Now in the terminal.</em>",
    primaryAction: "Install kmsg",
    docsAction: "Read the docs",
    sourceLabel: "Generated from README.en.md",
  },
];
```

Keep the four documentation page definitions after these two homes.

- [ ] **Step 4: Update Markdown route rewriting and alternate metadata**

The route map includes:

```js
const markdownRouteMap = new Map([
  ["README.md", ""],
  ["README.en.md", "en/"],
  ["USAGE.md", "usage/"],
  ["ARCHITECTURE.md", "architecture/"],
  ["docs/openclaw.md", "openclaw/"],
  ["VERSIONING.md", "versioning/"],
]);
```

For either homepage, render:

```js
const alternateKo = pageUrl("");
const alternateEn = pageUrl("en/");
const xDefault = alternateKo;
```

Documentation pages keep their own canonical, use their page language, and link
home through the Korean root. The locale header link is `/en/` from Korean and
`/` from English.

- [ ] **Step 5: Generate a redirect-only legacy route**

After the six content pages are written, write `ko/index.html` using:

```js
const buildRedirect = (target, lang = "ko") =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">` +
  `<meta http-equiv="refresh" content="0; url=${target}">` +
  `<link rel="canonical" href="${target}">` +
  `<meta name="robots" content="noindex,follow"></head>` +
  `<body><p><a href="${target}">kmsg 문서로 이동</a></p></body></html>`;
```

Create the parent directory before writing:

```js
await mkdir(join(outputDir, "ko"), { recursive: true });
await writeFile(
  join(outputDir, "ko/index.html"),
  buildRedirect(site.baseUrl),
  "utf8",
);
```

Only the six content pages enter the sitemap, JSON-LD graph, and LLM corpus.

- [ ] **Step 6: Update discovery assertions for renamed sources**

The full-corpus test must assert:

```js
assert.match(full, /# Source: README\.md/);
assert.match(full, /# Source: README\.en\.md/);
assert.doesNotMatch(full, /# Source: README\.ko\.md/);
```

The sitemap test must assert `/` and `/en/` and must not include `/ko/`.

- [ ] **Step 7: Run the full site tests**

Run:

```bash
npm test --prefix site
git diff --check
```

Expected: all Node tests pass, the generator reports six content pages, and the
legacy redirect file exists.

- [ ] **Step 8: Commit and push the locale checkpoint**

Stage only:

```bash
git add README.md README.en.md README.ko.md \
  site/build.mjs site/test/build.test.mjs .github/workflows/pages.yml
```

Commit:

```bash
git commit -m "feat(site): make Korean homepage canonical"
git push
git rev-list --left-right --count HEAD...@{u}
```

Expected parity: `0 0`.

### Task 3: Ship the 1280px developer shell and LLM entry

**Files:**

- Modify: `site/test/build.test.mjs`
- Modify: `site/build.mjs`
- Modify: `site/src/styles.css`
- Modify: `site/src/app.js`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Add failing shell and LLM resource assertions**

Add `llm.txt` to `expectedFiles`, then assert:

```js
test("every content page uses the 1280px site shell", async () => {
  for (const path of [
    "index.html",
    "en/index.html",
    "usage/index.html",
    "architecture/index.html",
    "openclaw/index.html",
    "versioning/index.html",
  ]) {
    const html = await readOutput(path);
    assert.match(
      html,
      /<div class="site-shell">[\s\S]*<header[\s\S]*<main[\s\S]*<footer[\s\S]*<\/div>/,
    );
    assert.match(html, /class="llm-link"[^>]+href="[^"]*llm\.txt"/);
  }
});

test("singular and compatible LLM indexes match", async () => {
  const [singular, plural] = await Promise.all([
    readOutput("llm.txt"),
    readOutput("llms.txt"),
  ]);
  assert.equal(singular, plural);
  assert.match(singular, /Canonical website: https:\/\/channprj\.github\.io\/kmsg\//);
  assert.match(singular, /English documentation.*\/kmsg\/en\//);
});
```

- [ ] **Step 2: Run the tests and prove the new contracts fail**

Run:

```bash
npm test --prefix site
```

Expected: FAIL because `llm.txt`, `.site-shell`, and `.llm-link` do not exist.

- [ ] **Step 3: Add the visible LLM action and shared shell**

In `renderHeader`, resolve:

```js
const llmLink = relativeAsset(page.output, "llm.txt");
```

Render this before the language link:

```html
<a class="llm-link" href="${llmLink}" type="text/plain">
  LLM.txt <span aria-hidden="true">↗</span>
</a>
```

Wrap the rendered header, main, and footer:

```html
<body
  data-source="${escapeHtml(page.source)}"
  data-language="${page.lang}"
>
  <a class="skip-link" href="#content">...</a>
  <div class="site-grid" aria-hidden="true"></div>
  <div class="site-shell">
    ${renderHeader(page)}
    <main id="content">...</main>
    ${renderFooter(page, version)}
  </div>
  <script src="${rootAsset("assets/app.js")}" defer></script>
</body>
```

- [ ] **Step 4: Emit both LLM index names from one string**

Build once:

```js
const llmsIndex = buildLlmsIndex(version);
```

Then write:

```js
writeFile(join(outputDir, "llm.txt"), llmsIndex, "utf8"),
writeFile(join(outputDir, "llms.txt"), llmsIndex, "utf8"),
```

The index includes:

```markdown
- [한국어 홈페이지](https://channprj.github.io/kmsg/)
- [English documentation](https://channprj.github.io/kmsg/en/)
```

- [ ] **Step 5: Implement the shell and visual tokens**

Start `site/src/styles.css` with:

```css
:root {
  color-scheme: dark;
  --ink: #f2f2f2;
  --ink-muted: #929292;
  --canvas: #050505;
  --surface: #0a0a0a;
  --surface-raised: #0f0f0f;
  --line: #242424;
  --line-strong: #343434;
  --accent: #fee500;
  --accent-ink: #171300;
  --signal: #65d48b;
  --display: "Syne", "IBM Plex Sans KR", sans-serif;
  --body: "IBM Plex Sans KR", sans-serif;
  --mono: "IBM Plex Mono", monospace;
  --shell-width: 1280px;
  --content-width: 1120px;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

:root[data-theme="paper"] {
  color-scheme: light;
  --ink: #171717;
  --ink-muted: #666;
  --canvas: #ededed;
  --surface: #fff;
  --surface-raised: #f7f7f7;
  --line: #dedede;
  --line-strong: #c8c8c8;
  --signal: #177a44;
}

body {
  margin: 0;
  background: var(--canvas);
  color: var(--ink);
}

.site-shell {
  width: min(100%, var(--shell-width));
  min-height: 100vh;
  margin-inline: auto;
  border-inline: 1px solid var(--line);
  background: var(--surface);
}

.header-inner,
.hero,
.docs-hero,
.content-layout,
.site-footer {
  width: min(var(--content-width), calc(100% - 64px));
  margin-inline: auto;
}
```

Refine the existing selectors rather than introducing a component framework:

- use a flat balanced two-column `.hero`;
- remove orbit decoration and strong 3D terminal rotation;
- use one-pixel structural borders and restrained shadows;
- style `.llm-link` as a compact yellow-accented utility action;
- style the four `.hero-signals`/proof items as a bordered row;
- style Markdown images carrying `width="400"` as compact, responsive media;
- give home story links clear hover/focus treatment;
- preserve `.toc`, code-copy, tables, blockquotes, media, footer, print, and
  reduced-motion behaviors.

At 760px, apply:

```css
@media (max-width: 760px) {
  .site-shell {
    border-inline: 0;
  }

  .header-inner,
  .hero,
  .docs-hero,
  .content-layout,
  .site-footer {
    width: min(100% - 32px, var(--content-width));
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .markdown-body img[width="400"] {
    width: min(100%, 400px);
    height: auto;
  }
}
```

- [ ] **Step 6: Localize progressive-enhancement labels**

Render the theme button with:

```html
<button
  class="theme-toggle"
  type="button"
  aria-label="${page.lang === "ko" ? "밝은 테마로 전환" : "Switch to light theme"}"
  data-theme-toggle
  data-light-label="${page.lang === "ko" ? "밝은 테마로 전환" : "Switch to light theme"}"
  data-dark-label="${page.lang === "ko" ? "어두운 테마로 전환" : "Switch to dark theme"}"
>
```

In `site/src/app.js`, set:

```js
const setTheme = (theme) => {
  root.dataset.theme = theme;
  const nextLabel =
    theme === "dark"
      ? themeToggle?.dataset.lightLabel
      : themeToggle?.dataset.darkLabel;
  if (nextLabel) themeToggle?.setAttribute("aria-label", nextLabel);
  try {
    localStorage.setItem("kmsg-theme", theme);
  } catch {
    // The preference remains active for this page view.
  }
};
```

Keep existing copy, sticky-header, and table-of-contents logic.

- [ ] **Step 7: Run automated verification**

Run:

```bash
npm test --prefix site
git diff --check
```

Expected: all tests pass, `site/dist/llm.txt` equals `llms.txt`, and every
content page contains the shared shell and LLM action.

- [ ] **Step 8: Run browser verification**

Serve the generated output:

```bash
npx --yes serve site/dist --listen 4173
```

Verify at 1440×1000 and 390×844:

- `/` is Korean and `/en/` is English;
- the rendered `.site-shell` is exactly 1280px at a 1440px viewport;
- no horizontal overflow;
- dark is default and paper theme persists after navigation;
- `LLM.txt` opens `/llm.txt` as plain text;
- copy controls and locale links work;
- both story thumbnails remain maximum-resolution sources;
- keyboard focus is visible;
- automated WCAG A/AA scan reports no violations.

- [ ] **Step 9: Commit and push the visual checkpoint**

Stage only:

```bash
git add site/build.mjs site/test/build.test.mjs \
  site/src/styles.css site/src/app.js
```

Commit:

```bash
git commit -m "feat(site): refine developer documentation experience"
git push
git rev-list --left-right --count HEAD...@{u}
```

Expected parity: `0 0`.

### Task 4: Verify GitHub Pages production

**Files:**

- No source change unless production verification exposes a defect.

- [ ] **Step 1: Wait for both workflows on the final commit**

Run:

```bash
gh run list --branch main --commit "$(git rev-parse HEAD)" \
  --json databaseId,workflowName,status,conclusion,url
```

Expected: `pages` and `ci` both finish with `conclusion: success`.

- [ ] **Step 2: Verify production routes and resources**

Fetch:

```text
https://channprj.github.io/kmsg/
https://channprj.github.io/kmsg/en/
https://channprj.github.io/kmsg/ko/
https://channprj.github.io/kmsg/usage/
https://channprj.github.io/kmsg/llm.txt
https://channprj.github.io/kmsg/llms.txt
https://channprj.github.io/kmsg/llms-full.txt
https://channprj.github.io/kmsg/sitemap.xml
```

Expected: content routes and discovery files return HTTP 200; `/ko/` resolves
to the Korean canonical root; root metadata is Korean; `/en/` metadata is
English; and the singular/plural LLM indexes match.

- [ ] **Step 3: Prove final repository and remote state**

Run:

```bash
git diff --check
git status --short --branch
git rev-list --left-right --count HEAD...@{u}
git log --oneline 1ffe81b..HEAD
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Expected: no uncommitted source changes, local and upstream parity `0 0`, and
the full local SHA equals `refs/heads/main`.
