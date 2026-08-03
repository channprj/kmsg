# KMSG Balanced Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the KMSG landing page with a floating responsive shell, Geist typography, a synchronized terminal workflow theater, complete landing motion and legal surfaces, while preserving the current Kakao yellow primary colors and real terminal replay.

**Architecture:** Keep the existing Node static generator and shared CSS/JavaScript assets. Extend localized generator data and semantic markup in `site/build.mjs`, keep behavior in `site/src/app.js`, and layer the approved visual system into the existing final product-surface block in `site/src/styles.css`. Protect every generated contract through the existing Node test suite before browser and production verification.

**Tech Stack:** Node.js 22+, ECMAScript modules, `node:test`, static HTML/CSS/JavaScript, `@fontsource-variable/geist` 5.3.0, Phosphor SVG assets, agent-browser, GitHub Pages.

## Global Constraints

- Execute this plan inline in the main thread because the repository instructions prohibit subagent dispatch.
- Preserve dark `--accent: #fee500` and paper `--accent: #f2d500` exactly.
- Preserve the `kmsg chats → kmsg read → kmsg send` transcript, typing, internal scrolling, cancellation, visibility pause, loop reset, and reduced-motion completion.
- Preserve the Ghostty terminal contract: `#282c34`, 36px title bar, 10px traffic lights, JetBrains Mono, 1.18 line height, and 13px/12px/11px responsive type.
- Preserve KO, EN, JP, and CN routes, canonical and hreflang links, FAQ schema, docs, LLM files, theme persistence, and static GitHub Pages architecture.
- Use flat backgrounds. The only visual gradient is the existing theme-specific hero heading text gradient.
- Use Geist Variable for interface Latin glyphs with locale-appropriate system glyph fallback; do not fetch Google Fonts at runtime.
- Use only 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, and 72px interface type steps in touched landing rules.
- Use only `0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px` spacing in touched landing rules.
- New interface transitions use 700ms and `cubic-bezier(0.32, 0.72, 0, 1)`.
- Preserve the unrelated untracked `tasks/` directory and never stage it.
- Stage explicit paths only; never use `git add .` or `git add -A`.
- Push with `git push origin refs/heads/main:refs/heads/main` because this repository also has a `main` tag.
- After every push, require `git rev-list --left-right --count HEAD...@{u}` to print `0 0` before beginning the next task.

---

## File map

- Modify `site/package.json`: pin the self-hosted Geist variable font package.
- Modify `site/package-lock.json`: record the exact dependency integrity and transitive state.
- Modify `site/build.mjs`: copy the font asset, extend localized UI and workflow data, render the mobile menu and workflow rail, generate legal routes and a branded 404, and update metadata/footer/sitemap outputs.
- Modify `site/src/styles.css`: define local Geist loading, floating shell, exact hero scale, workflow theater, landing reveal states, flat surfaces, legal pages, and responsive behavior.
- Modify `site/src/app.js`: manage the mobile menu, focus containment, reveal observer, and workflow-stage synchronization while preserving existing theme/copy/replay behavior.
- Modify `site/test/build.test.mjs`: protect generated assets, markup, locales, colors, motion contracts, workflow behavior, legal routes, metadata, and 404 recovery.
- Create generated output only under ignored `site/dist/`; never stage it.

---

### Task 1: Reshape the shared shell and landing hero

**Files:**
- Modify: `site/package.json`
- Modify: `site/package-lock.json`
- Modify: `site/build.mjs:28-157, 1230-1293, 1640-1678, 1945-2025, 2191-2200`
- Modify: `site/src/styles.css:1-430, 2866-3138, 3652-3890`
- Modify: `site/src/app.js:1-45`
- Test: `site/test/build.test.mjs:35-62, 144-186, 1033-1089, 1203-1260`

**Interfaces:**
- Consumes: existing `locales`, `localizedPage()`, `relativeAsset()`, `renderIcon()`, `setTheme()`, and current hero markup.
- Produces: local assets `assets/geist-latin-wght-normal.woff2` and `assets/geist-OFL.txt`; header attributes `data-header`, `data-menu-panel`, and `data-menu-toggle`; JavaScript function `setMenuOpen(open: boolean): void`; root class `js`; header class `is-menu-open`.

- [ ] **Step 1: Add failing generated-contract tests**

Add `assets/geist-latin-wght-normal.woff2` and `assets/geist-OFL.txt` to
`expectedFiles`, read `package.json` in a focused test, and add these tests to
`site/test/build.test.mjs`:

```js
test("site self-hosts the pinned Geist variable font", async () => {
  const [styles, packageJson] = await Promise.all([
    readOutput("assets/styles.css"),
    readFile(join(siteDir, "package.json"), "utf8").then(JSON.parse),
  ]);

  assert.equal(
    packageJson.dependencies["@fontsource-variable/geist"],
    "5.3.0",
  );
  assert.match(
    styles,
    /@font-face\s*{[^}]*font-family:\s*"Geist Variable";[^}]*src:\s*url\("\.\/geist-latin-wght-normal\.woff2"\) format\("woff2"\);[^}]*font-style:\s*normal;[^}]*font-display:\s*swap;/s,
  );
  assert.match(
    styles,
    /body\s*{[^}]*font-family:\s*"Geist Variable",\s*-apple-system/s,
  );
  assert.doesNotMatch(styles, /fonts\.googleapis\.com/);
});

test("shared header exposes one fluid mobile menu in every locale", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    assert.equal((html.match(/data-menu-toggle/g) || []).length, 1, localeId);
    assert.equal((html.match(/data-menu-panel/g) || []).length, 1, localeId);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /class="menu-line menu-line-top"/);
    assert.match(html, /class="menu-line menu-line-bottom"/);
  }
});

test("landing shell uses the approved primary colors and exact type steps", async () => {
  const styles = await readOutput("assets/styles.css");
  assert.match(styles, /:root\s*{[^}]*--accent:\s*#fee500;/s);
  assert.match(
    styles,
    /:root\[data-theme="paper"\]\s*{[^}]*--accent:\s*#f2d500;/s,
  );
  assert.match(styles, /\.product-hero h1\s*{[^}]*font-size:\s*72px;/s);
  assert.match(
    styles,
    /html\[lang="ko"\] \.product-hero \.hero-title-line:last-child\s*{[^}]*font-size:\s*48px;/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*\.product-hero h1\s*{[^}]*font-size:\s*48px;[\s\S]*html\[lang="ko"\] \.product-hero \.hero-title-line:last-child\s*{[^}]*font-size:\s*36px;/s,
  );
});

test("mobile menu behavior includes close, Escape, and focus containment", async () => {
  const app = await readOutput("assets/app.js");
  assert.match(app, /const setMenuOpen = \(open\) =>/);
  assert.match(app, /menuToggle\.setAttribute\("aria-expanded", String\(open\)\)/);
  assert.match(app, /event\.key === "Escape"/);
  assert.match(app, /event\.key !== "Tab"/);
  assert.match(app, /first\.focus\(\)/);
  assert.match(app, /last\.focus\(\)/);
  assert.match(app, /menuRestoreFocus\?\.focus\(\)/);
});
```

