# Ghostty-Style Workflow Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the requested homepage chrome and replace the workflow replay
with a compact, authentic Ghostty-style macOS terminal without regressing its
localized animation or responsive behavior.

**Architecture:** Keep the existing static generator and progressive replay
controller. First remove visible metadata and the controller's progress-node
dependency as one green checkpoint, then replace the terminal's visual contract
and font as a second checkpoint. Validate generated HTML, controller source,
computed browser styles, replay behavior, all four locales, and the deployed
GitHub Pages build.

**Tech Stack:** Node.js 22, static HTML generation, vanilla JavaScript, CSS,
`node:test`, `npx agent-browser`, GitHub Actions, GitHub Pages

---

## File map

- `site/build.mjs` owns localized homepage copy, terminal markup, homepage
  footer composition, and the Google Fonts request.
- `site/src/app.js` owns replay initialization, typing, stage reveal, internal
  scrolling, cancellation, reset, and reduced-motion fallback.
- `site/src/styles.css` owns terminal chrome, palette, typography, density,
  responsive behavior, and reduced-motion CSS.
- `site/test/build.test.mjs` builds the real site and verifies generated HTML,
  copied JavaScript, and copied CSS.
- No Swift, MCP, documentation-content, release, or workflow file changes are
  required.

Execute on the current `main` branch because the user requested realtime
checkpoints on the configured upstream. Do not create a feature branch, rewrite
history, or force-push.

### Task 1: Remove non-terminal homepage metadata

**Files:**

- Modify: `site/test/build.test.mjs:362-498`
- Modify: `site/build.mjs:153-390`
- Modify: `site/build.mjs:1111-1183`
- Modify: `site/build.mjs:1208-1217`
- Modify: `site/build.mjs:1403-1427`
- Modify: `site/build.mjs:1550-1587`
- Modify: `site/src/app.js:173-260`

- [ ] **Step 1: Add a failing four-locale content-removal test**

Insert this test immediately before
`home hero renders the real localized chats-read-send transcript`:

```js
test("home workflow omits non-terminal chrome and visible release labels", async () => {
  const forbiddenCopy = {
    ko: ["실제 CLI 흐름", "AX 연결됨", "텍스트 · 표준 출력"],
    en: ["Real CLI workflow", "AX connected", "text · stdout"],
    jp: ["実際のCLIフロー", "AX接続済み", "テキスト · 標準出力"],
    cn: ["真实CLI流程", "AX已连接", "文本 · 标准输出"],
  };

  for (const [localeId, labels] of Object.entries(forbiddenCopy)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    for (const label of labels) {
      assert.ok(!html.includes(label), `${localeId} still renders ${label}`);
    }

    assert.ok(!html.includes("kmsg · zsh"));
    assert.doesNotMatch(
      html,
      /class="(?:workflow-meta|hero-version|terminal-version|terminal-footer)"/,
    );
    assert.doesNotMatch(html, /data-replay-progress/);
    assert.doesNotMatch(
      html,
      /<(?:strong|span|a)[^>]*>v\d+\.\d+\.\d+<\/(?:strong|span|a)>/,
    );
  }
});
```

In the existing localized transcript test, replace:

```js
assert.match(html, /data-replay-progress>03 \/ 03/);
```

with:

```js
assert.doesNotMatch(html, /data-replay-progress/);
```

- [ ] **Step 2: Add a failing controller contract assertion**

In `terminal replay is cancellable, motion-aware, and locale-safe`, replace the
current progress lookup assertion:

```js
assert.match(
  app,
  /closest\("\[data-replay-scope\]"\)[\s\S]*querySelector\("\[data-replay-progress\]"\)/,
);
```

with:

```js
assert.doesNotMatch(app, /data-replay-progress|this\.progress/);
```

- [ ] **Step 3: Run the focused tests and verify the expected failure**

Run:

```bash
npm test --prefix site -- --test-name-pattern="home workflow omits non-terminal chrome|home hero renders the real localized|terminal replay is cancellable"
```

Expected: FAIL because generated homepages still contain localized workflow
labels, title/version/footer markup, visible version labels, and
`data-replay-progress`; the controller source still contains `this.progress`.

