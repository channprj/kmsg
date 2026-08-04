# Replayable Scroll Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replay the KMSG lower-page text animations on every viewport re-entry, render the exact Korean three-line tagline, lift the footer wordmark slightly, and lock the existing first-visit dark-theme contract with regression evidence.

**Architecture:** A small typed React hook owns repeatable `IntersectionObserver` state and is consumed by the existing footer wordmark plus a new focused tagline component. CSS data-state selectors animate only transform and opacity; the existing theme bootstrap remains unchanged and gains explicit characterization coverage.

**Tech Stack:** React 19, TypeScript 6, React Router 8, Tailwind CSS 4, Vitest, Testing Library, Node test runner, agent-browser, GitHub Pages.

## Global Constraints

- Execute inline in the primary session because repository instructions map subagent work to sequential main-thread execution.
- Preserve the existing untracked `tasks/` directory and stage only explicit task paths.
- Keep the Korean copy exactly:

  ```text
  모든 대화를 명령 한 줄로.
  kmsg는 별도 서버 없이
  macOS 에서 직접 실행됩니다.
  ```

- Keep English, Japanese, and Chinese tagline copy and authored newline boundaries unchanged.
- Keep the stored paper-theme preference; use dark only when storage is absent, invalid, or inaccessible.
- Keep the footer wordmark `aria-hidden="true"`, four letters, 20% observer threshold, 55ms letter stagger, 800ms duration, and current crop geometry.
- Change only the wordmark final lift from `-0.06em` to `-0.10em`.
- Animate only `transform` and `opacity`; add no animation package, scroll listener, timer loop, blur, scale, gradient, or scroll timeline.
- Reduced motion and missing `IntersectionObserver` must render complete visible text immediately.
- Run `git diff --check`, the affected tests, the full site gate, real desktop/mobile browser replay, and remote parity checks.
- Push each verified Conventional Commit with `git push origin refs/heads/main:refs/heads/main`; never force-push.

---

## File map

- Create `site/app/lib/use-replayable-reveal.ts`: one reusable viewport-state hook with reduced-motion and missing-observer fallbacks.
- Modify `site/app/components/footer-wordmark.tsx`: consume the hook and remove one-shot observer ownership.
- Modify `site/app/app.css`: raise the final wordmark position and add the tagline's staggered line transition.
- Create `site/app/components/animated-tagline.tsx`: preserve authored newlines and apply replayable state to semantic tagline text.
- Modify `site/app/components/home-page.tsx`: replace the static tagline paragraph with `AnimatedTagline`.
- Modify `site/app/content/legacy-content.json`: change only the Korean tagline's authored lines.
- Modify `site/test/footer-wordmark.test.tsx`: prove wordmark enter/exit/re-enter, cleanup, reduced motion, and observer fallback.
- Modify `site/test/footer-wordmark-css.test.mjs`: lock the higher wordmark lift and tagline motion tokens.
- Create `site/test/animated-tagline.test.tsx`: prove exact lines, stagger indices, replay, and reduced-motion behavior.
- Modify `site/test/home.test.tsx`: prove the Korean homepage composes the exact three-line component.
- Modify `site/test/shell.test.tsx`: characterize the existing no-storage dark first paint while retaining stored paper.

---

### Task 1: Replay and lift the footer wordmark

**Files:**
- Create: `site/app/lib/use-replayable-reveal.ts`
- Modify: `site/app/components/footer-wordmark.tsx:1-51`
- Modify: `site/app/app.css:103-145`
- Test: `site/test/footer-wordmark.test.tsx:1-80`
- Test: `site/test/footer-wordmark-css.test.mjs:10-31`

**Interfaces:**
- Consumes: browser `matchMedia("(prefers-reduced-motion: reduce)")` and `IntersectionObserver`.
- Produces: `useReplayableReveal<T extends Element>(threshold?: number)` returning `{ elementRef, state }`, where `state` is exactly `"hidden" | "revealed"`.
- Produces: unchanged `FooterWordmark()` public component contract with repeatable `data-state` behavior.

- [ ] **Step 1: Rewrite the wordmark test to require replay instead of one-shot completion**

Replace the first test's terminal assertions with the full state cycle and cleanup assertions:

```tsx
const { container, unmount } = render(<FooterWordmark />)
const wordmark = container.querySelector("[data-footer-wordmark]")

expect(wordmark).toHaveAttribute("data-state", "hidden")
expect(observe).toHaveBeenCalledWith(wordmark)

act(() => {
  notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
})
expect(wordmark).toHaveAttribute("data-state", "revealed")
expect(disconnect).not.toHaveBeenCalled()

act(() => {
  notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
})
expect(wordmark).toHaveAttribute("data-state", "hidden")

act(() => {
  notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
})
expect(wordmark).toHaveAttribute("data-state", "revealed")

unmount()
expect(disconnect).toHaveBeenCalledOnce()
```

Rename the test to `replays four decorative letters whenever the wordmark re-enters`. Add `vi.unstubAllGlobals()` to the file's `afterEach` so the observer and media mocks cannot leak.

- [ ] **Step 2: Add a missing-observer fallback test**

Add this component contract to `footer-wordmark.test.tsx`:

```tsx
it("shows the final wordmark when IntersectionObserver is unavailable", () => {
  vi.stubGlobal("IntersectionObserver", undefined)
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))

  const { container } = render(<FooterWordmark />)

  expect(container.querySelector("[data-footer-wordmark]")).toHaveAttribute(
    "data-state",
    "revealed",
  )
})
```

- [ ] **Step 3: Update the CSS test to require the approved lift**

Change the wordmark lift assertion in `footer-wordmark-css.test.mjs`:

```js
assert.match(styles, /--wordmark-lift:\s*-\.1em/);
assert.doesNotMatch(styles, /--wordmark-lift:\s*-\.06em/);
```

- [ ] **Step 4: Run the targeted tests and verify the old implementation fails**

Run:

```bash
npm run test:vitest --prefix site -- test/footer-wordmark.test.tsx
node --test --test-name-pattern="footer wordmark" site/test/footer-wordmark-css.test.mjs
```

Expected: the component test fails because the observer disconnects after the first entry and never returns to `hidden`; the CSS test fails because the lift remains `-0.06em`.

- [ ] **Step 5: Create the shared repeatable reveal hook**

Create `site/app/lib/use-replayable-reveal.ts`:

```tsx
import { useEffect, useRef, useState } from "react"

export type RevealState = "hidden" | "revealed"

export function useReplayableReveal<T extends Element>(threshold = 0.2) {
  const elementRef = useRef<T>(null)
  const [state, setState] = useState<RevealState>("hidden")

  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const element = elementRef.current

    if (reduceMotion || typeof IntersectionObserver !== "function") {
      setState("revealed")
      return
    }
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setState(entry.isIntersecting ? "revealed" : "hidden")
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return { elementRef, state }
}
```

- [ ] **Step 6: Move the footer wordmark onto the hook**

Replace the local `useEffect`, `useRef`, and `useState` logic in `footer-wordmark.tsx` with:

```tsx
import { type CSSProperties } from "react"

import { useReplayableReveal } from "~/lib/use-replayable-reveal"

export function FooterWordmark() {
  const { elementRef, state } = useReplayableReveal<HTMLDivElement>()

  return (
    <div
      aria-hidden="true"
      className="footer-wordmark"
      data-footer-wordmark
      data-state={state}
      ref={elementRef}
    >
      {WORDMARK.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          style={{ "--letter-index": index } as CSSProperties}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Raise the final wordmark position**

Change the existing custom property in `site/app/app.css`:

```css
.footer-wordmark {
  --wordmark-lift: -.1em;
}
```

Do not change height, overflow, font-size, line-height, tracking, stagger, duration, easing, or mobile scale.

- [ ] **Step 8: Run the focused green gate**

Run:

```bash
npm run test:vitest --prefix site -- test/footer-wordmark.test.tsx
node --test --test-name-pattern="footer wordmark" site/test/footer-wordmark-css.test.mjs
npm run typecheck --prefix site
git diff --check -- site/app/lib/use-replayable-reveal.ts site/app/components/footer-wordmark.tsx site/app/app.css site/test/footer-wordmark.test.tsx site/test/footer-wordmark-css.test.mjs
```

Expected: all selected component, CSS, and type checks pass.

- [ ] **Step 9: Review, commit, and push the independently working footer fix**

```bash
git diff -- site/app/lib/use-replayable-reveal.ts site/app/components/footer-wordmark.tsx site/app/app.css site/test/footer-wordmark.test.tsx site/test/footer-wordmark-css.test.mjs
git add site/app/lib/use-replayable-reveal.ts site/app/components/footer-wordmark.tsx site/app/app.css site/test/footer-wordmark.test.tsx site/test/footer-wordmark-css.test.mjs
git diff --cached --check
git commit -m "fix(site): replay footer wordmark on re-entry"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Expected: push succeeds and parity is `0 0` before Task 2 begins.