- [ ] **Step 2: Run the suite and verify the new tests fail**

Run:

```bash
npm test --prefix site
```

Expected: FAIL because the Geist dependency/asset, menu markup, menu controller, and exact hero scale are absent.

- [ ] **Step 3: Pin the Geist package**

Run:

```bash
npm install --prefix site --save-exact @fontsource-variable/geist@5.3.0
```

Expected: `site/package.json` contains exact version `5.3.0`; `site/package-lock.json` records the OFL-1.1 package with its registry integrity.

- [ ] **Step 4: Copy the local font and add localized menu labels**

In `site/build.mjs`, define the package asset path beside `iconSourceDir`:

```js
const geistFontSource = join(
  siteDir,
  "node_modules",
  "@fontsource-variable",
  "geist",
  "files",
  "geist-latin-wght-normal.woff2",
);
const geistLicenseSource = join(
  siteDir,
  "node_modules",
  "@fontsource-variable",
  "geist",
  "LICENSE",
);
```

Add this copy to the existing asset `Promise.all`:

```js
copyFile(
  geistFontSource,
  join(outputDir, "assets/geist-latin-wght-normal.woff2"),
),
copyFile(geistLicenseSource, join(outputDir, "assets/geist-OFL.txt")),
```

Add `menuOpen` and `menuClose` to every `locales.*.ui` object using these exact values:

```js
ko: { menuOpen: "메뉴 열기", menuClose: "메뉴 닫기" },
en: { menuOpen: "Open menu", menuClose: "Close menu" },
jp: { menuOpen: "メニューを開く", menuClose: "メニューを閉じる" },
cn: { menuOpen: "打开菜单", menuClose: "关闭菜单" },
```

Merge those keys into the existing locale UI objects rather than creating a second locale table.

- [ ] **Step 5: Restructure `renderHeader(page)` around one menu panel**

Keep the current links and language options, but change the returned header body to this structure:

```js
return `
  <header class="site-header" data-header>
    <div class="header-inner">
      <a class="brand" href="${rootLink}" aria-label="kmsg home" translate="no">
        <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="32" height="32">
        <span>kmsg</span>
      </a>
      <div class="header-menu" data-menu-panel>
        <nav class="primary-nav" aria-label="${ui.navigation}" tabindex="0">
          <a href="${usageLink}"${active("usage")}>${ui.usage}</a>
          <a href="${architectureLink}"${active("architecture")}>${ui.architecture}</a>
          <a href="${mcpLink}"${active("openclaw")}>MCP</a>
          <a href="${skillLink}"${active("skill")}>${ui.skill}</a>
          <a href="${site.repositoryUrl}" target="_blank" rel="noopener noreferrer">GitHub ${renderIcon("external-link", 16)}</a>
        </nav>
        <button class="theme-toggle" type="button" aria-label="${ui.lightTheme}" data-theme-toggle data-light-label="${ui.lightTheme}" data-dark-label="${ui.darkTheme}">
          <span class="theme-icon" aria-hidden="true">${renderIcon("sun", 18)}${renderIcon("moon", 18)}</span>
        </button>
      </div>
      <div class="header-tools">
        <label class="language-control">
          <span class="sr-only">${ui.language}</span>
          <select aria-label="${ui.language}" data-language-select>${languageOptions}</select>
          <span class="language-chevron" aria-hidden="true">${renderIcon("chevron-down", 18)}</span>
        </label>
        <button class="menu-toggle" type="button" aria-label="${ui.menuOpen}" aria-expanded="false" data-menu-toggle data-open-label="${ui.menuOpen}" data-close-label="${ui.menuClose}">
          <span class="menu-lines" aria-hidden="true">
            <span class="menu-line menu-line-top"></span>
            <span class="menu-line menu-line-bottom"></span>
          </span>
        </button>
      </div>
    </div>
  </header>`;
```

The theme control exists once and moves into the overlay through CSS. The locale selector remains in the closed mobile capsule.

- [ ] **Step 6: Implement the menu controller before the existing theme setup**

At the top of `site/src/app.js`, add the root capability class and menu controller. Use this exact state boundary:

```js
root.classList.add("js");

const header = document.querySelector("[data-header]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = window.matchMedia("(max-width: 759px)");
let menuRestoreFocus = null;

const menuFocusable = () => {
  if (!menuPanel) return [];
  return [
    menuToggle,
    ...menuPanel.querySelectorAll(
      'a[href], button:not([disabled]), select:not([disabled])',
    ),
  ].filter(Boolean);
};

const setMenuOpen = (open) => {
  if (!header || !menuPanel || !menuToggle) return;
  const nextOpen = Boolean(open && mobileMenu.matches);
  header.classList.toggle("is-menu-open", nextOpen);
  document.body.classList.toggle("is-menu-open", nextOpen);
  menuToggle.setAttribute("aria-expanded", String(nextOpen));
  menuToggle.setAttribute(
    "aria-label",
    nextOpen ? menuToggle.dataset.closeLabel : menuToggle.dataset.openLabel,
  );
  menuPanel.setAttribute("aria-hidden", String(mobileMenu.matches && !nextOpen));

  if (nextOpen) {
    menuRestoreFocus = document.activeElement;
    menuPanel.querySelector('a[href], button:not([disabled])')?.focus();
  } else if (menuRestoreFocus) {
    menuRestoreFocus?.focus();
    menuRestoreFocus = null;
  }
};

menuToggle?.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

menuPanel?.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (menuToggle?.getAttribute("aria-expanded") !== "true") return;
  if (event.key === "Escape") {
    event.preventDefault();
    setMenuOpen(false);
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = menuFocusable();
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

mobileMenu.addEventListener("change", () => setMenuOpen(false));
menuPanel?.setAttribute("aria-hidden", String(mobileMenu.matches));
```

- [ ] **Step 7: Add the local typeface, floating shell, menu states, and exact hero scale**

At the start of `site/src/styles.css`, add:

```css
@font-face {
  font-family: "Geist Variable";
  src: url("./geist-latin-wght-normal.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

:root {
  --motion-fluid: cubic-bezier(0.32, 0.72, 0, 1);
}

body {
  font-family: "Geist Variable", -apple-system, system-ui, "Apple SD Gothic Neo", sans-serif;
}
```

Replace the final shared header and hero overrides with these exact geometry rules, then retain existing color and responsive declarations that are not contradicted:

```css
.site-header {
  position: sticky;
  z-index: 30;
  top: 24px;
  width: min(1120px, calc(100% - 48px));
  margin: 24px auto 0;
  border: 1px solid var(--line-strong);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--canvas-raised) 88%, transparent);
  box-shadow: 0 16px 48px color-mix(in srgb, #000000 24%, transparent);
  backdrop-filter: blur(24px);
  transition: background-color 700ms var(--motion-fluid),
    border-color 700ms var(--motion-fluid),
    box-shadow 700ms var(--motion-fluid);
}

.header-inner {
  display: grid;
  min-height: 64px;
  padding: 0 16px;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 24px;
}

.header-menu,
.primary-nav,
.header-tools {
  display: flex;
  align-items: center;
}

.header-menu { gap: 24px; }
.primary-nav { gap: 24px; }
.header-tools { gap: 12px; }
.menu-toggle { display: none; }

.product-hero h1 {
  max-width: 680px;
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  text-wrap: balance;
}

html[lang="ko"] .product-hero .hero-title-line:last-child {
  font-size: 48px;
}

.product-hero .hero-lead {
  max-width: 680px;
  font-size: 18px;
  line-height: 28px;
  text-wrap: pretty;
}
```

For tablet use 60px for the first line and 48px for the Korean second line. For mobile use 48px and 36px. Use 8px vertical and 12px horizontal padding on the primary button, with 16px semibold type.

Add the mobile overlay and line morph inside `@media (max-width: 759px)`:

```css
@media (max-width: 759px) {
  .site-header {
    top: 16px;
    width: calc(100% - 32px);
    margin-top: 16px;
  }

  .header-inner {
    min-height: 56px;
    padding: 0 12px;
    grid-template-columns: 1fr auto;
    gap: 12px;
  }

  html.js .menu-toggle {
    display: inline-grid;
    width: 44px;
    height: 44px;
    place-items: center;
  }

  html.js .header-menu {
    position: fixed;
    z-index: -1;
    inset: -16px;
    display: flex;
    padding: 112px 32px 48px;
    visibility: hidden;
    flex-direction: column;
    align-items: stretch;
    background: color-mix(in srgb, var(--canvas) 80%, transparent);
    opacity: 0;
    backdrop-filter: blur(48px);
    transform: translateY(-16px);
    transition: opacity 700ms var(--motion-fluid),
      transform 700ms var(--motion-fluid),
      visibility 700ms var(--motion-fluid);
  }

  html.js .site-header.is-menu-open .header-menu {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }

  html.js .primary-nav {
    align-items: stretch;
    flex-direction: column;
  }

  html.js .primary-nav a {
    min-height: 48px;
    font-size: 24px;
    line-height: 32px;
    opacity: 0;
    transform: translateY(48px);
    transition: color 700ms var(--motion-fluid),
      opacity 700ms var(--motion-fluid),
      transform 700ms var(--motion-fluid);
  }

  html.js .site-header.is-menu-open .primary-nav a {
    opacity: 1;
    transform: translateY(0);
  }

  .menu-lines,
  .menu-line {
    position: relative;
    display: block;
    width: 20px;
    height: 2px;
  }

  .menu-line {
    position: absolute;
    inset-inline-start: 0;
    background: currentColor;
    transition: transform 700ms var(--motion-fluid);
  }

  .menu-line-top { transform: translateY(-4px); }
  .menu-line-bottom { transform: translateY(4px); }
  .is-menu-open .menu-line-top { transform: rotate(45deg); }
  .is-menu-open .menu-line-bottom { transform: rotate(-45deg); }
  body.is-menu-open { overflow: hidden; }
}
```

Add explicit `transition-delay` values of 100ms, 150ms, 200ms, 250ms, and 300ms to the five navigation links. Keep a non-JavaScript two-row fallback by applying fixed overlay styles only beneath `html.js`.

- [ ] **Step 8: Run full generated-site tests**

Run:

```bash
npm test --prefix site
git diff --check
```

Expected: all tests pass; the build reports 24 existing content pages before legal routes are added; no whitespace errors.

- [ ] **Step 9: Verify the shell and hero in a local browser**

Run the generated site from the repository root:

```bash
python3 -m http.server 4173 --directory site/dist
```

In another shell, verify with agent-browser:

```bash
agent-browser --session kmsg-shell open http://127.0.0.1:4173/
agent-browser --session kmsg-shell set viewport 1440 1000
agent-browser --session kmsg-shell screenshot /tmp/kmsg-shell-desktop.png
agent-browser --session kmsg-shell set viewport 390 844
agent-browser --session kmsg-shell snapshot -i
agent-browser --session kmsg-shell find role button click --name "메뉴 열기"
agent-browser --session kmsg-shell snapshot -i
agent-browser --session kmsg-shell press Escape
agent-browser --session kmsg-shell eval "({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')})"
agent-browser --session kmsg-shell close
```

Expected: desktop capsule is detached from the top; mobile is one row; menu opens with five links and theme control; Escape restores `aria-expanded="false"`; `scrollWidth === width`.

- [ ] **Step 10: Commit and push checkpoint 2**

Review and stage only the task paths:

```bash
git status --short
git diff -- site/package.json site/package-lock.json site/build.mjs site/src/styles.css site/src/app.js site/test/build.test.mjs
git add site/package.json site/package-lock.json site/build.mjs site/src/styles.css site/src/app.js site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): reshape landing shell and hero"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Expected: commit succeeds, push succeeds, parity is `0 0`, and `tasks/` remains untracked.

---

### Task 2: Stage the terminal replay as a workflow theater

**Files:**
- Modify: `site/build.mjs:159-564, 1378-1387`
- Modify: `site/src/app.js:180-345`
- Modify: `site/src/styles.css:3109-3235, 3652-3868`
- Test: `site/test/build.test.mjs:726-930, 1130-1165`

**Interfaces:**
- Consumes: `homeContent[locale].workflowTitle`, `workflowDescription`, `TerminalReplay`, `data-replay-scope`, `data-replay-stage`, and the preserved terminal markup.
- Produces: localized `workflowStepsLabel: string`, `workflowSteps: Array<{label: string, title: string, description: string}>`, markup `data-workflow-step="1|2|3"`, and method `TerminalReplay.setActiveStage(stage: string | null): void`.

- [ ] **Step 1: Add failing workflow-theater tests**

Add to `site/test/build.test.mjs`:

```js
test("workflow theater renders three localized semantic steps", async () => {
  const expected = {
    ko: ["채팅방 찾기", "맥락 읽기", "확인하고 전송"],
    en: ["Find the chat", "Read the context", "Confirm and send"],
    jp: ["チャットを探す", "文脈を読む", "確認して送信"],
    cn: ["查找聊天", "读取上下文", "确认并发送"],
  };

  for (const [localeId, labels] of Object.entries(expected)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    assert.equal((html.match(/data-workflow-step=/g) || []).length, 3, localeId);
    assert.match(html, /<ol class="workflow-steps"/);
    labels.forEach((label) => assert.ok(html.includes(label), `${localeId}: ${label}`));
  }
});