- [ ] **Step 4: Remove unused localized metadata**

Delete these two fields from every `homeContent` locale:

```diff
-    currentVersion: "현재 버전",
-    workflowLabel: "실제 CLI 흐름",
```

```diff
-    currentVersion: "Current version",
-    workflowLabel: "Real CLI workflow",
```

```diff
-    currentVersion: "現在のバージョン",
-    workflowLabel: "実際のCLIフロー",
```

```diff
-    currentVersion: "当前版本",
-    workflowLabel: "真实CLI流程",
```

- [ ] **Step 5: Reduce terminal markup to native chrome and transcript**

Change the function signature and delete the entire `terminalCopy` declaration:

```diff
-const renderWorkflowTerminal = (page, version) => {
-  const terminalCopy = {
-    ko: {
-      connected: "AX 연결됨",
-      output: "텍스트 · 표준 출력",
-    },
-    en: {
-      connected: "AX connected",
-      output: "text · stdout",
-    },
-    jp: {
-      connected: "AX接続済み",
-      output: "テキスト · 標準出力",
-    },
-    cn: {
-      connected: "AX已连接",
-      output: "文本 · 标准输出",
-    },
-  }[page.locale];
+const renderWorkflowTerminal = (page) => {
```

Replace the terminal title bar:

```diff
       <div class="terminal-bar">
         <div class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></div>
-        <span>kmsg · zsh</span>
-        <span class="terminal-version">v${escapeHtml(version)}</span>
       </div>
```

Delete the footer after `.terminal-body`:

```diff
-      <div class="terminal-footer">
-        <span><i></i> ${escapeHtml(terminalCopy.connected)}</span>
-        <span>${escapeHtml(terminalCopy.output)}</span>
-      </div>
```

Leave every transcript command, output row, stage attribute, chat ID, localized
message, and returned cursor unchanged.

- [ ] **Step 6: Remove workflow, hero, and homepage-footer version chrome**

Replace `renderHomeWorkflow` with:

```js
const renderHomeWorkflow = (page) => `
  <section class="product-workflow" id="workflow" data-replay-scope>
    <div class="workflow-frame" role="img" aria-label="${escapeHtml(page.previewLabel)}">
      ${renderWorkflowTerminal(page)}
    </div>
  </section>`;
```

Change the product renderer signature and delete its `.hero-version` paragraph:

```diff
-const renderProductHome = (page, version) => {
+const renderProductHome = (page) => {
```

```diff
-      <p class="hero-version">
-        ${escapeHtml(copy.currentVersion)} <strong>v${escapeHtml(version)}</strong>
-      </p>
     </section>
-    ${renderHomeWorkflow(page, version, copy)}
+    ${renderHomeWorkflow(page)}
```

Update the homepage call site:

```diff
-          ${renderProductHome(page, version)}
+          ${renderProductHome(page)}
```

Keep the versioning link on documentation pages but omit it from homepage
footers:

```diff
-        <a href="${versioningLink}">v${escapeHtml(version)}</a>
+        ${
+          page.type === "home"
+            ? ""
+            : `<a href="${versioningLink}">v${escapeHtml(version)}</a>`
+        }
```

Do not change JSON-LD, `llm.txt`, versioning documentation, or release metadata.

- [ ] **Step 7: Remove the replay controller's progress dependency**

Delete the constructor assignment:

```diff
-    this.progress = element
-      .closest("[data-replay-scope]")
-      ?.querySelector("[data-replay-progress]");
```

Relax the initialization guard:

```diff
-    if (!this.viewport || !this.progress || this.lines.length === 0) {
+    if (!this.viewport || this.lines.length === 0) {
```

Delete these three progress updates:

```diff
-    this.progress.textContent = "03 / 03";
```

```diff
-    this.progress.textContent = "01 / 03";
```

```diff
-        this.progress.textContent = `0${stage} / 03`;
```

Do not change the stage loop, typing cadence, scroll behavior, cancellation, or
fallback restoration.

- [ ] **Step 8: Run focused and full automated verification**

