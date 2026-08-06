# Homepage Interaction Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smoothly navigate from the homepage hero to installation, restore one centered story-discovery action beneath two whole-card YouTube links, and tighten the homepage rhythm so following content appears sooner.

**Architecture:** CSS owns smooth versus reduced-motion scrolling and the target offset. A scoped React click handler repairs mobile fragment activation by preserving `#install` in history and calling `scrollIntoView({ block: "start" })` for unmodified primary clicks; the semantic anchor remains intact. The stories section keeps its existing source data, exports one unquoted Google query constant, renders each card as a single external anchor, and renders one localized button-style discovery anchor after the grid. Responsive Tailwind classes compact the GNB, hero, terminal preview, and section spacing without changing page order or product copy.

**Tech Stack:** React 19, TypeScript 6, React Router 8 static build, Tailwind CSS, Shadcn UI, Vitest/jsdom, Node test runner, agent-browser, GitHub Actions, GitHub Pages.

## Global Constraints

- Keep the existing hero `href="#install"` and target `id="install"`.
- Stop the installation target with `6rem` of top clearance below the fixed header.
- Use native `scroll-behavior: smooth` as the motion source. The install link may use only the scoped activation repair; add no scroll listener, duration, easing, or animation dependency.
- Use `scroll-behavior: auto` when `prefers-reduced-motion: reduce` matches.
- Keep exactly two featured stories in their current order with unchanged publisher, localized title, thumbnail, and YouTube URL data.
- Make each entire story card one new-tab YouTube anchor with no nested interactive element.
- Render exactly one localized `moreStoriesAction` below the story grid, centered, using `kmsg 카카오톡 OR kmsg 카톡 OR kmsg 카카오` without quote characters.
- Give every new-tab story and discovery link `rel="noopener noreferrer"`.
- Preserve the tagline scrub, footer wordmark, theme persistence, locale behavior, and all non-homepage runtime code.
- Leave the user-owned untracked `tasks/` directory untouched and stage only explicit task paths.
- Push `main` explicitly as `refs/heads/main:refs/heads/main`; never force-push.
- Run local Node 26 site tests with `NODE_OPTIONS=--no-experimental-webstorage`.

---

### Task 1: Smooth native installation navigation

**Files:**
- Create: `site/test/home-interactions-css.test.mjs`
- Modify: `site/test/home.test.tsx`
- Modify: `site/app/app.css:82-101,158-168`
- Modify after browser verification: `site/app/components/home-page.tsx`

**Interfaces:**
- Consumes: existing hero anchor `href="#install"` and installation section `id="install"`.
- Produces: document-level `scroll-behavior: smooth`, `#install { scroll-margin-top: 6rem; }`, a reduced-motion `scroll-behavior: auto` override, and a scoped activation repair when native mobile fragment scrolling does not settle at the target.

- [ ] **Step 1: Write the failing CSS contract test**

Create `site/test/home-interactions-css.test.mjs`:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const styles = await readFile(new URL("../app/app.css", import.meta.url), "utf8")