test("terminal replay synchronizes workflow steps without changing transcript", async () => {
  const [html, app] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/app.js"),
  ]);
  assert.match(app, /setActiveStage\(stage\)/);
  assert.match(app, /this\.setActiveStage\(stage\)/);
  assert.match(app, /data-workflow-step/);
  assert.match(html, /kmsg chats --limit 2/);
  assert.match(html, /kmsg read &quot;AI 프로젝트&quot; --limit 2 --keep-window/);
  assert.ok(
    html.includes(
      "kmsg send &quot;AI 프로젝트&quot; &quot;확인했어요.&quot;",
    ),
  );
});

test("workflow theater keeps the approved Ghostty contract", async () => {
  const styles = await readOutput("assets/styles.css");
  assert.match(styles, /\.workflow-frame\s*{[^}]*position:\s*sticky;[^}]*top:\s*112px;/s);
  assert.match(styles, /\.terminal-window\s*{[^}]*background:\s*#282c34;/s);
  assert.match(styles, /\.terminal-bar\s*{[^}]*height:\s*36px;/s);
  assert.match(styles, /\.traffic-lights i\s*{[^}]*width:\s*10px;[^}]*height:\s*10px;/s);
  assert.match(styles, /\.terminal-body\s*{[^}]*font-family:\s*"JetBrains Mono"[^}]*font-size:\s*13px;[^}]*line-height:\s*1\.18;/s);
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*\.workflow-frame\s*{[^}]*position:\s*static;/s,
  );
});
```

Update both existing Ghostty assertions that currently expect `line-height: 1.2`
to expect the approved exact value `1.18`.

- [ ] **Step 2: Run the suite and verify failure**

Run:

```bash
npm test --prefix site
```

Expected: FAIL because workflow step data, markup, controller synchronization, sticky layout, and exact 1.18 line height are absent.

- [ ] **Step 3: Add exact workflow-step copy to all locales**

Add `workflowStepsLabel` and `workflowSteps` inside each existing `homeContent` locale object:

```js
// ko
workflowStepsLabel: "메시지 워크플로우",
workflowSteps: [
  { label: "01", title: "채팅방 찾기", description: "채팅 목록에서 대상과 재사용 가능한 chat_id를 찾습니다." },
  { label: "02", title: "맥락 읽기", description: "최근 메시지를 읽고 답장에 필요한 맥락을 확인합니다." },
  { label: "03", title: "확인하고 전송", description: "대상을 확인한 뒤 실제 KakaoTalk 창으로 답장합니다." },
],

// en
workflowStepsLabel: "Message workflow",
workflowSteps: [
  { label: "01", title: "Find the chat", description: "Locate the target and its reusable chat_id from the chat list." },
  { label: "02", title: "Read the context", description: "Read recent messages and confirm the context needed for a reply." },
  { label: "03", title: "Confirm and send", description: "Confirm the target, then reply through the visible KakaoTalk window." },
],

// jp
workflowStepsLabel: "メッセージの流れ",
workflowSteps: [
  { label: "01", title: "チャットを探す", description: "一覧から対象と再利用できるchat_idを探します。" },
  { label: "02", title: "文脈を読む", description: "最近のメッセージを読み、返信に必要な文脈を確認します。" },
  { label: "03", title: "確認して送信", description: "対象を確認し、表示中のKakaoTalkウィンドウから返信します。" },
],

// cn
workflowStepsLabel: "消息工作流",
workflowSteps: [
  { label: "01", title: "查找聊天", description: "从聊天列表中找到目标及可复用的chat_id。" },
  { label: "02", title: "读取上下文", description: "读取最近消息，确认回复所需的上下文。" },
  { label: "03", title: "确认并发送", description: "确认目标后，通过可见的KakaoTalk窗口回复。" },
],
```

- [ ] **Step 4: Render the semantic rail beside the unchanged terminal**

Replace `renderHomeWorkflow(page, copy)` with:

```js
const renderHomeWorkflow = (page, copy) => `
  <section class="product-workflow" id="workflow" data-replay-scope data-reveal>
    <div class="workflow-copy">
      <div class="workflow-intro">
        <h2>${escapeHtml(copy.workflowTitle)}</h2>
        <p>${escapeHtml(copy.workflowDescription)}</p>
      </div>
      <ol class="workflow-steps" aria-label="${escapeHtml(copy.workflowStepsLabel)}">
        ${copy.workflowSteps
          .map(
            (step, index) => `
          <li class="workflow-step" data-workflow-step="${index + 1}">
            <span aria-hidden="true">${escapeHtml(step.label)}</span>
            <div>
              <h3>${escapeHtml(step.title)}</h3>
              <p>${escapeHtml(step.description)}</p>
            </div>
          </li>`,
          )
          .join("")}
      </ol>
    </div>
    <div class="workflow-frame" role="img" aria-label="${escapeHtml(page.previewLabel)}">
      ${renderWorkflowTerminal(page)}
    </div>
  </section>`;
```

Do not change `renderWorkflowTerminal(page)`, replay lines, command strings, output strings, or `translate="no"` behavior.

- [ ] **Step 5: Synchronize visual stage state inside `TerminalReplay`**

Extend the constructor and class methods:

```js
this.scope = element.closest("[data-replay-scope]");
this.steps = [
  ...(this.scope?.querySelectorAll("[data-workflow-step]") || []),
];

setActiveStage(stage) {
  for (const step of this.steps) {
    step.classList.toggle("is-active", step.dataset.workflowStep === stage);
  }
}
```

Call `this.setActiveStage(null)` from both `showComplete()` and `reset()`. In `play(signal)`, call `this.setActiveStage(stage)` immediately before selecting `stageLines`. Do not add `aria-live`, `aria-current`, or spoken progress.

- [ ] **Step 6: Build the theater layout without changing terminal internals**

Use the existing 12-column page grid:

```css
.product-workflow {
  display: grid;
  width: var(--page);
  margin: 0 auto;
  padding: 96px 0;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 32px;
  align-items: start;
}

.workflow-copy {
  grid-column: 1 / span 4;
}

.workflow-frame {
  position: sticky;
  top: 112px;
  min-width: 0;
  grid-column: 6 / -1;
  align-self: start;
}

.workflow-steps {
  display: grid;
  margin: 48px 0 0;
  padding: 0;
  gap: 16px;
  list-style: none;
}

.workflow-step {
  display: grid;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  grid-template-columns: auto 1fr;
  gap: 16px;
  color: var(--ink-muted);
  background: var(--canvas-raised);
  transform: translateX(0);
  transition: color 700ms var(--motion-fluid),
    background-color 700ms var(--motion-fluid),
    border-color 700ms var(--motion-fluid),
    transform 700ms var(--motion-fluid);
}

.workflow-step.is-active {
  border-color: var(--accent);
  color: var(--ink);
  background: var(--canvas-soft);
  transform: translateX(8px);
}

.workflow-step h3 {
  margin: 0;
  font-size: 18px;
  line-height: 28px;
}