Run:

```bash
npm test --prefix site -- --test-name-pattern="home workflow omits non-terminal chrome|home hero renders the real localized|terminal replay is cancellable"
npm test --prefix site
git diff --check
```

Expected: focused tests PASS; the full suite reports zero failures and still
builds 20 pages; `git diff --check` prints nothing.

- [ ] **Step 9: Smoke-test the stripped terminal in a real browser**

Start the generated site:

```bash
python3 -m http.server 4173 --directory site/dist
```

In a separate shell:

```bash
npx --yes agent-browser --session kmsg-ghostty-metadata open http://127.0.0.1:4173/
npx --yes agent-browser --session kmsg-ghostty-metadata set viewport 1440 900
npx --yes agent-browser --session kmsg-ghostty-metadata scrollintoview "#workflow"
```

Evaluate:

```js
const text = document.body.innerText;
({
  removedCopy: [
    "실제 CLI 흐름",
    "kmsg · zsh",
    "v1.260726.0",
    "AX 연결됨",
    "텍스트 · 표준 출력",
  ].filter((value) => text.includes(value)),
  workflowMeta: document.querySelectorAll(".workflow-meta").length,
  progress: document.querySelectorAll("[data-replay-progress]").length,
  terminalFooter: document.querySelectorAll(".terminal-footer").length,
  replaying: document.querySelector("[data-terminal-replay]")?.classList.contains("is-replaying"),
  horizontalOverflow:
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
});
```

Expected:

```json
{
  "removedCopy": [],
  "workflowMeta": 0,
  "progress": 0,
  "terminalFooter": 0,
  "replaying": true,
  "horizontalOverflow": false
}
```

- [ ] **Step 10: Commit and push the metadata checkpoint**

Review the complete diff, confirm only the three intended site files changed,
and stage explicit paths:

```bash
git status --short
git diff -- site/build.mjs site/src/app.js site/test/build.test.mjs
git add site/build.mjs site/src/app.js site/test/build.test.mjs
git diff --cached --check
git commit -m "fix(site): remove workflow terminal metadata"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Expected parity: `0 0`.

### Task 2: Apply the Ghostty visual contract

**Files:**

- Modify: `site/test/build.test.mjs:340-360`
- Modify: `site/test/build.test.mjs:454-498`
- Modify: `site/build.mjs:1613-1616`
- Modify: `site/src/styles.css:641-885`
- Modify: `site/src/styles.css:1182-1242`
- Modify: `site/src/styles.css:2281-2300`
- Modify: `site/src/styles.css:2477-2494`
- Modify: `site/src/styles.css:2624-2638`
- Modify: `site/src/styles.css:2651-2673`

- [ ] **Step 1: Write the failing font and CSS contract tests**

In `IBM Plex and locale fonts keep prose readable and code distinct`, add:

```js
assert.match(root, /family=JetBrains\+Mono:wght@400;500;600/);
```

Add this test immediately after the replay lifecycle test:

```js
test("home workflow uses the compact Ghostty visual contract", async () => {
  const styles = await readOutput("assets/styles.css");

  assert.match(
    styles,
    /\.terminal-window\s*{[\s\S]*border-radius:\s*12px;[\s\S]*background:\s*#282c34;[\s\S]*color:\s*#ffffff;/,
  );
  assert.match(
    styles,
    /\.terminal-bar\s*{[\s\S]*height:\s*36px;[\s\S]*background:\s*#282c34;/,
  );
  assert.match(
    styles,
    /\.traffic-lights i\s*{[\s\S]*width:\s*10px;[\s\S]*height:\s*10px/,
  );
  assert.match(
    styles,
    /\.terminal-body\s*{[\s\S]*background:\s*#282c34;[\s\S]*font-family:\s*"JetBrains Mono"[\s\S]*font-size:\s*13px;[\s\S]*line-height:\s*1\.18;/,
  );
  assert.match(
    styles,
    /\.terminal-transcript\s*{[\s\S]*padding:\s*10px 12px 12px;/,
  );
  assert.match(
    styles,
    /\.terminal-command-line\s*{[\s\S]*margin-top:\s*7px;[\s\S]*gap:\s*8px;/,
  );
  assert.match(
    styles,
    /\.terminal-output-gap\s*{[\s\S]*height:\s*3px;/,
  );
  assert.match(
    styles,
    /\.workflow-frame\s*{[\s\S]*padding:\s*0;[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*760px\)[\s\S]*\.terminal-body\s*{[\s\S]*font-size:\s*12px;/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*350px\)[\s\S]*\.terminal-body\s*{[\s\S]*font-size:\s*11px;/,
  );
  assert.doesNotMatch(
    styles,
    /\.terminal-(?:footer|version)|\.workflow-meta|@keyframes terminal-scan|\.terminal-window::after|\.hero-visual:hover \.terminal-window/,
  );
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run:

```bash
npm test --prefix site -- --test-name-pattern="IBM Plex and locale fonts|home workflow uses the compact Ghostty"
```

Expected: FAIL because JetBrains Mono is not requested and the current CSS uses
the black ruled surface, `48px` title bar, `11px/1.42` type, large padding,
double frame, glow, scan, hover lift, and obsolete selectors.

- [ ] **Step 3: Request JetBrains Mono**

Change the Google Fonts stylesheet URL in `site/build.mjs` to:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Replace terminal chrome, surface, and density rules**

Replace the current `.terminal-window` through `.terminal-success` rules with:

```css
.terminal-window {
  position: relative;
  z-index: 3;
  overflow: hidden;
  min-height: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: #282c34;
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.38),
    0 1px 0 rgba(255, 255, 255, 0.04) inset;
  color: #ffffff;
}

.terminal-bar {
  display: flex;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  align-items: center;
  background: #282c34;
}

.traffic-lights {
  display: flex;
  gap: 8px;
}

.traffic-lights i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff5f57;
}

.traffic-lights i:nth-child(2) {
  background: #febc2e;
}

.traffic-lights i:nth-child(3) {
  background: #28c840;
}

.terminal-body {
  height: 356px;
  min-height: 0;
  overflow: hidden;
  background: #282c34;
  font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Monaco, Consolas,
    monospace;
  font-size: 13px;
  line-height: 1.18;
}

.terminal-transcript {
  height: 100%;
  min-width: 0;
  padding: 10px 12px 12px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
  transition: opacity 280ms ease;
}

.terminal-transcript::-webkit-scrollbar {
  display: none;
}

.terminal-line {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: normal;
}

.terminal-command-line {
  display: flex;
  margin-top: 7px;
  align-items: flex-start;
  gap: 8px;
}

.terminal-command-line:first-child {
  margin-top: 0;
}

.terminal-prompt {
  flex: none;
  color: #e5c07b;
  font-weight: 600;
}

.terminal-command {
  min-width: 0;
  color: #ffffff;
}

.terminal-output-line {
  display: block;
  color: #d7dae0;
}

.terminal-output-gap {
  display: block;
  height: 3px;
}

.terminal-muted {
  color: #7f848e;
}

.terminal-highlight {
  color: #61afef;
}

.terminal-success {
  color: #98c379;
}
```

Keep the existing replay visibility rules beginning with
`.terminal-window.is-replaying .terminal-line`.

Change `.cursor-block` to:

```css
.cursor-block {
  width: 7px;
  height: 1em;
  margin-top: 0.09em;
  background: #e5c07b;
  animation: blink 1.1s steps(1) infinite;
}
```

Retain `@keyframes blink`. Delete the complete `.terminal-window::after`,
`.hero-visual:hover .terminal-window`, `.terminal-version`,
`.terminal-footer`, `.terminal-footer i`, `@keyframes terminal-arrive`, and
`@keyframes terminal-scan` rules.

- [ ] **Step 5: Collapse the outer product frame**

Delete `.hero-version`, `.hero-version strong`, and `.workflow-meta` rules.
Replace `.workflow-frame` and its home overrides with:

```css
.workflow-frame {
  min-width: 0;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  box-shadow: none;
}

.is-home .terminal-body {
  height: 376px;
}
```

Delete `.is-home .terminal-window`, `.is-home .terminal-window::after`, and
`.is-home .terminal-transcript` overrides so the base Ghostty rules are the
single source of truth.

- [ ] **Step 6: Set compact responsive metrics**

Inside `@media (max-width: 759px)`, keep the `320px` body height and replace the
workflow-frame override with:

```css
.workflow-frame {
  border-radius: 12px;
}

.is-home .terminal-body {
  height: 320px;
}
```

Delete the mobile `.workflow-meta` and `.is-home .terminal-transcript` rules.

Inside the later `@media (max-width: 760px)`, set:

```css
.terminal-body {
  height: 344px;
  min-height: 0;
  font-size: 12px;
}

.terminal-transcript {
  padding: 10px 12px 12px;
}

.terminal-command-line {
  gap: 8px;
}
```

Inside `@media (max-width: 430px)`, delete the obsolete terminal-bar grid/title
and terminal font-size rules. Keep only the compact inline padding:

```css
.terminal-transcript {
  padding-inline: 12px;
}
```

Inside `@media (max-width: 350px)`, add:

```css
.terminal-body {
  font-size: 11px;
}
```

In the reduced-motion selector list, remove `.terminal-window::after` because
that pseudo-element no longer exists. Keep the terminal, transcript, cursor,
and other existing motion safeguards.

- [ ] **Step 7: Run focused and full automated verification**

Run:

```bash
npm test --prefix site -- --test-name-pattern="IBM Plex and locale fonts|home workflow uses the compact Ghostty|terminal replay is cancellable"
npm test --prefix site
git diff --check
```

Expected: focused and full suites PASS with zero failures; the build still emits
20 pages; no whitespace errors.

### Task 3: Verify the Ghostty terminal in real browsers and publish it

**Files:**

- Modify only if runtime verification exposes a defect:
  - `site/build.mjs`
  - `site/src/app.js`
  - `site/src/styles.css`
  - `site/test/build.test.mjs`

- [ ] **Step 1: Serve the freshly generated site**

Run:

```bash
python3 -m http.server 4173 --directory site/dist
```

Reuse the server only while `site/dist` matches the tested source.

- [ ] **Step 2: Capture and inspect Korean desktop and mobile views**

Run:

```bash
npx --yes agent-browser --session kmsg-ghostty open http://127.0.0.1:4173/
npx --yes agent-browser --session kmsg-ghostty set viewport 1440 900
npx --yes agent-browser --session kmsg-ghostty scrollintoview "#workflow"
npx --yes agent-browser --session kmsg-ghostty screenshot /tmp/kmsg-ghostty-desktop.png
npx --yes agent-browser --session kmsg-ghostty set viewport 390 844
npx --yes agent-browser --session kmsg-ghostty scrollintoview "#workflow"
npx --yes agent-browser --session kmsg-ghostty screenshot /tmp/kmsg-ghostty-mobile.png
```

Inspect both screenshots at original detail. Expected: one dark native-looking
window, traffic lights only, no outer card, no labels/footer, dense rows, no
clipping.

- [ ] **Step 3: Verify computed visual and layout invariants**

Evaluate at 1440px, 390px, and 320px:

```js
const terminal = document.querySelector(".terminal-window");
const bar = document.querySelector(".terminal-bar");
const body = document.querySelector(".terminal-body");
const line = document.querySelector(".terminal-line");
const frame = document.querySelector(".workflow-frame");
const terminalStyle = getComputedStyle(terminal);
const bodyStyle = getComputedStyle(body);
const lineStyle = getComputedStyle(line);
const frameStyle = getComputedStyle(frame);
const bounds = terminal.getBoundingClientRect();

({
  viewport: innerWidth,
  background: terminalStyle.backgroundColor,
  foreground: terminalStyle.color,
  titlebarHeight: bar.getBoundingClientRect().height,
  fontFamily: bodyStyle.fontFamily,
  fontSize: parseFloat(bodyStyle.fontSize),
  lineHeight: parseFloat(lineStyle.lineHeight),
  lineHeightRatio:
    parseFloat(lineStyle.lineHeight) / parseFloat(bodyStyle.fontSize),
  framePadding: frameStyle.padding,
  frameBorderWidth: frameStyle.borderTopWidth,
  terminalInsideViewport: bounds.left >= 0 && bounds.right <= innerWidth,
  horizontalOverflow:
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  removedChrome:
    document.querySelectorAll(
      ".workflow-meta, .hero-version, .terminal-version, .terminal-footer, [data-replay-progress]",
    ).length,
});
```

Expected at desktop:

```json
{
  "background": "rgb(40, 44, 52)",
  "foreground": "rgb(255, 255, 255)",
  "titlebarHeight": 36,
  "fontSize": 13,
  "lineHeightRatio": 1.18,
  "framePadding": "0px",
  "frameBorderWidth": "0px",
  "terminalInsideViewport": true,
  "horizontalOverflow": false,
  "removedChrome": 0
}
```

At 390px expect `fontSize: 12`; at 320px expect `fontSize: 11`; both keep the
same line-height ratio, bounds, and overflow results.

- [ ] **Step 4: Verify all locale outputs and absent copy**

Open `/`, `/en/`, `/jp/`, and `/cn/`. At 390px evaluate:

```js
({
  locale: document.documentElement.dataset.locale,
  forbiddenVisibleText: [
    "실제 CLI 흐름",
    "AX 연결됨",
    "텍스트 · 표준 출력",
    "Real CLI workflow",
    "AX connected",
    "text · stdout",
    "実際のCLIフロー",
    "AX接続済み",
    "テキスト · 標準出力",
    "真实CLI流程",
    "AX已连接",
    "文本 · 标准输出",
    "kmsg · zsh",
    "v1.260726.0",
  ].filter((value) => document.body.innerText.includes(value)),
  horizontalOverflow:
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  commandCount: document.querySelectorAll("[data-replay-kind='command']").length,
});
```

Expected for every locale: `forbiddenVisibleText: []`,
`horizontalOverflow: false`, and `commandCount: 3`.

- [ ] **Step 5: Verify animation and internal scrolling**

Reload with normal motion, scroll the workflow into view, and evaluate:

```js
const terminal = document.querySelector("[data-terminal-replay]");
const viewport = document.querySelector("[data-replay-viewport]");
const samples = [];

for (let index = 0; index < 24; index += 1) {
  samples.push({
    visible: terminal.querySelectorAll("[data-replay-line].is-visible").length,
    commandText: [...terminal.querySelectorAll("[data-replay-command]")]
      .map((command) => command.textContent)
      .join("|"),
    scrollable: viewport.scrollHeight > viewport.clientHeight,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
}

({
  replaying: terminal.classList.contains("is-replaying"),
  progressed:
    new Set(
      samples.map((sample) => `${sample.visible}:${sample.commandText}`),
    ).size > 1,
  viewportScrollsInternally: samples.some((sample) => sample.scrollable),
});
```

Expected: `replaying: true`, `progressed: true`, and
`viewportScrollsInternally: true`.

- [ ] **Step 6: Verify reduced motion and paper theme**

Use an isolated reduced-motion session:

```bash
npx --yes agent-browser --session kmsg-ghostty-reduced open http://127.0.0.1:4173/
npx --yes agent-browser --session kmsg-ghostty-reduced media dark reduced-motion
npx --yes agent-browser --session kmsg-ghostty-reduced reload
```

Evaluate:

```js
const terminal = document.querySelector("[data-terminal-replay]");
({
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  replaying: terminal.classList.contains("is-replaying"),
  completeCommands: [...terminal.querySelectorAll("[data-replay-command]")]
    .every((command) => command.textContent === command.dataset.replayText),
});
```

Expected: `reducedMotion: true`, `replaying: false`,
`completeCommands: true`.

In the normal session, click `[data-theme-toggle]` and verify:

```js
({
  pageTheme: document.documentElement.dataset.theme,
  terminalBackground:
    getComputedStyle(document.querySelector(".terminal-window")).backgroundColor,
});
```

Expected: `pageTheme: "paper"` and
`terminalBackground: "rgb(40, 44, 52)"`.

- [ ] **Step 7: Run accessibility and console checks**

Run:

```bash
npx --yes agent-browser --session kmsg-ghostty a11y --tags wcag2a,wcag2aa
npx --yes agent-browser --session kmsg-ghostty console
```

Expected: no serious or critical accessibility violations and no console
errors. Report incomplete axe checks separately from violations.

- [ ] **Step 8: Fix only observed defects with a red-green regression**

If a runtime requirement fails, add the smallest assertion that reproduces the
failure to `site/test/build.test.mjs`, run it and observe the expected failure,
apply the minimal source/CSS correction, then rerun:

```bash
npm test --prefix site
git diff --check
```

Do not alter passing CLI output, replay content, unrelated sections, or docs.

- [ ] **Step 9: Commit and push the Ghostty visual checkpoint**

Review the complete diff and stage explicit paths:

```bash
git status --short
git diff -- site/build.mjs site/src/styles.css site/test/build.test.mjs
git add site/build.mjs site/src/styles.css site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): adopt Ghostty-style workflow terminal"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

If Task 3 changed `site/src/app.js` for a verified runtime defect, include that
explicit path in both the diff review and `git add`. Expected parity: `0 0`.

### Task 4: Verify CI, Pages, and production

**Files:**

- No source files unless production exposes a reproducible defect.

- [ ] **Step 1: Find the exact workflow runs for the feature commit**

Record the feature SHA and exact workflow run IDs:

```bash
feature_sha=$(git rev-parse HEAD)
ci_run_id=$(gh run list --commit "$feature_sha" --workflow ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
pages_run_id=$(gh run list --commit "$feature_sha" --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$ci_run_id"
test -n "$pages_run_id"
```

Inspect both exact runs:

```bash
gh run view "$ci_run_id" --json databaseId,headSha,status,conclusion,url,workflowName
gh run view "$pages_run_id" --json databaseId,headSha,status,conclusion,url,workflowName
```

Identify the Swift CI and Pages runs whose `headSha` equals the feature SHA.

- [ ] **Step 2: Wait for both workflows**

```bash
gh run watch "$ci_run_id" --exit-status
gh run watch "$pages_run_id" --exit-status
```

Expected: both workflows finish with `conclusion: success`. Do not infer Pages
deployment from the push or from CI alone.

- [ ] **Step 3: Repeat production desktop and mobile checks**

Open the deployed page with the feature SHA as a cache-busting query:

```bash
npx --yes agent-browser --session kmsg-ghostty-production open "https://channprj.github.io/kmsg/?rev=$feature_sha"
```

Repeat Task 3 Steps 2–7 at 1440px, 390px, and 320px. Expected: production
matches the local Ghostty colors, metrics, absent copy, replay behavior, paper
theme behavior, accessibility status, and zero horizontal overflow.

- [ ] **Step 4: Create a corrective checkpoint only for a proven defect**

If production contradicts the tested source, first determine whether the Pages
artifact is stale. If the deployed commit is current and the defect reproduces
locally, add a failing regression, apply the minimal fix, rerun the full site
suite and browser checks, then use:

```bash
git add site/build.mjs site/src/app.js site/src/styles.css site/test/build.test.mjs
git diff --cached --check
git commit -m "fix(site): correct Ghostty terminal rendering"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Stage only files that actually changed. Repeat the exact CI, Pages, and
production checks for the corrective SHA.

- [ ] **Step 5: Run the completion audit**

Run fresh:

```bash
npm test --prefix site
git diff --check
git fetch origin
git status --short --branch
git rev-list --left-right --count HEAD...@{u}
git log --oneline b4c3933..HEAD
```

Then re-read the approved design and verify each explicit requirement against:

- generated HTML for every locale;
- copied JavaScript and CSS;
- local runtime measurements and screenshots;
- successful exact-SHA CI and Pages runs;
- production runtime measurements and screenshots; and
- clean upstream parity `0 0`.

Do not claim completion while any requested visible string, visual contract,
animation invariant, viewport, locale, workflow, deployment, or parity check
remains unverified.