test("install navigation scrolls smoothly with target clearance", () => {
  assert.match(
    styles,
    /@layer base[\s\S]*html\s*\{[^}]*scroll-behavior:\s*smooth;/,
  )
  assert.match(styles, /#install\s*\{[^}]*scroll-margin-top:\s*6rem;/)
})

test("reduced motion restores immediate anchor navigation", () => {
  assert.match(
    styles,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*html\s*\{[^}]*scroll-behavior:\s*auto;/,
  )
})
```

- [ ] **Step 2: Extend the DOM test for the native anchor contract**

In `site/test/home.test.tsx`, after rendering the Korean homepage, assert the
localized hero link and target still form one native fragment pair:

```tsx
const installAction = screen.getByRole("link", { name: "설치하기" })
const installTarget = container.querySelector("#install")

expect(installAction).toHaveAttribute("href", "#install")
expect(installTarget).toBeInTheDocument()
expect(installTarget).toHaveAttribute("id", "install")
```

- [ ] **Step 3: Run the focused tests and confirm the red state**

Run:

```bash
node --test site/test/home-interactions-css.test.mjs
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/home.test.tsx
```

Expected: the Node CSS test fails because `scroll-behavior` and the `#install`
scroll margin do not exist. The DOM assertions pass, proving the semantic
anchor baseline is already intact.

- [ ] **Step 4: Add the minimal production CSS**

Update the existing base `html` rule and add the target rule:

```css
@layer base {
  html {
    @apply bg-background font-sans text-foreground antialiased;
    scroll-behavior: smooth;
  }
}

#install {
  scroll-margin-top: 6rem;
}
```

Add this first inside the existing reduced-motion query:

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

- [ ] **Step 5: Run the focused tests and full checkpoint checks**

Run:

```bash
node --test site/test/home-interactions-css.test.mjs
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/home.test.tsx
NODE_OPTIONS=--no-experimental-webstorage npm test --prefix site
git diff --check
```

Expected: the focused tests and the full build, typecheck, Vitest, and Node
suites all pass.

- [ ] **Step 6: Verify the user-visible scroll behavior locally**

Build and preview the site, then use agent-browser at 1440×900, 390×844, and
320×844. At each width:

1. start at `scrollY = 0`;
2. click the localized install action;
3. confirm an intermediate animation frame differs from both start and final
   scroll positions;
4. wait until scrolling settles;
5. confirm `location.hash === "#install"`;
6. confirm the target top is within 2px of `96px` and horizontal overflow is
   zero; and
7. repeat with reduced motion and confirm the first measured position is the
   final position.

- [ ] **Step 7: Commit and push checkpoint 4/5**

Stage only the task paths:

```bash
git add site/app/app.css site/test/home.test.tsx site/test/home-interactions-css.test.mjs
git diff --cached --check
git commit -m "feat(site): smooth-scroll install navigation"
git push origin refs/heads/main:refs/heads/main
git fetch origin refs/heads/main:refs/remotes/origin/main
git rev-list --left-right --count HEAD...refs/remotes/origin/main
```

Expected parity: `0 0`.

---

### Task 1A: Repair mobile fragment activation found in browser verification

**Files:**
- Modify: `site/test/home.test.tsx`
- Modify: `site/app/components/home-page.tsx`

**Evidence:** At 390px and 320px, clicking the native fragment link stopped
well before `#install`. The target's document position and page height remained
stable, while a direct `scrollIntoView({ behavior: "smooth", block: "start" })`
settled at the expected 6rem clearance. This isolated activation interruption
from layout shift.

- [ ] **Step 1: Add a failing activation regression test**

Assert that an unmodified install-link click keeps `location.hash` equal to
`#install` and calls the target's `scrollIntoView` with `{ block: "start" }`.

- [ ] **Step 2: Add the minimal scoped handler**

Ignore prevented events, non-primary buttons, and modifier-key clicks. When the
target exists, prevent the interrupted native activation, push `#install` only
when necessary, and call `scrollIntoView({ block: "start" })`. Do not pass a
`behavior` option: the CSS media query must continue to select smooth or auto.

- [ ] **Step 3: Re-run automated and browser gates**

Run the focused Vitest case and the full site gate. At 1440px, 390px, and 320px,
prove multiple intermediate positions under normal motion, a final target top
near 96px, the fragment hash, and zero overflow. Under reduced motion, prove
the click and next-frame positions are identical at all three widths.

- [ ] **Step 4: Commit and push the corrective checkpoint**

```bash
git add site/app/components/home-page.tsx site/test/home.test.tsx
git commit -m "fix(site): keep install scroll aligned on mobile"
git push origin refs/heads/main:refs/heads/main
```

---

### Task 2: Restore centralized story discovery

**Files:**
- Modify: `site/app/content/home.ts`
- Modify: `site/app/components/home-page.tsx:220-243`
- Modify: `site/test/home.test.tsx`

**Interfaces:**
- Consumes: `HOME_STORIES`, localized `copy.moreStoriesAction`, Shadcn `Card`, and `buttonVariants`.
- Produces: `MORE_STORIES_URL: string`, two `[data-story-link]` external anchors, and one `[data-story-search]` external anchor.

- [ ] **Step 1: Write the failing Korean story-link test**

Add a dedicated case to `site/test/home.test.tsx` using this exact historical
Google URL:

```tsx
const MORE_STORIES_URL =
  "https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1+OR+kmsg+%EC%B9%B4%ED%86%A1+OR+kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4"

it("links whole featured cards and renders one centered discovery action", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
  const { container } = render(<HomePage locale="ko" />)
  const storyLinks = [...container.querySelectorAll<HTMLAnchorElement>("[data-story-link]")]
  const discoveryLinks = screen.getAllByRole("link", {
    name: "더 많은 사례 보기",
  })

  expect(storyLinks.map((link) => link.href)).toEqual([
    "https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s",
    "https://www.youtube.com/watch?v=xz5fA7OyvQ0",
  ])
  for (const link of storyLinks) {
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(link.querySelector("a, button, [role='button']")).toBeNull()
  }

  expect(discoveryLinks).toHaveLength(1)
  expect(discoveryLinks[0]).toHaveAttribute("data-story-search")
  expect(discoveryLinks[0]).toHaveAttribute("href", MORE_STORIES_URL)
  expect(discoveryLinks[0]).toHaveAttribute("target", "_blank")
  expect(discoveryLinks[0]).toHaveAttribute("rel", "noopener noreferrer")
  expect(discoveryLinks[0]?.parentElement).toHaveClass("justify-center")
})
```

- [ ] **Step 2: Write the failing localized single-action test**

Add a table-driven case in the same file:

```tsx
it.each([
  ["ko", "더 많은 사례 보기"],
  ["en", "See more examples"],
  ["jp", "その他の活用事例を見る"],
  ["cn", "查看更多案例"],
] as const)("renders one localized story discovery action for %s", (locale, label) => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
  render(<HomePage locale={locale} />)

  expect(screen.getAllByRole("link", { name: label })).toHaveLength(1)
})
```

- [ ] **Step 3: Run the focused test and confirm the red state**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/home.test.tsx
```

Expected: FAIL because no `[data-story-link]` anchors exist and two per-card
links still share the discovery label.

- [ ] **Step 4: Export the restored discovery URL**

Add to `site/app/content/home.ts`:

```ts
export const MORE_STORIES_URL =
  "https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1+OR+kmsg+%EC%B9%B4%ED%86%A1+OR+kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4"
```

- [ ] **Step 5: Make each complete card one YouTube link**

Import `MORE_STORIES_URL` with the existing home content. Replace each per-card
footer action with one wrapping anchor:

```tsx
{HOME_STORIES.map((story) => (
  <a
    className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    data-story-link
    href={story.href}
    key={story.href}
    rel="noopener noreferrer"
    target="_blank"
  >
    <Card className="h-full overflow-hidden hover:border-primary/40">
      <img
        alt=""
        className="aspect-video w-full object-cover"
        loading="lazy"
        src={story.image}
      />
      <CardHeader>
        <p className="text-sm text-muted-foreground">{story.publisher}</p>
        <CardTitle>{story.title[locale]}</CardTitle>
      </CardHeader>
    </Card>
  </a>
))}
```

- [ ] **Step 6: Add one centered Google discovery action**

Immediately after the story grid, render:

```tsx
<div className="mt-8 flex justify-center">
  <a
    className={buttonVariants({ variant: "outline" })}
    data-story-search
    href={MORE_STORIES_URL}
    rel="noopener noreferrer"
    target="_blank"
  >
    {copy.moreStoriesAction}
    <ExternalLink aria-hidden="true" data-icon="inline-end" />
  </a>
</div>
```

- [ ] **Step 7: Run the focused tests and full checkpoint checks**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/home.test.tsx
NODE_OPTIONS=--no-experimental-webstorage npm test --prefix site
git diff --check
```

Expected: the focused story tests and the full build, typecheck, Vitest, and
Node suites all pass.

- [ ] **Step 8: Verify the story layout locally**

At 1440×900, 390×844, and 320×844 with agent-browser:

1. confirm exactly two `[data-story-link]` anchors and one
   `[data-story-search]` anchor;
2. confirm each story anchor contains one card and no nested link or button;
3. confirm both story destinations and the exact Google URL;
4. confirm every link has `target="_blank"` and `rel="noopener noreferrer"`;
5. focus each whole-card anchor and confirm a visible focus ring;
6. confirm the discovery button is horizontally centered below the complete
   grid and horizontal overflow is zero; and
7. click a story and the discovery action in isolated tabs, confirming each
   creates a new tab with the expected URL.

- [ ] **Step 9: Commit and push checkpoint 5/5**

Stage only the task paths:

```bash
git add site/app/content/home.ts site/app/components/home-page.tsx site/test/home.test.tsx
git diff --cached --check
git commit -m "fix(site): restore centralized story discovery"
git push origin refs/heads/main:refs/heads/main
git fetch origin refs/heads/main:refs/remotes/origin/main
git rev-list --left-right --count HEAD...refs/remotes/origin/main
```

Expected parity: `0 0`.

---

### Task 2A: Remove query quotes and tighten homepage density

**Files:**
- Modify: `site/app/content/home.ts`
- Modify: `site/app/components/home-page.tsx`
- Modify: `site/app/components/site-header.tsx`
- Modify: `site/test/home.test.tsx`
- Modify: `site/test/shell.test.tsx`

**Reference evidence:** At 1440×900, the published KMSG hero occupied 828px
and the next section content started after the viewport. Markdowner used a 56px
floating GNB and ended its hero at 700px. At 390×844, KMSG's content-driven
hero reached about 1059px while Markdowner's ended near 696px.

- [ ] **Step 1: Update the independent URL expectation and prove RED**

Change the expected discovery URL to the exact unquoted query, run the focused
homepage test, and confirm it fails against the three `%22` phrase wrappers.

- [ ] **Step 2: Publish the unquoted query**

Remove only the encoded quote characters from `MORE_STORIES_URL`, keep the
three terms and `OR` operators in order, run the full site gate, then commit and
push `fix(site): broaden case discovery search`.

- [ ] **Step 3: Add failing density and GNB regression tests**

Assert the hero has no viewport-height minimum, mobile and desktop typography
use the agreed Tailwind scale, the terminal compacts responsively, the eight
following sections use the new rhythm, and the GNB is a centered 56px
`max-w-5xl` pill.

- [ ] **Step 4: Apply the targeted existing-stack redesign**

Keep the split hero, yellow CTA, terminal content, product copy, routes, and
section order. Use a content-height hero, 36px mobile heading, compact mobile
terminal, 64px/80px section spacing, an optically tighter first workflow
boundary, and the 56px GNB. Add no dependency or new runtime abstraction.

- [ ] **Step 5: Verify layout and interaction in real browsers**

At 1440×900, 390×844, and 320×720, record the GNB, hero bottom, next label,
install target, and horizontal overflow. Require the next label in the first
viewport at 1440px and 390px, allow terminal wrapping at 320px, and preserve
smooth/reduced-motion installation behavior. Exercise the mobile Sheet and run
Axe in dark and paper themes.

- [ ] **Step 6: Commit and push the layout checkpoint**

```bash
git add site/app/components/home-page.tsx site/app/components/site-header.tsx site/test/home.test.tsx site/test/shell.test.tsx
git commit -m "feat(site): refine homepage layout rhythm"
git push origin refs/heads/main:refs/heads/main
```

---

### Task 3: Prove the published homepage behavior

**Files:**
- Verify only; modify the Task 1 or Task 2 paths only if production evidence
  contradicts the approved specification.

**Interfaces:**
- Consumes: the exact final `main` SHA, GitHub Actions CI, GitHub Pages, and the
  published homepage.
- Produces: requirement-by-requirement evidence for final completion.

- [ ] **Step 1: Run a fresh final local gate**

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test --prefix site
git diff --check
```

- [ ] **Step 2: Wait for exact-SHA CI and Pages success**

Resolve `final_sha=$(git rev-parse HEAD)`, then use
`gh run list --commit "$final_sha"` and `gh run view` with each returned run ID
to prove both workflows completed successfully for that implementation SHA.
Verify the Pages deployment status and environment URL through the GitHub API.

- [ ] **Step 3: Repeat browser checks on GitHub Pages**

Repeat Task 1 Step 6 and Task 2 Step 8 against
`https://channprj.github.io/kmsg/`. Run an Axe WCAG A/AA audit after all
scroll-dimmed text is fully visible; report `incomplete` findings separately
from violations. Confirm browser console and page errors are empty.

- [ ] **Step 4: Prove repository and remote parity**

```bash
git fetch origin refs/heads/main:refs/remotes/origin/main
git rev-list --left-right --count HEAD...refs/remotes/origin/main
git rev-parse HEAD
git rev-parse refs/remotes/origin/main
git ls-remote --heads origin refs/heads/main
git status --short
```

Expected: local, tracking, and live SHA match; parity is `0 0`; the only
working-tree entry is the preserved untracked `tasks/` directory.
