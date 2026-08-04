# Scroll-Scrub Product Tagline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the KMSG homepage tagline's line-entry transition with a reversible, word-by-word scroll scrub matching the approved `skills` reference behavior.

**Architecture:** Pure scroll geometry and word-opacity helpers live in a dependency-free module, while a focused React hook converts passive scroll/resize events into one requestAnimationFrame-coalesced progress value. `AnimatedTagline` preserves authored newline blocks, renders word spans inside them, and maps progress to inline opacity without changing layout or the existing footer observer.

**Tech Stack:** React 19, TypeScript 6, React Router 8 static build, Vitest/jsdom, Node test runner, CSS, agent-browser, GitHub Actions, GitHub Pages.

## Global Constraints

- Preserve the exact Korean copy and three authored lines:
  `모든 대화를 명령 한 줄로.\nkmsg는 별도 서버 없이\nmacOS 에서 직접 실행됩니다.`
- Start progress when the tagline top reaches `85vh`; finish when its bottom reaches `50vh`.
- Map each word's equal progress slice from opacity `0.22` to `1`, reversible in both scroll directions.
- Keep the existing footer wordmark reveal, `-.1em` lift, theme persistence, locale content, and all other homepage motion unchanged.
- Add no animation dependency, CSS scroll timeline, transform, transition duration, easing, delay, parallax, blur, scale, or decorative reference content.
- Reduced-motion and missing-animation-frame fallbacks must leave all words fully visible.
- Preserve exact three-line visual geometry and zero horizontal overflow at 320px, 390px, and 1440px.
- Leave the user-owned untracked `tasks/` directory untouched and stage only explicit task paths.
- Push `main` explicitly as `refs/heads/main:refs/heads/main`; never force-push.
- Run local Node 26 site tests with `NODE_OPTIONS=--no-experimental-webstorage`.

---

### Task 1: Implement the reversible word scrub as one green feature outcome

**Files:**
- Create: `site/app/lib/scroll-scrub.ts`
- Create: `site/app/lib/use-scroll-scrub-progress.ts`
- Create: `site/test/scroll-scrub.test.tsx`
- Modify: `site/app/components/animated-tagline.tsx`
- Modify: `site/app/app.css:103-127,165-170`
- Modify: `site/test/animated-tagline.test.tsx`
- Modify: `site/test/footer-wordmark-css.test.mjs:32-59`

**Interfaces:**
- Produces: `clampScrollProgress(value: number): number`
- Produces: `calculateElementScrollProgress(rect: Pick<DOMRectReadOnly, "top" | "height">, viewportHeight: number): number`
- Produces: `calculateWordOpacity(progress: number, index: number, count: number): number`
- Produces: `useScrollScrubProgress<T extends Element>(): { elementRef: RefObject<T | null>; progress: number }`
- Consumes: `AnimatedTagline({ text }: { text: string })` continues to receive the existing localized newline-delimited copy.

- [ ] **Step 1: Write failing scroll geometry and word-opacity tests**

Create `site/test/scroll-scrub.test.tsx` with pure helper coverage before the modules exist:

```tsx
// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"

import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  calculateElementScrollProgress,
  calculateWordOpacity,
  clampScrollProgress,
} from "~/lib/scroll-scrub"
import { useScrollScrubProgress } from "~/lib/use-scroll-scrub-progress"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("scroll scrub math", () => {
  it("maps start 0.85 to end 0.5 and clamps outside the range", () => {
    const viewportHeight = 1_000
    const height = 120

    expect(calculateElementScrollProgress({ top: 850, height }, viewportHeight)).toBe(0)
    expect(calculateElementScrollProgress({ top: 615, height }, viewportHeight)).toBeCloseTo(0.5)
    expect(calculateElementScrollProgress({ top: 380, height }, viewportHeight)).toBe(1)
    expect(calculateElementScrollProgress({ top: 1_000, height }, viewportHeight)).toBe(0)
    expect(calculateElementScrollProgress({ top: 100, height }, viewportHeight)).toBe(1)
  })

  it("fails open for invalid geometry", () => {
    expect(calculateElementScrollProgress({ top: Number.NaN, height: 120 }, 1_000)).toBe(1)
    expect(calculateElementScrollProgress({ top: 850, height: -1 }, 1_000)).toBe(1)
    expect(calculateElementScrollProgress({ top: 850, height: 120 }, 0)).toBe(1)
  })

  it("brightens equal word ranges from 0.22 to 1", () => {
    expect(clampScrollProgress(-1)).toBe(0)
    expect(clampScrollProgress(2)).toBe(1)
    expect(calculateWordOpacity(0, 0, 4)).toBe(0.22)
    expect(calculateWordOpacity(0.125, 0, 4)).toBeCloseTo(0.61)
    expect(calculateWordOpacity(0.25, 0, 4)).toBe(1)
    expect(calculateWordOpacity(0.25, 1, 4)).toBe(0.22)
    expect(calculateWordOpacity(1, 3, 4)).toBe(1)
  })
})
```

