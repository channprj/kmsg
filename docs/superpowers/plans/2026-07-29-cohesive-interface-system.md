# Cohesive KMSG Interface System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one coherent KMSG homepage and documentation interface with the exact three-phrase story search, canonical `/mcp/` routing, a shared SVG icon grammar, readable semantic typography, and consistent responsive surfaces.

**Architecture:** Keep the existing static generator architecture: `site/build.mjs` owns localized HTML and server-rendered icons, `site/src/styles.css` owns visual tokens and responsive geometry, and `site/src/app.js` owns theme, copy, TOC, and terminal behavior. Extend the current build regression suite before every production change, preserve `/openclaw/` only as an unlinked compatibility redirect, and publish every green checkpoint directly from the explicitly approved `main` branch.

**Tech Stack:** Node.js 22, ESM, `marked`, `sanitize-html`, Node's built-in test runner, static HTML/CSS/JavaScript, Swift Package Manager, GitHub Actions, GitHub Pages, and agent-browser.

---

## Execution constraints

- The repository tool map requires sequential work in the main thread, so use
  `executing-plans` inline rather than subagent dispatch.
- The user's `$git-commit-push-realtime` instruction explicitly authorizes work
  on the current `main` branch. Do not create a detached feature branch or
  defer pushes.
- Stage only the paths named in each task. Push with
  `git push origin refs/heads/main:refs/heads/main`, fetch, and require
  `git rev-list --left-right --count HEAD...origin/main` to print `0 0`.
- Follow red-green-refactor for every behavior change. A browser defect gets a
  failing regression test before its fix.
- Keep the existing 11px homepage terminal transcript only inside the
  `max-width: 350px` rule. All interface labels, metadata, navigation,
  controls, and prose remain at least 12px.

## File responsibility map

- `site/build.mjs`: localized copy, public route generation, inline SVG icon
  rendering, story-search markup, shared header/home/docs markup, and
  server-rendered code-copy controls.
- `site/src/styles.css`: semantic type, icon, radius, spacing, surface,
  home/docs, theme, and responsive rules.
- `site/src/app.js`: theme-state labels, icon-preserving copy feedback, TOC
  tracking, and terminal replay.
- `site/test/build.test.mjs`: generated-output, route, typography, icon,
  accessibility, responsive, and discovery regression contracts.
- `docs/superpowers/specs/2026-07-29-cohesive-interface-system-design.md`:
  approved design and route contract.
- `docs/superpowers/plans/2026-07-29-cohesive-interface-system.md`: this
  executable implementation plan.

### Task 1: Ship exact three-phrase story discovery

**Files:**

- Modify: `site/test/build.test.mjs:703-726`
- Modify: `site/build.mjs:835-842`
- Modify: `site/build.mjs:1359-1391`
- Modify: `site/src/styles.css:1400-1480`

- [ ] **Step 1: Replace the old story URL assertion with a failing four-locale search contract**

Add this test next to the existing homepage story geometry test:

```js
test("story discovery searches every requested Korean phrase", async () => {
  const expectedUrl =
    "https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22";
  const expectedTerms = [
    "kmsg 카카오톡",
    "kmsg 카톡",
    "kmsg 카카오",
  ];

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const panel = html.match(
      /<a class="story-search-action"[\s\S]*?<\/a>/,
    )?.[0];

    assert.ok(panel, `${localeId}: missing story search panel`);
    assert.ok(panel.includes(`href="${expectedUrl}"`), localeId);
    assert.match(panel, /target="_blank" rel="noopener noreferrer"/);
    assert.match(panel, /data-icon="search"/);
    assert.match(panel, /data-icon="external-link"/);
    for (const term of expectedTerms) {
      assert.ok(
        panel.includes(`<span class="story-search-term">${term}</span>`),
        `${localeId}: ${term}`,
      );
    }
  }
});
```

Delete the old assertion for
`https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4`.
Extend the existing legacy-route test by checking every `contentFiles` page:

```js
  for (const path of contentFiles) {
    const html = await readOutput(path);
    const publicSiteLinks = [...html.matchAll(/href="([^"]+)"/g)]
      .map(([, href]) => href)
      .filter((href) => !href.startsWith("https://github.com/"));
    assert.equal(
      publicSiteLinks.some((href) => /(?:^|\/)openclaw\/(?:$|[#?])/.test(href)),
      false,
      path,
    );
  }
```

This is a regression guard for already-canonical behavior: `/openclaw/`
outputs remain redirect artifacts, while every rendered content link uses
`/mcp/`.

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npm run build --prefix site
node --test --test-name-pattern="story discovery searches" site/test/build.test.mjs
```

Expected: FAIL with `missing story search panel`.

- [ ] **Step 3: Add the minimal server-rendered search icon helper**

Immediately after `escapeHtml`, add:

```js
const iconPaths = {
  "external-link":
    '<path d="M14 5h5v5"></path><path d="M10 14 19 5"></path><path d="M19 13v6H5V5h6"></path>',
  search:
    '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
};

const renderIcon = (name, size = 20) => {
  const paths = iconPaths[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="ui-icon ui-icon-${size}" data-icon="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
};
```

- [ ] **Step 4: Replace the story action with the exact URL and visible terms**

Use this complete contract:

```js
const storySearchTerms = [
  "kmsg 카카오톡",
  "kmsg 카톡",
  "kmsg 카카오",
];
const moreStoriesUrl =
  "https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22";
```

Replace the old `.section-action` block in `renderHomeStories` with:

```js
    <div class="section-action">
      <a class="story-search-action" href="${moreStoriesUrl}" target="_blank" rel="noopener noreferrer">
        <span class="story-search-title">
          ${renderIcon("search")}
          <span>${escapeHtml(copy.moreStoriesAction)}</span>
          ${renderIcon("external-link")}
        </span>
        <span class="story-search-terms" translate="no">
          ${storySearchTerms
            .map(
              (term) =>
                `<span class="story-search-term">${escapeHtml(term)}</span>`,
            )
            .join("")}
        </span>
      </a>
    </div>
```

- [ ] **Step 5: Style the search panel as a complete responsive action**

Replace the old `.text-action` rules with:

```css
.ui-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}

.ui-icon-16 {
  width: 16px;
  height: 16px;
}

.ui-icon-18 {
  width: 18px;
  height: 18px;
}

.ui-icon-20 {
  width: 20px;
  height: 20px;
}

.section-action {
  margin-top: 24px;
}