---

### Task 2: Animate the exact localized tagline and lock the dark default

**Files:**
- Create: `site/app/components/animated-tagline.tsx`
- Modify: `site/app/components/home-page.tsx:1-28,213-219`
- Modify: `site/app/content/legacy-content.json:212`
- Modify: `site/app/app.css:103-145`
- Create: `site/test/animated-tagline.test.tsx`
- Modify: `site/test/home.test.tsx:15-49`
- Modify: `site/test/footer-wordmark-css.test.mjs:10-42`
- Modify: `site/test/shell.test.tsx:14-67`

**Interfaces:**
- Consumes: `useReplayableReveal<HTMLParagraphElement>()` from Task 1 and a newline-delimited localized `text: string` prop.
- Produces: `AnimatedTagline({ text }: { text: string })`, a semantic paragraph with `data-scroll-tagline`, `data-state`, and indexed block spans.
- Produces: exact Korean line array `['모든 대화를 명령 한 줄로.', 'kmsg는 별도 서버 없이', 'macOS 에서 직접 실행됩니다.']`.

- [ ] **Step 1: Add failing component tests for authored lines and replay**

Create `site/test/animated-tagline.test.tsx` with the same observer mock shape used by the wordmark test. Its main test must assert:

```tsx
const { container, unmount } = render(
  <AnimatedTagline
    text={"모든 대화를 명령 한 줄로.\nkmsg는 별도 서버 없이\nmacOS 에서 직접 실행됩니다."}
  />,
)
const tagline = container.querySelector("[data-scroll-tagline]")
const lines = tagline?.querySelectorAll("span") ?? []

expect(tagline).toHaveAttribute("data-state", "hidden")
expect(Array.from(lines, (line) => line.textContent)).toEqual([
  "모든 대화를 명령 한 줄로.",
  "kmsg는 별도 서버 없이",
  "macOS 에서 직접 실행됩니다.",
])
expect(lines[2]).toHaveStyle({ "--line-index": "2" })

act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
expect(tagline).toHaveAttribute("data-state", "revealed")
act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver))
expect(tagline).toHaveAttribute("data-state", "hidden")
act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
expect(tagline).toHaveAttribute("data-state", "revealed")

unmount()
expect(disconnect).toHaveBeenCalledOnce()
```

Add a second test with `matchMedia` returning `{ matches: true }`; assert immediate `revealed` state and that `IntersectionObserver` is not constructed. Its `afterEach` must call `cleanup()`, `vi.unstubAllGlobals()`, and `vi.restoreAllMocks()`.

- [ ] **Step 2: Add failing integration and CSS assertions**

In `home.test.tsx`, after rendering Korean, assert:

```tsx
const tagline = container.querySelector("[data-scroll-tagline]")
expect(Array.from(tagline?.querySelectorAll("span") ?? [], (line) => line.textContent)).toEqual([
  "모든 대화를 명령 한 줄로.",
  "kmsg는 별도 서버 없이",
  "macOS 에서 직접 실행됩니다.",
])
```

In `footer-wordmark-css.test.mjs`, add a new test requiring:

```js
assert.match(styles, /\.scroll-tagline span\s*\{[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(\.45em\)/s);
assert.match(styles, /\.scroll-tagline\[data-state="revealed"\] span\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateY\(0\)/s);
assert.match(styles, /transition-duration:\s*700ms/);
assert.match(styles, /transition-delay:\s*calc\(var\(--line-index\)\s*\*\s*85ms\)/);
assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.scroll-tagline\[data-state\] span\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;[^}]*transition:\s*none;/);
```