- [ ] **Step 2: Add failing hook lifecycle tests**

In the same test file, use a manual animation-frame queue so scroll direction,
coalescing, passive registration, and teardown are deterministic:

```tsx
function ProgressHarness() {
  const { elementRef, progress } = useScrollScrubProgress<HTMLDivElement>()
  return <div ref={elementRef} data-testid="target" data-progress={progress} />
}

it("updates in both directions through one queued frame", () => {
  let top = 850
  let nextFrame = 1
  const frames = new Map<number, FrameRequestCallback>()
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = nextFrame++
    frames.set(id, callback)
    return id
  })
  const flushFrames = () => {
    const pending = [...frames.values()]
    frames.clear()
    act(() => pending.forEach((callback) => callback(0)))
  }

  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
  vi.stubGlobal("requestAnimationFrame", requestFrame)
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)))
  vi.stubGlobal("innerHeight", 1_000)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ top, bottom: top + 120, height: 120 }) as DOMRect,
  )
  const addEvent = vi.spyOn(window, "addEventListener")

  render(<ProgressHarness />)
  flushFrames()
  expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "0")
  expect(addEvent).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true })

  top = 380
  window.dispatchEvent(new Event("scroll"))
  window.dispatchEvent(new Event("scroll"))
  expect(frames.size).toBe(1)
  flushFrames()
  expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "1")

  top = 850
  window.dispatchEvent(new Event("scroll"))
  flushFrames()
  expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "0")
})
```

Add the explicit fallback and teardown cases:

```tsx
it("stays fully visible for reduced motion", () => {
  const requestFrame = vi.fn()
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
  vi.stubGlobal("requestAnimationFrame", requestFrame)

  render(<ProgressHarness />)

  expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "1")
  expect(requestFrame).not.toHaveBeenCalled()
})

it("stays fully visible when animation frames are unavailable", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
  vi.stubGlobal("requestAnimationFrame", undefined)

  render(<ProgressHarness />)

  expect(screen.getByTestId("target")).toHaveAttribute("data-progress", "1")
})

it("cancels a pending frame and removes listeners on unmount", () => {
  const requestFrame = vi.fn(() => 17)
  const cancelFrame = vi.fn()
  const removeEvent = vi.spyOn(window, "removeEventListener")
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
  vi.stubGlobal("requestAnimationFrame", requestFrame)
  vi.stubGlobal("cancelAnimationFrame", cancelFrame)

  const { unmount } = render(<ProgressHarness />)
  unmount()

  expect(cancelFrame).toHaveBeenCalledWith(17)
  expect(removeEvent).toHaveBeenCalledWith("scroll", expect.any(Function))
  expect(removeEvent).toHaveBeenCalledWith("resize", expect.any(Function))
})
```

- [ ] **Step 3: Run the new test file and confirm the red state**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/scroll-scrub.test.tsx
```

Expected: FAIL because `~/lib/scroll-scrub` and
`~/lib/use-scroll-scrub-progress` do not exist.

- [ ] **Step 4: Write failing component and CSS contract tests**

Replace the observer-based cases in `site/test/animated-tagline.test.tsx` with a
hoisted progress stub:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const scrollState = vi.hoisted(() => ({ progress: 0 }))

vi.mock("~/lib/use-scroll-scrub-progress", () => ({
  useScrollScrubProgress: () => ({
    elementRef: { current: null },
    progress: scrollState.progress,
  }),
}))

beforeEach(() => {
  scrollState.progress = 0
})
```

Render `HomePage locale="ko"` and assert:

```tsx
const { container, rerender } = render(<HomePage locale="ko" />)
const tagline = container.querySelector("[data-scroll-tagline]")
const lines = [...(tagline?.querySelectorAll(".scroll-tagline__line") ?? [])]
const words = [...(tagline?.querySelectorAll(".scroll-tagline__word") ?? [])]

expect(lines.map((line) => line.textContent)).toEqual([
  "모든 대화를 명령 한 줄로.",
  "kmsg는 별도 서버 없이",
  "macOS 에서 직접 실행됩니다.",
])
expect(words.map((word) => word.textContent)).toEqual([
  "모든", "대화를", "명령", "한", "줄로.",
  "kmsg는", "별도", "서버", "없이",
  "macOS", "에서", "직접", "실행됩니다.",
])
expect(words.every((word) => word.getAttribute("style") === "opacity: 0.22;")).toBe(true)
expect(tagline).toHaveAttribute("data-scroll-progress", "0.0000")
expect(tagline).not.toHaveAttribute("data-state")

scrollState.progress = 0.5
rerender(<HomePage locale="ko" />)
const halfWords = [
  ...container.querySelectorAll<HTMLElement>(".scroll-tagline__word"),
]
expect(halfWords.slice(0, 6).map((word) => Number(word.style.opacity))).toEqual(
  [1, 1, 1, 1, 1, 1],
)
expect(Number(halfWords[6]?.style.opacity)).toBeCloseTo(0.61)
expect(
  halfWords.slice(7).every((word) => Number(word.style.opacity) === 0.22),
).toBe(true)

scrollState.progress = 0
rerender(<HomePage locale="ko" />)
expect(
  [...container.querySelectorAll<HTMLElement>(".scroll-tagline__word")].every(
    (word) => Number(word.style.opacity) === 0.22,
  ),
).toBe(true)
```

The final rerender proves values reverse rather than latching.

Update the scroll-tagline section in
`site/test/footer-wordmark-css.test.mjs` to require:

```js
assert.match(styles, /\.scroll-tagline__line\s*\{[^}]*display:\s*block;/s)
assert.match(
  styles,
  /\.scroll-tagline__word\s*\{[^}]*display:\s*inline-block;[^}]*will-change:\s*opacity;/s,
)
assert.doesNotMatch(styles, /\.scroll-tagline span\s*\{/)
assert.doesNotMatch(styles, /\.scroll-tagline\[data-state=/)
assert.doesNotMatch(
  styles,
  /\.scroll-tagline__word\s*\{[^}]*(?:transform|transition(?:-duration|-delay)?):/s,
)
assert.match(
  styles,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.scroll-tagline__word\s*\{[^}]*opacity:\s*1\s*!important;/,
)
```

- [ ] **Step 5: Run the component and CSS tests and confirm the red state**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/animated-tagline.test.tsx
node --test site/test/footer-wordmark-css.test.mjs
```

Expected: FAIL because the component still renders line spans with
`data-state`, and CSS still defines the old translate/stagger reveal.

- [ ] **Step 6: Implement the pure progress helpers**

Create `site/app/lib/scroll-scrub.ts`:

```ts
export const DIM_WORD_OPACITY = 0.22

export function clampScrollProgress(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function calculateElementScrollProgress(
  rect: Pick<DOMRectReadOnly, "top" | "height">,
  viewportHeight: number,
) {
  if (
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.height) ||
    rect.height < 0 ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0
  ) {
    return 1
  }

  const startTop = viewportHeight * 0.85
  const endTop = viewportHeight * 0.5 - rect.height
  const distance = startTop - endTop
  if (distance <= 0) return 1

  return clampScrollProgress((startTop - rect.top) / distance)
}

export function calculateWordOpacity(
  progress: number,
  index: number,
  count: number,
) {
  if (
    !Number.isFinite(progress) ||
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    count <= 0 ||
    index < 0 ||
    index >= count
  ) {
    return 1
  }

  const rangeStart = index / count
  const rangeEnd = (index + 1) / count
  const localProgress = clampScrollProgress(
    (progress - rangeStart) / (rangeEnd - rangeStart),
  )
  return DIM_WORD_OPACITY + (1 - DIM_WORD_OPACITY) * localProgress
}
```

- [ ] **Step 7: Implement the requestAnimationFrame-coalesced hook**

Create `site/app/lib/use-scroll-scrub-progress.ts`:

```ts
import { useEffect, useRef, useState } from "react"

import { calculateElementScrollProgress } from "~/lib/scroll-scrub"