.story-search-action {
  display: flex;
  min-height: 72px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: color-mix(in srgb, var(--canvas-raised) 72%, transparent);
  color: var(--ink-muted);
  text-decoration: none;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.story-search-action:hover {
  border-color: var(--line-strong);
  background: var(--canvas-raised);
  color: var(--ink);
}

.story-search-title,
.story-search-terms {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.story-search-title {
  font-size: 14px;
  font-weight: 600;
}

.story-search-term {
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 12px;
}

@media (max-width: 759px) {
  .story-search-action {
    align-items: flex-start;
    flex-direction: column;
  }
}
```

- [ ] **Step 6: Verify GREEN and the unchanged suite**

Run:

```bash
npm test --prefix site
git diff --check
```

Expected: all 44 tests pass and `git diff --check` prints nothing.

- [ ] **Step 7: Commit, push, and prove parity**

Run:

```bash
git add site/test/build.test.mjs site/build.mjs site/src/styles.css
git diff --cached --check
git commit -m "feat(site): expand story discovery queries"
git push origin refs/heads/main:refs/heads/main
git fetch origin refs/heads/main
git rev-list --left-right --count HEAD...origin/main
```

Expected: the final command prints `0	0`.

### Task 2: Unify iconography and semantic typography

**Files:**

- Modify: `site/test/build.test.mjs:421-445`
- Modify: `site/test/build.test.mjs:780-815`
- Modify: `site/test/build.test.mjs:880-1020`
- Modify: `site/build.mjs:35-150`
- Modify: `site/build.mjs:835-870`
- Modify: `site/build.mjs:1050-1180`
- Modify: `site/build.mjs:1319-1510`
- Modify: `site/src/app.js:72-140`
- Modify: `site/src/styles.css:1-410`
- Modify: `site/src/styles.css:1015-2190`

- [ ] **Step 1: Write failing generated-icon and type-token tests**

Add:

```js
test("shared SVG icons replace character glyphs in interface controls", async () => {
  const [home, usage, app] = await Promise.all([
    readOutput("index.html"),
    readOutput("usage/index.html"),
    readOutput("assets/app.js"),
  ]);
  const rendered = `${home}\n${usage}`;
  const requiredIcons = [
    "arrow-right",
    "external-link",
    "copy",
    "check",
    "chevron-down",
    "plus",
    "minus",
    "search",
    "sun",
    "moon",
  ];

  for (const icon of requiredIcons) {
    assert.match(rendered, new RegExp(`data-icon="${icon}"`), icon);
  }
  assert.doesNotMatch(
    rendered,
    /<span[^>]*aria-hidden="true">(?:↗|→|⌄|⧉|\+)<\/span>/,
  );
  assert.match(
    rendered,
    /<svg class="ui-icon ui-icon-(?:16|18|20)"[^>]*viewBox="0 0 24 24"[^>]*stroke-width="1.75"[^>]*aria-hidden="true"/,
  );
  assert.doesNotMatch(app, /textContent = "✓"/);
  assert.match(app, /classList\.add\("is-copied"\)/);
});

test("semantic typography keeps interface text readable", async () => {
  const styles = await readOutput("assets/styles.css");
  const tokens = {
    "--text-xs": "12px",
    "--text-sm": "14px",
    "--text-md": "16px",
    "--text-lg": "18px",
    "--text-xl": "24px",
    "--heading-sm": "clamp(30px, 3vw, 40px)",
    "--heading-md": "clamp(44px, 5vw, 60px)",
    "--heading-lg": "clamp(52px, 5.8vw, 72px)",
  };

  for (const [token, value] of Object.entries(tokens)) {
    assert.ok(styles.includes(`${token}: ${value};`), token);
  }
  for (const selector of [
    ".primary-nav a",
    ".section-label",
    ".capability-index",
    ".agent-skill-step",
    ".story-publisher",
    ".docs-meta",
    ".toc-label",
    ".source-stamp",
    ".code-copy",
    ".markdown-body th",
    ".footer-brand span",
  ]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = styles.match(new RegExp(`${escaped}[^\\{]*\\{([^}]*)\\}`))?.[1];
    assert.ok(block, selector);
    assert.doesNotMatch(block, /font-size:\s*(?:[0-9]|1[01])px;/);
  }
  assert.match(
    styles,
    /@media \(max-width:\s*350px\)[\s\S]*\.terminal-body\s*\{[^}]*font-size:\s*11px;/,
  );
});
```

Update the existing interface metadata assertion from brand dimensions `36`
to `32`, and replace the client-side `aria-live` assertion with a generated
`.code-copy` button assertion.

- [ ] **Step 2: Run the two tests and verify RED**

Run:

```bash
npm run build --prefix site
node --test --test-name-pattern="shared SVG icons|semantic typography" site/test/build.test.mjs
```

Expected: FAIL because required icon names and semantic tokens are absent.

- [ ] **Step 3: Expand the icon registry and add reusable copy markup**

Replace `iconPaths` with:

```js
const iconPaths = {
  "arrow-right": '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
  "external-link":
    '<path d="M14 5h5v5"></path><path d="M10 14 19 5"></path><path d="M19 13v6H5V5h6"></path>',
  copy:
    '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
  check: '<path d="m5 12 4 4L19 6"></path>',
  "chevron-down": '<path d="m6 9 6 6 6-6"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  minus: '<path d="M5 12h14"></path>',
  search:
    '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
  sun:
    '<circle cx="12" cy="12" r="3.25"></circle><path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.42 1.42M17.12 17.12l1.42 1.42M18.54 5.46l-1.42 1.42M6.88 17.12l-1.42 1.42"></path>',
  moon: '<path d="M20 15.4A8.5 8.5 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z"></path>',
};

const renderCopyIcons = () => `
  <span class="copy-icons" aria-hidden="true">
    ${renderIcon("copy", 18)}
    ${renderIcon("check", 18)}
  </span>`;
```

Change the four `sourceAction` values to `source` and remove the trailing
`↗` from all four localized `edit` values.

- [ ] **Step 4: Render every interface icon through `renderIcon`**

Use:

```js
${renderIcon("external-link", 16)}
${renderIcon("chevron-down", 18)}
${renderIcon("sun", 18)}
${renderIcon("moon", 18)}
${renderCopyIcons()}
${renderIcon("plus", 20)}
${renderIcon("minus", 20)}
${renderIcon("arrow-right", 18)}
```

to replace the header, TOC/source, docs metadata, Skill copy, story-card,
FAQ, install, and hero glyphs. The theme button must contain both sun and moon
SVGs. The FAQ control must contain both plus and minus SVGs. Change the brand
image attributes to `width="32" height="32"`.

In `enhanceRenderedMarkdown`, inject a localized server-rendered code-copy
button before each code element:

```js
  enhanced = enhanced.replace(
    /<pre><code/g,
    `<pre><button class="code-copy copy-control" type="button" aria-label="${escapeHtml(page.localeConfig.ui.copy)}" aria-live="polite" data-code-copy data-copied-label="${escapeHtml(page.localeConfig.ui.copied)}" data-copy-failed-label="${escapeHtml(page.localeConfig.ui.copyFailed)}">${renderCopyIcons()}<span data-copy-label>${escapeHtml(page.localeConfig.ui.copy)}</span></button><code`,
  );
```

- [ ] **Step 5: Preserve SVG markup during copy feedback**

Replace the mutation in `markCopied` and the dynamic code-button creation with:

```js
const markCopied = (button, fallbackLabel = copiedLabel) => {
  const originalLabel = button.getAttribute("aria-label");
  const visibleLabel = button.querySelector("[data-copy-label]");
  const originalText = visibleLabel?.textContent;
  const nextLabel = button.dataset.copiedLabel || fallbackLabel;

  button.classList.add("is-copied");
  button.setAttribute("aria-label", nextLabel);
  if (visibleLabel) visibleLabel.textContent = nextLabel;

  window.setTimeout(() => {
    button.classList.remove("is-copied");
    if (originalLabel) button.setAttribute("aria-label", originalLabel);
    else button.removeAttribute("aria-label");
    if (visibleLabel && originalText) visibleLabel.textContent = originalText;
  }, 1600);
};

document.querySelectorAll("[data-code-copy]").forEach((button) => {
  const code = button.closest("pre")?.querySelector("code");
  if (!code) return;

  button.addEventListener("click", async () => {
    try {
      await copyText(code.textContent || "");
      markCopied(button);
    } catch {
      button.setAttribute(
        "aria-label",
        button.dataset.copyFailedLabel || copyFailedLabel,
      );
    }
  });
});
```

- [ ] **Step 6: Add semantic type tokens and normalize interface text**

Add to `:root`:

```css
  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 24px;
  --heading-sm: clamp(30px, 3vw, 40px);
  --heading-md: clamp(44px, 5vw, 60px);
  --heading-lg: clamp(52px, 5.8vw, 72px);
```

Change existing declarations in place to this exact contract:

```css
.primary-nav a,
.llm-link,
.story-search-title {
  font-size: var(--text-sm);
  text-transform: none;
}

.language-control select,
.eyebrow,
.section-label,
.principle-token,
.capability-index,
.command-panel-bar,
.agent-skill-step,
.agent-invocation span,
.agent-prompt-example > span,
.story-publisher,
.requirement-list li,
.install-panel small,
.docs-meta,
.toc-label,
.toc-source,
.source-stamp,
.code-copy,
.markdown-body th,
.footer-brand span,
.site-footer > p {
  font-size: var(--text-xs);
}

.capability-copy li,
.agent-skill-command code,
.agent-prompt-example code,
.install-links a,
.footer-links a,
.markdown-body table,
.markdown-body .story-copy p {
  font-size: var(--text-sm);
}

body,
.markdown-body p {
  font-size: var(--text-md);
}

.product-hero .hero-lead,
.docs-hero > p:not(.eyebrow),
.markdown-body > p:first-of-type {
  font-size: var(--text-lg);
}

.agent-skill-card h3 {
  font-size: var(--text-xl);
}
```

Keep `.terminal-body` at 13px desktop, 12px under 760px, and 11px under 350px.

- [ ] **Step 7: Add icon and state CSS**

Add:

```css
.theme-icon,
.copy-icons,
.faq-icons {
  display: inline-grid;
  place-items: center;
}

.theme-icon > *,
.copy-icons > *,
.faq-icons > * {
  grid-column: 1;
  grid-row: 1;
}

:root[data-theme="dark"] [data-icon="moon"],
:root[data-theme="paper"] [data-icon="sun"],
.copy-icons [data-icon="check"],
.faq-item:not([open]) [data-icon="minus"],
.faq-item[open] [data-icon="plus"] {
  visibility: hidden;
}

.copy-control.is-copied [data-icon="copy"] {
  visibility: hidden;
}

.copy-control.is-copied [data-icon="check"] {
  visibility: visible;
}
```

Remove the old rotated FAQ plus rule. Set header/link icons to 18px, copy
icons to 18px, and story/FAQ/search icons to 20px through `renderIcon`.

- [ ] **Step 8: Verify GREEN and full regression**

Run:

```bash
npm test --prefix site
git diff --check
rg -n 'font-size:\\s*(8|9|10|11)px' site/src/styles.css
```

Expected: all tests pass. The final search reports only the documented terminal
11px breakpoint and no interface selector.

- [ ] **Step 9: Commit, push, and prove parity**

Run:

```bash
git add site/test/build.test.mjs site/build.mjs site/src/app.js site/src/styles.css
git diff --cached --check
git commit -m "style(site): unify typography and iconography"
git push origin refs/heads/main:refs/heads/main
git fetch origin refs/heads/main
git rev-list --left-right --count HEAD...origin/main
```

Expected: the final command prints `0	0`.

### Task 3: Harmonize home and documentation surfaces

**Files:**

- Modify: `site/test/build.test.mjs:840-1020`
- Modify: `site/src/styles.css:1-410`
- Modify: `site/src/styles.css:880-2200`
- Modify: `site/src/styles.css:2205-2745`

- [ ] **Step 1: Write failing shared geometry and surface tests**

Replace the old assertions that principles have no border/radius and add:

```js
test("home and docs share the cohesive geometry system", async () => {
  const styles = await readOutput("assets/styles.css");

  for (const declaration of [
    "--radius-sm: 8px;",
    "--radius-md: 12px;",
    "--radius-lg: 16px;",
  ]) {
    assert.ok(styles.includes(declaration), declaration);
  }
  assert.match(
    styles,
    /\.header-inner\s*\{[^}]*min-height:\s*64px;/s,
  );
  assert.match(
    styles,
    /\.product-section\s*\{[^}]*padding:\s*80px 0;/s,
  );
  assert.match(
    styles,
    /\.docs-hero h1\s*\{[^}]*font-size:\s*var\(--heading-md\);/s,
  );
  assert.match(
    styles,
    /\.content-layout\s*\{[^}]*padding:\s*80px 0;/s,
  );
  assert.match(
    styles,
    /\.principle-card\s*\{[^}]*border:\s*1px solid var\(--line\);[^}]*border-radius:\s*var\(--radius-md\);/s,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*759px\)[\s\S]*\.product-section\s*\{[^}]*padding:\s*64px 0;/s,
  );
});
```

- [ ] **Step 2: Run the geometry test and verify RED**

Run:

```bash
npm run build --prefix site
node --test --test-name-pattern="cohesive geometry system" site/test/build.test.mjs
```

Expected: FAIL because radius tokens and 64/80px geometry are absent.

- [ ] **Step 3: Add radius tokens and align the shared header**

Replace `--radius` with:

```css
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
```

Use:

```css
.header-inner {
  min-height: 64px;
}

