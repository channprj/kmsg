# Editorial Terminal Homepage Polish Implementation Plan

> **Execution note:** Follow the repository instruction to execute these tasks
> sequentially in the main thread. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Turn the existing KMSG homepage into a distinctive, restrained
editorial terminal page while preserving every route, feature, and interaction.

**Architecture:** Keep the static generator and current semantic DOM. Encode the
new visual contract in the existing build tests, then implement it primarily in
`site/src/styles.css`, using minimal generator changes only for accessibility
metadata. Validate generated HTML, real responsive geometry, interactions, and
the deployed GitHub Pages artifact.

**Tech Stack:** Node.js static generator, HTML, CSS, vanilla JavaScript,
`node:test`, agent-browser, GitHub Actions/Pages.

---

### Task 1: Lock the editorial layout contract

**Files:**
- Modify: `site/test/build.test.mjs`

- [ ] **Step 1: Add failing layout assertions**

Add a test that reads `assets/styles.css` and requires:

```js
assert.match(
  styles,
  /\.product-hero\s*{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/,
);
assert.match(
  styles,
  /\.section-heading\s*{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*minmax\(120px,\s*0\.32fr\)\s+minmax\(0,\s*1fr\)/,
);
assert.doesNotMatch(
  styles,
  /\.principle-card\s*{[^}]*border:\s*1px solid/s,
);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm run build --prefix site
node --test --test-name-pattern "editorial homepage" site/test/build.test.mjs
```

Expected: FAIL because the hero and section headings are not grids and
principles still use bordered cards.

- [ ] **Step 3: Add responsive contract assertions**

Require the hero and section heading grids to collapse at `759px`, story cards
to become one column, and reduced-motion handling to remain present.

- [ ] **Step 4: Verify the added responsive assertions fail**

Run the same targeted command and confirm the expected mismatch.

### Task 2: Refine the hero and terminal hierarchy

**Files:**
- Modify: `site/src/styles.css`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Implement the 12-column hero**

Set `.product-hero` to a 12-column grid. Place `.product-mark` in columns 1–3,
and place kicker, headline, lead, and actions in columns 4–13. Keep a centered
single-column fallback under `759px`.

- [ ] **Step 2: Integrate the terminal**

Reduce hero/workflow separation, align `.workflow-frame` with the page grid,
and keep the compact Ghostty transcript contract unchanged.

- [ ] **Step 3: Run targeted tests**

```bash
npm run build --prefix site
node --test --test-name-pattern "editorial homepage|compact Ghostty" site/test/build.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Verify desktop and mobile**

Serve `site/dist`, then verify 1440×1000 and 390×844 with agent-browser:

```js
({
  overflow: document.documentElement.scrollWidth - innerWidth,
  heroColumns: getComputedStyle(document.querySelector(".product-hero"))
    .gridTemplateColumns,
  terminalWidth: document.querySelector(".terminal-window")
    .getBoundingClientRect().width,
})
```

Expected: `overflow === 0`; desktop has 12 columns; mobile has 1.

### Task 3: Build distinct content rhythms

**Files:**
- Modify: `site/src/styles.css`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Implement editorial section headings**

Use a label rail and a content column on desktop. Place `h2` and optional
description in the content column. Collapse to normal flow on mobile.

- [ ] **Step 2: Remove generic principle cards**

Remove card backgrounds, rounded borders, and boxed tokens. Use technical notes
with structural separators between facts on desktop and clean stacking on
mobile.

- [ ] **Step 3: Differentiate the remaining sections**

Use:

```css
.agent-skill-grid {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
}

.stories-section .story-grid {
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
}

.stories-section .story-card:nth-child(2) {
  margin-top: 64px;
}
```

Reset each layout to one column and zero story offset under `759px`.

- [ ] **Step 4: Tighten capability and install spacing**

Use separators only between capability rows, reduce repeated vertical padding,
and reduce final installation panel padding without changing commands or links.

- [ ] **Step 5: Run the targeted and full tests**

```bash
node --test --test-name-pattern "editorial homepage|responsive product system" site/test/build.test.mjs
npm test --prefix site
```

Expected: all tests pass.

### Task 4: Apply current interface guidelines

**Files:**
- Modify: `site/build.mjs`
- Modify: `site/src/styles.css`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Add accessibility metadata assertions**

Require critical logo images to expose explicit dimensions and high fetch
priority, brand/code tokens to use `translate="no"`, and all icon-only buttons
to retain `aria-label`.

- [ ] **Step 2: Verify RED**

Run the focused test and confirm missing metadata produces the failure.

- [ ] **Step 3: Implement minimal generator and CSS fixes**

Add only the metadata required by the failing test. Add `touch-action:
manipulation`, balanced heading wrapping, explicit select colors, and preserve
existing focus/reduced-motion behavior.

- [ ] **Step 4: Run the installed web-design-guidelines audit**

Fetch the current Vercel guideline source, then review:

```text
site/build.mjs
site/src/app.js
site/src/styles.css
```

Fix every relevant high- or medium-impact finding in scope.

### Task 5: Visual review and delivery

**Files:**
- Review: `site/build.mjs`
- Review: `site/src/app.js`
- Review: `site/src/styles.css`
- Review: `site/test/build.test.mjs`

- [ ] **Step 1: Capture responsive screenshots**

Capture full-page and focused screenshots at 320px, 390px, 768px, and 1440px
for both the dark and paper themes.

- [ ] **Step 2: Verify real interactions**

Verify terminal replay completion, theme persistence, locale routes, copy
feedback, focus visibility, and zero console errors.

- [ ] **Step 3: Compare against the baseline**

Confirm the new page is shorter than 5,771px at 1440px, principles are no
longer generic cards, and the hero/section rhythm is visibly differentiated.

- [ ] **Step 4: Run final gates**

```bash
npm test --prefix site
git diff --check
git status --short --branch
```

- [ ] **Step 5: Commit and push**

Stage only the implementation files and use a verified Conventional Commit.
Push `refs/heads/main:refs/heads/main`, then confirm:

```bash
git rev-list --left-right --count HEAD...origin/main
```

Expected: `0 0`.

- [ ] **Step 6: Verify production**

Wait for Pages and Swift CI, then repeat route, viewport, theme, interaction,
and overflow checks against `https://channprj.github.io/kmsg/`.