.workflow-step p {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 20px;
  text-wrap: pretty;
}
```

Restore the terminal line height to exactly `1.18` and preserve existing terminal sizes. At `max-width: 960px`, stack workflow copy and terminal. At `max-width: 759px`, use 64px section padding, set `.workflow-frame { position: static; }`, and remove the active step translation.

- [ ] **Step 7: Run tests and inspect the complete diff**

Run:

```bash
npm test --prefix site
git diff --check
git diff -- site/build.mjs site/src/app.js site/src/styles.css site/test/build.test.mjs
```

Expected: all tests pass; the transcript assertions remain unchanged; no unrelated legal or footer work is present.

- [ ] **Step 8: Verify normal and reduced-motion replay in the browser**

With the local server running:

```bash
agent-browser --session kmsg-workflow open http://127.0.0.1:4173/
agent-browser --session kmsg-workflow set viewport 1440 1000
agent-browser --session kmsg-workflow scrollintoview "#workflow"
agent-browser --session kmsg-workflow wait --fn "document.querySelector('[data-workflow-step].is-active') !== null"
agent-browser --session kmsg-workflow eval "({active: document.querySelector('[data-workflow-step].is-active')?.dataset.workflowStep, terminal: getComputedStyle(document.querySelector('.terminal-window')).backgroundColor, lineHeight: getComputedStyle(document.querySelector('.terminal-body')).lineHeight})"
agent-browser --session kmsg-workflow screenshot /tmp/kmsg-workflow-desktop.png
agent-browser --session kmsg-workflow close
```

Open a second browser session with reduced motion and assert the completed state:

```bash
agent-browser --session kmsg-workflow-reduced open http://127.0.0.1:4173/
agent-browser --session kmsg-workflow-reduced set media dark reduced-motion
agent-browser --session kmsg-workflow-reduced reload
agent-browser --session kmsg-workflow-reduced eval "({commands: [...document.querySelectorAll('[data-replay-command]')].map((node) => node.textContent), active: document.querySelectorAll('[data-workflow-step].is-active').length})"
agent-browser --session kmsg-workflow-reduced close
```

Expected: the three authored commands are complete immediately and `active` is
`0`. At 390px and 320px, assert `.workflow-frame` computes to `position: static`
and document width does not overflow.

- [ ] **Step 9: Commit and push checkpoint 3**

```bash
git add site/build.mjs site/src/app.js site/src/styles.css site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): stage terminal workflow as a product theater"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Expected: commit and push succeed; parity is `0 0`; `tasks/` remains excluded.

---

### Task 3: Complete landing motion, legal routes, and recovery states

**Files:**
- Modify: `site/build.mjs:28-157, 591-894, 1364-1686, 1719-1748, 1891-2026, 2089-2243`
- Modify: `site/src/styles.css:1-2207, 2866-3919`
- Modify: `site/src/app.js:347-379`
- Modify: `site/test/build.test.mjs:11-102, 188-260, 993-1260, 1260-1519`

**Interfaces:**
- Consumes: `pageDefinitions`, `pages`, `localizedPage()`, `renderDocument()`, `renderFooter()`, `buildSitemap()`, existing section renderers, and `replayMotionPreference`.
- Produces: page keys `privacy` and `terms`; page type `legal`; `legalContent[locale][pageKey]`; `legalMarkdown(page): string`; `renderLegalPage(page): string`; `renderNotFound(): string`; markup `data-reveal`; class `is-revealed`.

- [ ] **Step 1: Add failing legal, recovery, metadata, and reveal tests**

Extend the test `pages` map with `privacy: "privacy/"` and `terms: "terms/"`; add every localized legal HTML file and the Geist asset to expected outputs. Add:

```js
test("legal routes are localized, canonical, and linked from every footer", async () => {
  const labels = {
    ko: ["개인정보 처리 안내", "이용 조건"],
    en: ["Privacy", "Terms"],
    jp: ["プライバシー", "利用条件"],
    cn: ["隐私说明", "使用条款"],
  };

  for (const [localeId, expectedLabels] of Object.entries(labels)) {
    const [privacy, terms] = await Promise.all([
      readOutput(localizedPath(localeId, "privacy")),
      readOutput(localizedPath(localeId, "terms")),
    ]);
    assert.match(privacy, /<body class="is-legal"/);
    assert.match(terms, /<body class="is-legal"/);
    assert.ok(privacy.includes(expectedLabels[0]), localeId);
    assert.ok(terms.includes(expectedLabels[1]), localeId);

    for (const pageKey of Object.keys(pages)) {
      const html = await readOutput(localizedPath(localeId, pageKey));
      assert.match(html, /class="footer-privacy-link"/);
      assert.match(html, /class="footer-terms-link"/);
    }
  }
});

test("branded 404 remains useful without script", async () => {
  const html = await readOutput("404.html");
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /<body class="is-not-found"/);
  assert.match(html, /<h1>Page not found<\/h1>/);
  assert.equal((html.match(/class="not-found-locale"/g) || []).length, 4);
  assert.doesNotMatch(html, /http-equiv="refresh"/);
});

test("homepage metadata states the terminal and coding-agent outcome", async () => {
  const html = await readOutput("index.html");
  const description =
    "터미널과 AI 코딩 에이전트에서 KakaoTalk 채팅을 찾고 읽고 안전하게 보내는 macOS용 오픈소스 CLI와 MCP 서버입니다.";
  assert.match(html, /<title>kmsg - macOS용 카카오톡 CLI 및 MCP 서버<\/title>/);
  assert.ok(html.includes(`<meta name="description" content="${description}">`));
  assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
});

test("landing sections use observer-driven reveal states", async () => {
  const [html, app, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/app.js"),
    readOutput("assets/styles.css"),
  ]);
  assert.ok((html.match(/data-reveal/g) || []).length >= 7);
  assert.match(app, /document\.querySelectorAll\("\[data-reveal\]"\)/);
  assert.match(app, /revealObserver/);
  assert.doesNotMatch(app, /window\.addEventListener\("scroll"/);
  assert.match(styles, /html\.js \[data-reveal\][^\{]*{[^}]*translateY\(64px\)[^}]*blur\(12px\)[^}]*opacity:\s*0;/s);
  assert.match(styles, /\[data-reveal\]\.is-revealed[^\{]*{[^}]*translateY\(0\)[^}]*blur\(0\)[^}]*opacity:\s*1;/s);
});

test("landing backgrounds are flat and primary colors remain unchanged", async () => {
  const [styles, app] = await Promise.all([
    readOutput("assets/styles.css"),
    readOutput("assets/app.js"),
  ]);
  const backgroundGradients = styles
    .match(/background(?:-image)?\s*:\s*[^;]*(?:linear|radial)-gradient[^;]*;/gs) || [];
  assert.deepEqual(backgroundGradients.map((value) => value.trim()), [
    "background-image: linear-gradient(90deg, #ffffff 0%, #9b9b9b 100%);",
    "background-image: linear-gradient(90deg, #000000 0%, #666666 100%);",
  ]);
  assert.match(app, /theme === "paper" \? "#f2f2ed" : "#131209"/);
  assert.match(styles, /:root\s*{[^}]*--accent:\s*#fee500;/s);
  assert.match(styles, /:root\[data-theme="paper"\]\s*{[^}]*--accent:\s*#f2d500;/s);
});
```