.brand img {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
}

.language-control {
  height: 36px;
  border-radius: var(--radius-sm);
}

.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
}
```

Keep the existing 44px mobile control rules and two-row scrollable navigation.

- [ ] **Step 4: Normalize homepage hierarchy, spacing, and surfaces**

Change existing rules in place:

```css
.product-hero h1 {
  font-size: var(--heading-lg);
}

.product-section {
  padding: 80px 0;
}

.section-heading h2,
.install-panel h2 {
  font-size: var(--heading-sm);
}

.principle-grid,
.agent-skill-grid,
.stories-section .story-grid {
  gap: 16px;
}

.principle-card,
.agent-skill-card {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--canvas-raised) 74%, transparent);
}

.story-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--canvas-raised);
}

.command-panel,
.agent-skill-command,
.agent-invocation,
.agent-prompt-example,
.story-search-action,
.install-command {
  border-radius: var(--radius-md);
}

.install-panel {
  padding: 48px clamp(32px, 5vw, 64px);
  border-radius: var(--radius-lg);
}
```

Do not apply card padding to `.story-card` itself because its media must remain
edge-to-edge; keep `.story-copy` at 24px. Remove the first/last principle
padding exceptions and both adjacent-card border overrides so each principle
uses equal card geometry.

- [ ] **Step 5: Normalize documentation hierarchy and density**

Use:

```css
.docs-hero {
  padding: 80px 0 64px;
}