- [ ] **Step 3: Add the explicit first-visit dark-theme characterization**

Add this test before stored-paper restoration in `shell.test.tsx`:

```tsx
it("defaults to dark before paint when no theme is stored", () => {
  document.head.innerHTML = '<meta name="theme-color" content="#f7f5ed">'
  document.documentElement.className = ""
  document.documentElement.dataset.theme = "paper"
  localStorage.clear()

  window.eval(THEME_BOOTSTRAP)

  expect(document.documentElement).toHaveClass("dark")
  expect(document.documentElement).toHaveAttribute("data-theme", "dark")
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#131209",
  )
})
```

This is characterization of an already implemented requirement, so it is expected to pass before production theme code changes. Do not alter `site/app/lib/theme.ts` unless this test exposes a real regression.

- [ ] **Step 4: Run the new tests and confirm only the unimplemented tagline expectations fail**

Run:

```bash
npm run test:vitest --prefix site -- test/animated-tagline.test.tsx test/home.test.tsx test/shell.test.tsx
node --test --test-name-pattern="scroll tagline" site/test/footer-wordmark-css.test.mjs
```

Expected: the new tagline component import or selector and CSS checks fail; the no-storage dark characterization passes.

- [ ] **Step 5: Create the animated tagline component**

Create `site/app/components/animated-tagline.tsx`:

```tsx
import type { CSSProperties } from "react"

import { useReplayableReveal } from "~/lib/use-replayable-reveal"

export function AnimatedTagline({ text }: { text: string }) {
  const { elementRef, state } = useReplayableReveal<HTMLParagraphElement>()

  return (
    <p
      className="scroll-tagline mx-auto my-24 max-w-4xl text-center text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
      data-scroll-tagline
      data-state={state}
      ref={elementRef}
    >
      {text.split("\n").map((line, index) => (
        <span
          key={`${index}-${line}`}
          style={{ "--line-index": index } as CSSProperties}
        >
          {line}
        </span>
      ))}
    </p>
  )
}
```

- [ ] **Step 6: Wire the component and exact Korean content**

Import `AnimatedTagline` in `home-page.tsx` and replace the current static paragraph with:

```tsx
<AnimatedTagline text={copy.tagline} />
```

Change only the Korean `tagline` value in `legacy-content.json`:

```json
"tagline": "모든 대화를 명령 한 줄로.\nkmsg는 별도 서버 없이\nmacOS 에서 직접 실행됩니다."
```

- [ ] **Step 7: Add the staggered line CSS and reduced-motion final state**

Add before the footer wordmark rules in `site/app/app.css`:

```css
.scroll-tagline span {
  display: block;
  opacity: 0;
  transform: translateY(.45em);
  will-change: transform, opacity;
}

.scroll-tagline[data-state="revealed"] span {
  opacity: 1;
  transform: translateY(0);
  transition-property: transform, opacity;
  transition-duration: 700ms;
  transition-timing-function: cubic-bezier(.16, 1, .3, 1);
  transition-delay: calc(var(--line-index) * 85ms);
}
```

Extend the existing reduced-motion media query with:

```css
.scroll-tagline[data-state] span {
  opacity: 1;
  transform: none;
  transition: none;
}
```

- [ ] **Step 8: Run the complete automated gate**

Run:

```bash
npm test --prefix site
git diff --check
git status --short
```

Expected: the static build, React Router type generation, TypeScript, all Vitest suites, all Node tests, and whitespace checks pass. Only the known untracked `tasks/` path remains outside task changes.

- [ ] **Step 9: Review, commit, and push the complete page-text outcome**

```bash
git diff -- site/app/components/animated-tagline.tsx site/app/components/home-page.tsx site/app/content/legacy-content.json site/app/app.css site/test/animated-tagline.test.tsx site/test/home.test.tsx site/test/footer-wordmark-css.test.mjs site/test/shell.test.tsx
git add site/app/components/animated-tagline.tsx site/app/components/home-page.tsx site/app/content/legacy-content.json site/app/app.css site/test/animated-tagline.test.tsx site/test/home.test.tsx site/test/footer-wordmark-css.test.mjs site/test/shell.test.tsx
git diff --cached --check
git commit -m "feat(site): animate localized product tagline"
git push origin refs/heads/main:refs/heads/main
git rev-list --left-right --count HEAD...@{u}
```