The flat-background test may retain `mask-image` because it is not a
background. It fails on every `background` or `background-image` gradient
except the two exact hero text declarations.

- [ ] **Step 2: Run the suite and verify failure**

Run:

```bash
npm test --prefix site
```

Expected: FAIL for missing legal routes, footer links, branded 404, updated metadata, reveal markup/controller, flat backgrounds, and new dark theme color.

- [ ] **Step 3: Define localized legal content and page definitions**

Add this shape before `pageDefinitions` and populate all values exactly:

```js
const legalContent = {
  ko: {
    privacy: {
      title: "개인정보 처리 안내 - kmsg",
      description: "kmsg 정적 웹사이트의 데이터 처리와 외부 서비스 이용 범위를 안내합니다.",
      eyebrow: "법적 안내",
      heading: "개인정보 처리 안내",
      intro: "kmsg 웹사이트는 계정, 입력 폼, 분석 도구 없이 정적으로 제공됩니다.",
      sections: [
        { title: "웹사이트가 수집하는 정보", body: "이 웹사이트는 방문자의 계정, 메시지, 연락처 또는 입력 내용을 서버에 수집하지 않습니다." },
        { title: "외부 서비스", body: "GitHub와 YouTube 링크를 열면 해당 서비스의 개인정보 처리방침과 이용 조건이 적용됩니다." },
        { title: "KakaoTalk 메시지", body: "kmsg CLI가 사용자의 Mac에서 처리하는 KakaoTalk 내용은 이 웹사이트로 전송되지 않습니다." },
      ],
    },
    terms: {
      title: "이용 조건 - kmsg",
      description: "kmsg 웹사이트와 오픈소스 소프트웨어의 이용 조건을 안내합니다.",
      eyebrow: "법적 안내",
      heading: "이용 조건",
      intro: "kmsg는 MIT License로 제공되는 독립 오픈소스 프로젝트입니다.",
      sections: [
        { title: "오픈소스 라이선스", body: "소프트웨어 사용, 복제, 수정, 배포 조건은 저장소의 MIT License를 따릅니다." },
        { title: "비공식 프로젝트", body: "kmsg는 Kakao Corp.와 제휴하거나 승인받은 공식 도구가 아닙니다." },
        { title: "사용자 책임", body: "사용자는 자동화 대상, 손쉬운 사용 권한, 메시지 전송 결과를 직접 확인하고 관련 정책과 법률을 준수해야 합니다." },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy - kmsg",
      description: "How the static kmsg website handles data and links to external services.",
      eyebrow: "Legal",
      heading: "Privacy",
      intro: "The kmsg website is static and has no account, input form, or analytics service.",
      sections: [
        { title: "Information collected by this website", body: "This website does not collect visitor accounts, messages, contacts, or submitted content on a server." },
        { title: "External services", body: "GitHub and YouTube apply their own privacy policies and terms when you open their links." },
        { title: "KakaoTalk messages", body: "KakaoTalk content processed by the kmsg CLI on your Mac is not sent to this website." },
      ],
    },
    terms: {
      title: "Terms - kmsg",
      description: "Terms for the kmsg website and open source software.",
      eyebrow: "Legal",
      heading: "Terms",
      intro: "kmsg is an independent open source project provided under the MIT License.",
      sections: [
        { title: "Open source license", body: "The repository MIT License governs use, copying, modification, and distribution of the software." },
        { title: "Unofficial project", body: "kmsg is not affiliated with, endorsed by, or an official tool of Kakao Corp." },
        { title: "Your responsibility", body: "You must verify automation targets, Accessibility permissions, and message results, and follow applicable policies and laws." },
      ],
    },
  },
  jp: {
    privacy: {
      title: "プライバシー - kmsg",
      description: "kmsgの静的ウェブサイトにおけるデータ処理と外部サービスの範囲を説明します。",
      eyebrow: "法的情報",
      heading: "プライバシー",
      intro: "kmsgのウェブサイトは、アカウント、入力フォーム、解析サービスを持たない静的サイトです。",
      sections: [
        { title: "このサイトが収集する情報", body: "このサイトは訪問者のアカウント、メッセージ、連絡先、入力内容をサーバーに収集しません。" },
        { title: "外部サービス", body: "GitHubやYouTubeのリンクを開くと、各サービスのプライバシーポリシーと利用条件が適用されます。" },
        { title: "KakaoTalkメッセージ", body: "Mac上のkmsg CLIが処理するKakaoTalkの内容は、このウェブサイトへ送信されません。" },
      ],
    },
    terms: {
      title: "利用条件 - kmsg",
      description: "kmsgのウェブサイトとオープンソースソフトウェアの利用条件を説明します。",
      eyebrow: "法的情報",
      heading: "利用条件",
      intro: "kmsgはMIT Licenseで提供される独立したオープンソースプロジェクトです。",
      sections: [
        { title: "オープンソースライセンス", body: "ソフトウェアの利用、複製、変更、配布にはリポジトリのMIT Licenseが適用されます。" },
        { title: "非公式プロジェクト", body: "kmsgはKakao Corp.と提携、承認された公式ツールではありません。" },
        { title: "利用者の責任", body: "自動化対象、アクセシビリティ権限、送信結果を確認し、関連する方針と法律を遵守してください。" },
      ],
    },
  },
  cn: {
    privacy: {
      title: "隐私说明 - kmsg",
      description: "说明kmsg静态网站的数据处理方式与外部服务范围。",
      eyebrow: "法律信息",
      heading: "隐私说明",
      intro: "kmsg网站为静态网站，不提供账户、输入表单或分析服务。",
      sections: [
        { title: "本网站收集的信息", body: "本网站不会在服务器上收集访客账户、消息、联系人或提交内容。" },
        { title: "外部服务", body: "打开GitHub或YouTube链接后，将适用相应服务的隐私政策与使用条款。" },
        { title: "KakaoTalk消息", body: "kmsg CLI在您的Mac上处理的KakaoTalk内容不会发送到本网站。" },
      ],
    },
    terms: {
      title: "使用条款 - kmsg",
      description: "说明kmsg网站与开源软件的使用条款。",
      eyebrow: "法律信息",
      heading: "使用条款",
      intro: "kmsg是依据MIT License提供的独立开源项目。",
      sections: [
        { title: "开源许可证", body: "软件的使用、复制、修改与分发遵循仓库中的MIT License。" },
        { title: "非官方项目", body: "kmsg并非Kakao Corp.的关联、认可或官方工具。" },
        { title: "用户责任", body: "用户应自行确认自动化目标、辅助功能权限与消息发送结果，并遵守适用政策和法律。" },
      ],
    },
  },
};
```