export function useScrollScrubProgress<T extends Element>() {
  const elementRef = useRef<T>(null)
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    const element = elementRef.current
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (
      reduceMotion ||
      !element ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      setProgress(1)
      return
    }

    let frameId: number | null = null
    const measure = () => {
      frameId = null
      setProgress(
        calculateElementScrollProgress(
          element.getBoundingClientRect(),
          window.innerHeight,
        ),
      )
    }
    const scheduleMeasure = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(measure)
      }
    }

    window.addEventListener("scroll", scheduleMeasure, { passive: true })
    window.addEventListener("resize", scheduleMeasure)
    scheduleMeasure()

    return () => {
      window.removeEventListener("scroll", scheduleMeasure)
      window.removeEventListener("resize", scheduleMeasure)
      if (
        frameId !== null &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return { elementRef, progress }
}
```

- [ ] **Step 8: Render authored lines and globally indexed word spans**

Replace `AnimatedTagline` with:

```tsx
import { Fragment } from "react"

import { calculateWordOpacity } from "~/lib/scroll-scrub"
import { useScrollScrubProgress } from "~/lib/use-scroll-scrub-progress"

export function AnimatedTagline({ text }: { text: string }) {
  const { elementRef, progress } =
    useScrollScrubProgress<HTMLParagraphElement>()
  const lines = text.split("\n").map((line) => line.split(" "))
  const wordCount = lines.reduce((count, words) => count + words.length, 0)
  let wordIndex = 0

  return (
    <p
      className="scroll-tagline mx-auto my-24 max-w-4xl text-center font-semibold leading-tight tracking-tight"
      data-scroll-progress={progress.toFixed(4)}
      data-scroll-tagline
      ref={elementRef}
    >
      {lines.map((words, lineIndex) => (
        <span className="scroll-tagline__line" key={`${lineIndex}-${words.join(" ")}`}>
          {words.map((word, lineWordIndex) => {
            const currentWordIndex = wordIndex++
            return (
              <Fragment key={`${lineIndex}-${lineWordIndex}-${word}`}>
                <span
                  className="scroll-tagline__word"
                  style={{
                    opacity: calculateWordOpacity(
                      progress,
                      currentWordIndex,
                      wordCount,
                    ),
                  }}
                >
                  {word}
                </span>
                {lineWordIndex < words.length - 1 ? " " : null}
              </Fragment>
            )
          })}
        </span>
      ))}
    </p>
  )
}
```

- [ ] **Step 9: Replace the line-entry CSS with layout-neutral word styles**

Keep the `.scroll-tagline` font-size rules. Replace its old descendant and
`data-state` rules with:

```css
.scroll-tagline__line {
  display: block;
}

.scroll-tagline__word {
  display: inline-block;
  will-change: opacity;
}
```

Replace the tagline part of the reduced-motion media query with:

```css
.scroll-tagline__word {
  opacity: 1 !important;
}
```

Do not change any `.footer-wordmark` declaration.

- [ ] **Step 10: Run targeted tests and confirm the green state**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:vitest --prefix site -- test/scroll-scrub.test.tsx test/animated-tagline.test.tsx
node --test site/test/footer-wordmark-css.test.mjs
```

Expected: the new Vitest files and all three Node CSS tests pass.

- [ ] **Step 11: Run the complete site gate**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test --prefix site
git diff --check
```

Expected: 32 static pages build, TypeScript passes, all Vitest and Node tests
pass, and `git diff --check` prints no errors.

- [ ] **Step 12: Verify the local production build in a real browser**

Start the built site from `site/`:

```bash
npm exec -- vite preview --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/kmsg/` with an isolated agent-browser session.
At 1440×900, set `scroll-behavior: auto`, derive the tagline start and end
positions from its rectangle, and sample 0%, 25%, 50%, 75%, and 100% with:

```js
document.documentElement.style.scrollBehavior = "auto"
const tagline = document.querySelector("[data-scroll-tagline]")
const documentTop = tagline.getBoundingClientRect().top + scrollY
const height = tagline.getBoundingClientRect().height
const start = documentTop - innerHeight * 0.85
const end = documentTop + height - innerHeight * 0.5

async function sample(order) {
  const samples = []
  for (const requestedProgress of order) {
    scrollTo(0, start + (end - start) * requestedProgress)
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    const words = [...tagline.querySelectorAll(".scroll-tagline__word")]
    samples.push({
      requestedProgress,
      renderedProgress: Number(tagline.dataset.scrollProgress),
      opacities: words.map((word) => Number(getComputedStyle(word).opacity)),
      overflow: document.documentElement.scrollWidth - innerWidth,
    })
  }
  return samples
}

({
  down: await sample([0, 0.25, 0.5, 0.75, 1]),
  up: await sample([1, 0.75, 0.5, 0.25, 0]),
})
```

Expected: opacity advances monotonically through all 13 words, reaches all
ones at completion, reverses when sampled from 100% back to 0%, and overflow is
zero. Repeat at 390×844 and 320×844; all three `.scroll-tagline__line` boxes
must have one equal line height. Emulate reduced motion and confirm progress
`1` with every word opacity `1`. Check both empty-storage dark and stored
`paper`, then confirm `agent-browser errors` and `agent-browser console` are
empty.

- [ ] **Step 13: Review, explicitly stage, commit, and push the feature**

Before staging, fetch the live branch and require ahead/behind `0 0`:

```bash
git fetch origin refs/heads/main:refs/remotes/origin/main
git rev-list --left-right --count HEAD...refs/remotes/origin/main
git status --short
git diff --check
git diff -- site/app/lib/scroll-scrub.ts site/app/lib/use-scroll-scrub-progress.ts site/app/components/animated-tagline.tsx site/app/app.css site/test/scroll-scrub.test.tsx site/test/animated-tagline.test.tsx site/test/footer-wordmark-css.test.mjs
```

Stage only the feature paths and commit:

```bash
git add site/app/lib/scroll-scrub.ts site/app/lib/use-scroll-scrub-progress.ts site/app/components/animated-tagline.tsx site/app/app.css site/test/scroll-scrub.test.tsx site/test/animated-tagline.test.tsx site/test/footer-wordmark-css.test.mjs
git diff --cached --check
git commit -m "feat(site): scrub tagline words with scroll"
git push origin refs/heads/main:refs/heads/main
```

Fetch again and require local, tracking, and live remote SHA equality plus
ahead/behind `0 0` before continuing.

---

### Task 2: Verify CI, Pages, and the deployed interaction

**Files:**
- Verify only: `.github/workflows/ci.yml`
- Verify only: `.github/workflows/pages.yml`
- Verify only: deployed `https://channprj.github.io/kmsg/`
- Modify only if a regression is reproduced by a new failing test: the exact Task 1 source/test path responsible for that regression.

**Interfaces:**
- Consumes: final feature commit SHA from Task 1.
- Produces: successful `ci` and `pages` workflow URLs, production browser evidence, and Git parity `0 0`.

- [ ] **Step 1: Wait for the exact-SHA workflows**

Run:

```bash
gh run list --commit "$(git rev-parse HEAD)" --limit 20 --json databaseId,workflowName,status,conclusion,headSha,url
for run_id in $(gh run list --commit "$(git rev-parse HEAD)" --limit 20 --json databaseId,workflowName --jq '.[] | select(.workflowName == "ci" or .workflowName == "pages") | .databaseId'); do
  gh run watch "$run_id" --exit-status
done
```

Expected: the list contains exactly the `ci` and `pages` runs for the current
SHA, and both watches complete with conclusion `success`. Do not substitute a
run from another SHA.

- [ ] **Step 2: Repeat the browser contract against GitHub Pages**

Open `https://channprj.github.io/kmsg/` in a fresh browser session and repeat
Task 1 Step 12 at 1440px, 390px, and 320px. Capture screenshots at 50% progress
and completion. Expected: exact three Korean lines, 13 ordered word spans,
bidirectional opacity scrub, all-visible reduced motion, default dark, stored
paper preservation, zero horizontal overflow, and no console/page errors.

Run an Axe WCAG A/AA audit at completion. Record `violations` and `incomplete`
separately; do not report incomplete color-contrast analysis as a violation.

- [ ] **Step 3: Create a corrective checkpoint only if production evidence fails**

If any production assertion fails, first reproduce it locally and add one
failing regression assertion to the responsible Task 1 test file. Run that
test to confirm red, apply the smallest source correction, rerun targeted and
full gates, then explicitly stage those exact paths and publish:

```bash
git add site/app/lib/scroll-scrub.ts site/app/lib/use-scroll-scrub-progress.ts site/app/components/animated-tagline.tsx site/app/app.css site/test/scroll-scrub.test.tsx site/test/animated-tagline.test.tsx site/test/footer-wordmark-css.test.mjs
git diff --cached --check
git commit -m "fix(site): stabilize tagline scroll scrub"
git push origin refs/heads/main:refs/heads/main
```

Repeat Tasks 2.1 and 2.2 for the new SHA. Do not amend or force-push the
published feature commit.

- [ ] **Step 4: Run the completion audit**

Run fresh:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test --prefix site
git diff --exit-code
git diff --cached --exit-code
git status --short
git rev-list --left-right --count HEAD...refs/remotes/origin/main
git rev-parse HEAD
git rev-parse refs/remotes/origin/main
git ls-remote --heads origin refs/heads/main
git log --oneline db612dd..HEAD
```

Expected: all tests pass, no tracked or staged diff exists, only the pre-existing
`?? tasks/` remains, local/tracking/live remote SHAs match, and ahead/behind is
`0 0`.