Expected: push succeeds and parity is `0 0` before browser verification.

---

### Task 3: Prove the real scroll, responsive, theme, and publication chain

**Files:**
- Verify: `site/dist/index.html`
- Verify: generated hashed CSS and JavaScript beneath `site/dist/assets/`
- Verify: `https://channprj.github.io/kmsg/`
- Modify only if verification finds a requirement failure: the smallest owning source and its regression test from Tasks 1–2.

**Interfaces:**
- Consumes: built `data-scroll-tagline`, `data-footer-wordmark`, and `data-state` contracts.
- Produces: desktop/mobile browser evidence for two reveal cycles, exact line boxes, default dark, stored paper, reduced motion, geometry, overflow, and error-free runtime.

- [ ] **Step 1: Start the built site locally**

Run the existing build, then start the Vite preview server in a persistent terminal session:

```bash
npm run build --prefix site
npm exec --prefix site -- vite preview --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/kmsg/` with an isolated agent-browser session.

- [ ] **Step 2: Verify desktop first-visit theme and exact line geometry**

At 1440px width, clear `kmsg-theme`, reload, and evaluate:

```js
({
  theme: document.documentElement.dataset.theme,
  darkClass: document.documentElement.classList.contains("dark"),
  lines: Array.from(document.querySelectorAll("[data-scroll-tagline] span"), (node) => ({
    text: node.textContent,
    top: node.getBoundingClientRect().top,
  })),
  overflow: document.documentElement.scrollWidth - window.innerWidth,
})
```

Expected: `theme === "dark"`, `darkClass === true`, exact three texts in order, three increasing `top` values, and `overflow === 0`.

- [ ] **Step 3: Prove tagline and wordmark re-entry transitions**

For each selector, scroll the element into the viewport and wait for
`data-state="revealed"`; scroll far enough away to wait for
`data-state="hidden"`; scroll it back and wait for `revealed` again:

```text
[data-scroll-tagline]
[data-footer-wordmark]
```

Capture state snapshots or a short recording covering both reveal cycles. At
the footer, compare computed `--wordmark-lift` to `-.1em` and confirm the span
transform resolves above zero after the transition.

- [ ] **Step 4: Verify stored paper and reduced motion**

Set `localStorage['kmsg-theme']` to `paper`, reload, and confirm paper persists.
Open a second isolated browser context emulating reduced motion, scroll directly
to both selectors, and confirm every span has opacity `1`, no active transition,
and its final transform without waiting for stagger timing.

- [ ] **Step 5: Repeat layout and replay verification at 390px**

Set the viewport to 390px and confirm:

- exact three Korean line texts remain separate block spans;
- each region completes two visible entries;
- the wordmark stays inside the viewport width;
- `document.documentElement.scrollWidth === window.innerWidth`;
- no console errors and no page errors occur.

- [ ] **Step 6: Audit the final working tree and implementation history**

```bash
git diff --check
git status --short --branch
git log --oneline 3c983e9..HEAD
git rev-list --left-right --count HEAD...@{u}
git rev-parse HEAD
git rev-parse origin/main
git ls-remote --heads origin refs/heads/main
```

Expected: only the pre-existing untracked `tasks/` path remains, implementation history contains the verified checkpoints, parity is `0 0`, and local/tracking/live-remote SHAs match.

- [ ] **Step 7: Verify CI, Pages, and deployed production**

Use `gh run list --commit "$(git rev-parse HEAD)"` and wait for the Swift CI and
Pages workflows associated with the final implementation SHA. After both pass,
open `https://channprj.github.io/kmsg/`, repeat the default-dark, exact-copy,
desktop replay, and mobile overflow checks against production.

If a verification failure requires a source correction, add a regression test,
run the full site gate, commit the correction as a new truthful Conventional
Commit, push it immediately, and restart this task against the new SHA. Never
rewrite an already pushed checkpoint.