Append two definitions to `pageDefinitions` by mapping `privacy` and `terms`. Use `site/build.mjs` as their source marker, `type: "legal"`, and each locale's `title`, `description`, and `eyebrow` from `legalContent`.

Add `privacy` and `terms` to the existing Korean legacy redirect loop so
`/ko/privacy/` and `/ko/terms/` resolve to the canonical Korean routes. Add
those two files to `expectedFiles` and assert their canonical redirect targets.

- [ ] **Step 4: Give legal pages machine-readable Markdown and dedicated HTML**

Add:

```js
const legalMarkdown = (page) => {
  const copy = legalContent[page.locale][page.pageKey];
  return [
    `# ${copy.heading}`,
    copy.intro,
    ...copy.sections.flatMap((section) => [
      `## ${section.title}`,
      section.body,
    ]),
  ].join("\n\n");
};

const renderLegalPage = (page) => {
  const copy = legalContent[page.locale][page.pageKey];
  return `
    <article class="legal-page" data-reveal>
      <header class="legal-hero">
        <p class="eyebrow"><span></span>${escapeHtml(copy.eyebrow)}</p>
        <h1>${escapeHtml(copy.heading)}</h1>
        <p>${escapeHtml(copy.intro)}</p>
      </header>
      <div class="legal-sections">
        ${copy.sections
          .map(
            (section) => `
          <section>
            <h2>${escapeHtml(section.title)}</h2>
            <p>${escapeHtml(section.body)}</p>
          </section>`,
          )
          .join("")}
      </div>
    </article>`;
};
```

In `main()`, use `legalMarkdown(page)` instead of reading a file for legal pages, and use `gitLastModified("site/build.mjs")` for their timestamp. Still run `renderMarkdown()` on that string so LLM outputs remain complete. In `renderDocument()`, select `renderLegalPage(page)` for `page.type === "legal"`, use body class `is-legal`, and omit the alternate raw Markdown `<link>` for legal pages.

- [ ] **Step 5: Add footer links and the branded 404**

Add localized UI labels:

```js
ko: { privacy: "개인정보", terms: "이용 조건" },
en: { privacy: "Privacy", terms: "Terms" },
jp: { privacy: "プライバシー", terms: "利用条件" },
cn: { privacy: "隐私", terms: "使用条款" },
```

Inside `renderFooter(page, version)`, resolve localized legal routes and append:

```js
<a class="footer-privacy-link" href="${privacyLink}">${page.localeConfig.ui.privacy}</a>
<a class="footer-terms-link" href="${termsLink}">${page.localeConfig.ui.terms}</a>
```

Replace the current instant redirect with:

```js
const renderNotFound = () => `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page not found - kmsg</title>
    <meta name="robots" content="noindex,follow">
    <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="./assets/styles.css">
  </head>
  <body class="is-not-found">
    <main class="not-found-page">
      <img src="./assets/kmsg-logo.jpg" alt="" width="64" height="64">
      <p class="eyebrow"><span></span>404</p>
      <h1>Page not found</h1>
      <p>The requested page does not exist. Choose a language to return to kmsg.</p>
      <nav aria-label="Choose a kmsg homepage">
        ${localeOrder
          .map((localeId) => {
            const locale = locales[localeId];
            return `<a class="not-found-locale" href="${pageUrl(localizedPage(localeId, "home").path)}">${locale.label} · ${locale.name}</a>`;
          })
          .join("")}
      </nav>
    </main>
  </body>
</html>`;
```

Write `renderNotFound()` to `404.html`. Do not add a meta refresh or JavaScript redirect.

- [ ] **Step 6: Update homepage metadata and dark theme color**

Set the Korean home title and description exactly to the approved strings:

```js
title: "kmsg - macOS용 카카오톡 CLI 및 MCP 서버",
description:
  "터미널과 AI 코딩 에이전트에서 KakaoTalk 채팅을 찾고 읽고 안전하게 보내는 macOS용 오픈소스 CLI와 MCP 서버입니다.",
```

Use these equivalent descriptions:

```js
en: "Open source macOS CLI and MCP server for finding, reading, and safely sending KakaoTalk chats from terminals and AI coding agents.",
jp: "ターミナルやAIコーディングエージェントからKakaoTalkのチャットを検索、閲覧、安全に送信できるmacOS向けオープンソースCLI・MCPサーバーです。",
cn: "面向macOS的开源CLI和MCP服务器，可在终端与AI编程智能体中查找、读取并安全发送KakaoTalk聊天消息。",
```

Change the dark canvas and every theme-color surface from `#0c0d0b` to approved `#131209` in `:root`, `setTheme()`, document metadata, and web manifest. Do not change either accent token.

- [ ] **Step 7: Add observer-driven section reveals**

Add `data-reveal` to the hero and every major homepage section renderer except the tagline, which keeps its word-specific observer. Then append to `site/src/app.js`:

```js
const revealElements = [...document.querySelectorAll("[data-reveal]")];

if (
  "IntersectionObserver" in window &&
  revealElements.length > 0 &&
  !replayMotionPreference.matches
) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-revealed"));
}
```

Add:

```css
html.js [data-reveal] {
  filter: blur(12px);
  opacity: 0;
  transform: translateY(64px);
  transition: filter 800ms var(--motion-fluid),
    opacity 800ms var(--motion-fluid),
    transform 800ms var(--motion-fluid);
}

html.js [data-reveal].is-revealed {
  filter: blur(0);
  opacity: 1;
  transform: translateY(0);
}
```

In the existing reduced-motion block, force `filter: none`, `opacity: 1`, and `transform: none` for `[data-reveal]`.

- [ ] **Step 8: Finish flat surfaces, interaction states, and legal layouts**

Remove or replace every background gradient except the two hero heading text gradients. Specifically remove the legacy page grid, hero visual overlay, early install-panel gradient, command-panel wash, and old traffic-light radial gradients. Keep `mask-image` declarations because they are not backgrounds. Replace `.capability-copy { border-left: 2px solid var(--accent); }` with a complete-surface or inset treatment:

```css
.capability-copy {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: inset 4px 0 0 var(--accent);
}
```

Normalize homepage links, buttons, cards, FAQ summaries, story media, copy controls, locale selector, and theme/menu controls to the custom easing. Preserve terminal functional timing.

Add legal and 404 layout rules:

```css
.legal-page,
.not-found-page {
  width: var(--page);
  margin: 0 auto;
}

.legal-page { padding: 96px 0; }
.legal-hero { max-width: 680px; }
.legal-hero h1,
.not-found-page h1 {
  margin: 16px 0 0;
  font-size: 60px;
  line-height: 1;
  text-wrap: balance;
}

.legal-sections {
  display: grid;
  max-width: 760px;
  margin-top: 64px;
  gap: 32px;
}

.legal-sections section {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--canvas-raised);
}

.is-not-found {
  display: grid;
  min-height: 100dvh;
  place-items: center;
}

.not-found-page { padding: 64px 0; }
.not-found-page nav {
  display: flex;
  margin-top: 32px;
  flex-wrap: wrap;
  gap: 12px;
}

.not-found-locale {
  padding: 8px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 9999px;
}
```

At mobile widths, use 64px legal padding and 48px legal/404 headings. Ensure every hover has active `scale(0.98)` or `translateY(1px)` feedback and every control retains the existing visible focus ring.

- [ ] **Step 9: Run full local verification for the completed implementation**

Run:

```bash
npm test --prefix site
git diff --check
rg -n "background(?:-image)?:.*(?:linear|radial)-gradient" site/src/styles.css
rg -n "window\.addEventListener\(['\"]scroll" site/src/app.js
```

Expected: all tests pass; the gradient search returns only the two approved hero heading lines; the scroll-listener search returns no matches.

- [ ] **Step 10: Browser-test every landing state and legal route**

Use a fresh local server and agent-browser session. Verify:

```bash
agent-browser --session kmsg-final open http://127.0.0.1:4173/
agent-browser --session kmsg-final set viewport 1440 1000
agent-browser --session kmsg-final a11y --tags wcag2a,wcag2aa --json
agent-browser --session kmsg-final find role button click --name "밝은 테마로 전환"
agent-browser --session kmsg-final screenshot --full /tmp/kmsg-final-paper.png
agent-browser --session kmsg-final set viewport 390 844
agent-browser --session kmsg-final find role button click --name "메뉴 열기"
agent-browser --session kmsg-final snapshot -i
agent-browser --session kmsg-final press Escape
agent-browser --session kmsg-final open http://127.0.0.1:4173/privacy/
agent-browser --session kmsg-final open http://127.0.0.1:4173/terms/
agent-browser --session kmsg-final open http://127.0.0.1:4173/404.html
agent-browser --session kmsg-final close
```

Repeat route smoke checks for `/en/`, `/jp/`, `/cn/`, and their Privacy/Terms routes. At 1440, 1024, 768, 390, 375, and 320px, evaluate `document.documentElement.scrollWidth === innerWidth`. Check console errors separately. Report axe incomplete items separately from violations.

- [ ] **Step 11: Commit and push checkpoint 4**

```bash
git add site/build.mjs site/src/app.js site/src/styles.css site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): complete landing states and legal routes"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Expected: commit and push succeed; parity is `0 0`; `tasks/` remains untracked.

---

### Task 4: Audit local, CI, Pages, and live production parity

**Files:**
- Verify only: `site/dist/**`, `.github/workflows/**`, public GitHub Pages routes
- Modify only if a verified defect requires a corrective checkpoint: the smallest affected subset of `site/build.mjs`, `site/src/app.js`, `site/src/styles.css`, `site/test/build.test.mjs`, `site/package.json`, `site/package-lock.json`

**Interfaces:**
- Consumes: the three pushed implementation commits, GitHub Actions, GitHub Pages, public site routes, and configured upstream.
- Produces: test/build/browser/accessibility/CI/Pages/live evidence; optional corrective `fix(site)` commit only for an observed defect.

- [ ] **Step 1: Re-read the approved specification and map every requirement to evidence**

Check `docs/superpowers/specs/2026-08-03-kmsg-balanced-landing-redesign.md` against the final diff. Record evidence for primary colors, terminal preservation, menu behavior, type scale, section motion, legal links, 404, four locales, themes, breakpoints, metadata, and remote parity. If a requirement has no evidence, run the missing check before continuing.

- [ ] **Step 2: Run final repository gates from a fresh generated build**

```bash
npm test --prefix site
git diff --check
git status --short --branch
```

Expected: the full site suite passes; only the known untracked `tasks/` remains; the branch matches its upstream.

- [ ] **Step 3: Run the complete local browser matrix**

For KO, EN, JP, and CN, test desktop 1440×1000 and mobile 390×844. Add 1024px and 768px layout checks plus 375px and 320px overflow checks. Verify dark/paper themes, locale persistence, mobile menu open/close/Escape/focus loop/focus restore, terminal order/scroll/reset/visibility pause/reduced motion, tagline reveal, both copy controls, stories, FAQ, legal links, legal pages, 404, current navigation, console errors, and WCAG A/AA.

Expected: no page overflow, no dead link, no console error, no axe violation. Any axe incomplete item is reported with its selector and manual result.

- [ ] **Step 4: Confirm CI and Pages for the final pushed SHA**

```bash
gh run list --branch main --limit 10
FINAL_SHA="$(git rev-parse HEAD)"
export FINAL_SHA
PAGES_RUN_ID="$(gh run list --branch main --limit 20 --json databaseId,workflowName,headSha --jq '.[] | select(.headSha == env.FINAL_SHA and .workflowName == "pages") | .databaseId' | head -1)"
SWIFT_RUN_ID="$(gh run list --branch main --limit 20 --json databaseId,workflowName,headSha --jq '.[] | select(.headSha == env.FINAL_SHA and .workflowName == "ci") | .databaseId' | head -1)"
gh run view "$PAGES_RUN_ID"
gh run view "$SWIFT_RUN_ID"
```

Select runs whose `headSha` equals `git rev-parse HEAD`. Wait for completion without rerunning or cancelling unrelated workflows.

Expected: Pages and Swift CI conclude successfully for the exact final SHA.

- [ ] **Step 5: Verify production routes and behavior**

Use agent-browser against `https://channprj.github.io/kmsg/` and verify the same critical KO desktop, KO mobile, and EN desktop flows. Confirm HTTP/browser availability for all locale homes, Privacy, Terms, `404.html`, `sitemap.xml`, font asset, and LLM files. Confirm the rendered commit's new selectors and metadata are present.

Expected: production matches local generated behavior and the live font asset loads from the KMSG origin.

- [ ] **Step 6: Create a corrective commit only when evidence exposes a defect**

If any check fails, first add or tighten the regression test, run it to confirm failure, implement the smallest correction, run the full suite and affected browser check, stage explicit paths, and commit using a specific `fix(site): ...` subject. Push normally and repeat Tasks 4.2 through 4.5 for the new SHA. Do not amend or force-push a published checkpoint.

- [ ] **Step 7: Prove final history and upstream parity**

```bash
git log --oneline 3b549e5..HEAD
git status --short --branch
git rev-list --left-right --count HEAD...@{u}
git ls-remote origin refs/heads/main
```

Expected: history contains the implementation checkpoints and any evidence-driven corrective commit; `tasks/` is the only untracked path; parity is `0 0`; live `refs/heads/main` equals local `HEAD`.