.docs-hero h1 {
  max-width: 880px;
  font-size: var(--heading-md);
}

.content-layout {
  padding: 80px 0;
  grid-template-columns: 200px minmax(0, 820px);
  gap: 64px;
}

.markdown-body h2 {
  margin: 80px 0 24px;
  font-size: var(--heading-sm);
}

.markdown-body h3 {
  margin: 48px 0 16px;
  font-size: var(--text-xl);
}

.markdown-body h4 {
  margin: 32px 0 12px;
  font-size: var(--text-lg);
}

.markdown-body > p:first-of-type {
  font-size: var(--text-lg);
  line-height: 1.75;
}

.markdown-body pre,
.markdown-body blockquote,
.story-card,
.media-frame {
  border-radius: var(--radius-md);
}

.table-scroll,
.markdown-body :not(pre) > code,
.docs-meta > *,
.source-stamp {
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 6: Align responsive geometry**

Use:

```css
@media (max-width: 759px) {
  .product-section {
    padding: 64px 0;
  }

  .section-heading h2,
  .install-panel h2 {
    font-size: clamp(30px, 9vw, 36px);
  }

  html[lang="ko"] .stories-section .section-heading h2 {
    font-size: clamp(30px, 8.4vw, 34px);
  }

  .principle-card {
    padding: 24px;
  }

  .install-panel {
    padding: 40px 24px;
    border-radius: var(--radius-lg);
  }
}

@media (max-width: 760px) {
  .docs-hero {
    padding: 64px 0 48px;
  }

  .docs-hero h1 {
    font-size: clamp(40px, 12vw, 52px);
  }

  .content-layout {
    padding: 64px 0 80px;
  }
}
```

Update the existing narrow Korean story-heading assertion to `30px` minimum.

- [ ] **Step 7: Verify GREEN and full local gates**

Run:

```bash
npm test --prefix site
swift build
git diff --check
```

Expected: all site tests pass, Swift debug build succeeds, and the diff check is
silent.

- [ ] **Step 8: Commit, push, and prove parity**

Run:

```bash
git add site/test/build.test.mjs site/src/styles.css
git diff --cached --check
git commit -m "style(site): harmonize home and docs surfaces"
git push origin refs/heads/main:refs/heads/main
git fetch origin refs/heads/main
git rev-list --left-right --count HEAD...origin/main
```

Expected: the final command prints `0	0`.

### Task 4: Browser, accessibility, publication, and production proof

**Files:**

- Modify on defect only: `site/test/build.test.mjs`
- Modify on defect only: `site/build.mjs`
- Modify on defect only: `site/src/app.js`
- Modify on defect only: `site/src/styles.css`
- Create: `/tmp/kmsg-cohesive-interface-qa/` screenshots

- [ ] **Step 1: Run clean complete local gates**

Run:

```bash
npm test --prefix site
swift build
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
```

Expected: all site tests pass, Swift succeeds, the tree is clean, and parity is
`0	0`.

- [ ] **Step 2: Start a production-like static server**

Run:

```bash
npx --yes serve site/dist --listen 4173
```

Keep the yielded terminal session running. Expected origin:
`http://127.0.0.1:4173`.

- [ ] **Step 3: Verify route and locale coverage in an isolated browser session**

Using session `kmsg-cohesive-qa`, open and inspect:

```text
/
/usage/
/mcp/
/skill/
/architecture/
/en/
/en/mcp/
/jp/
/jp/mcp/
/cn/
/cn/mcp/
```

For each representative route, require:

```js
({
  overflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
  pageKey: document.documentElement.dataset.pageKey,
  locale: document.documentElement.dataset.locale,
  errors: performance.getEntriesByType("resource").filter((entry) => entry.responseStatus >= 400).length,
})
```

Expected: `overflow: true`, the requested page/locale, and `errors: 0`.

- [ ] **Step 4: Verify responsive geometry and capture screenshots**

Create `/tmp/kmsg-cohesive-interface-qa/`. At 1440×1000, 1024×768,
768×1024, 390×844, and 320×800, capture full-page home screenshots plus MCP
documentation at 1440×1000 and 390×844.

At every viewport evaluate:

```js
({
  noOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
  headerHeight: document.querySelector(".header-inner").getBoundingClientRect().height,
  iconSizes: [...document.querySelectorAll(".ui-icon")].map((icon) => {
    const rect = icon.getBoundingClientRect();
    return [rect.width, rect.height];
  }),
  searchTerms: [...document.querySelectorAll(".story-search-term")].map(
    (term) => term.textContent.trim(),
  ),
})
```

Expected: no overflow; desktop header row starts at 64px; icon pairs are
16×16, 18×18, or 20×20; and the three exact Korean terms are present.

- [ ] **Step 5: Verify interactions, theme, and accessibility**

Check:

- story search opens the exact encoded Google URL in a new tab;
- theme toggle switches `dark`/`paper`, swaps sun/moon visibility, updates the
  localized accessible name, and survives reload;
- language selection lands on the equivalent `/mcp/` route;
- Skill, install, and Markdown copy controls retain SVG markup and announce
  the localized copied state;
- FAQ works by pointer and keyboard, swaps plus/minus, and retains native
  `details` behavior;
- reduced-motion mode leaves all information visible;
- home/MCP console output contains no uncaught errors; and
- the agent-browser accessibility scan reports no critical or serious
  violations.

- [ ] **Step 6: Review against web design guidelines**

Run the `web-design-guidelines` review over the changed HTML/CSS/JavaScript.
Resolve only concrete findings. For every behavioral or responsive defect:

1. add a focused failing test;
2. run it and observe the expected failure;
3. apply the smallest correction;
4. run the complete site suite and browser check;
5. commit with `fix(site): ...`;
6. push the explicit `main` ref; and
7. prove `0 0` parity.

- [ ] **Step 7: Wait for final CI and Pages**

Find the GitHub Actions runs for the final SHA. Require the Swift CI workflow
and Pages workflow to complete successfully. If either fails, diagnose from the
logs, add a regression test where applicable, fix, push, and wait for the new
SHA.

- [ ] **Step 8: Verify deployed production**

Open `https://channprj.github.io/kmsg/` and representative `/mcp/`,
`/en/`, `/jp/`, and `/cn/` routes. Repeat 1440×1000, 390×844, and 320×800
overflow checks, the exact story-search URL check, paper-theme check, console
check, and screenshot capture.

- [ ] **Step 9: Final repository proof**

Run:

```bash
git fetch origin refs/heads/main
git rev-list --left-right --count HEAD...origin/main
git status --short --branch
git log --oneline --decorate -6
```

Expected: `0	0`, clean `main...origin/main`, and the documented checkpoint
commits visible at the top of history.
