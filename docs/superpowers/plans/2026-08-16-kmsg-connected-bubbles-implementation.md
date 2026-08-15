# kmsg Connected Bubbles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 Connected Bubbles 명세를 재현 가능한 SVG·PNG asset system으로 만들고 README와 project website의 모든 기존 로고 참조를 교체한다.

**Architecture:** `tools/brand/generate_brand_assets.py`가 master geometry와 Geist wordmark outline을 단일 source of truth로 관리하고, `rsvg-convert`로 release PNG와 Telegram review board를 생성한다. Node test는 SVG structure, PNG IHDR dimension, alpha contract, repository reference를 검증하며 site integration은 기존 build pipeline의 asset copy와 metadata contract를 갱신한다.

**Tech Stack:** Python 3, fontTools, Brotli, SVG 1.1, librsvg `rsvg-convert`, Node.js built-in test runner, React Router, Markdown

**Execution Mode:** Inline Execution. Logo geometry, asset generation, repository integration, and visual QA stay in this session so one design judgment controls the full loop. Implementation uses `superpowers:executing-plans` task-by-task.

---

## File map

### Create

- `tools/brand/generate_brand_assets.py` — master geometry, Geist glyph outline 추출, SVG source와 PNG·review board 생성
- `tools/brand/requirements.txt` — generator 전용 fontTools/Brotli dependency
- `assets/brand/README.md` — asset 용도, 재생성, 색상·크기 사용 규칙
- `assets/brand/source/kmsg-symbol-primary.svg`
- `assets/brand/source/kmsg-symbol-mono.svg`
- `assets/brand/source/kmsg-symbol-reverse.svg`
- `assets/brand/source/kmsg-symbol-small-ink.svg`
- `assets/brand/source/kmsg-signature-light.svg`
- `assets/brand/source/kmsg-signature-dark.svg`
- `assets/brand/source/kmsg-app-icon.svg`
- `assets/brand/source/kmsg-social-preview-1200x630.svg`
- `assets/brand/png/*.png` — spec의 필수 size와 signature/social output
- `assets/brand/review/kmsg-connected-bubbles-review-1280x1024.png`
- `assets/brand/review/kmsg-connected-bubbles-size-test-1280x1024.png`
- `site/test/brand-assets.test.mjs` — SVG, PNG, alpha, reference contract 검증

### Modify

- `README.md:6-9` — theme-aware signature
- `README.en.md:6-9` — theme-aware signature
- `site/app/components/site-header.tsx:44-50` — 32px app icon
- `site/app/routes/page.tsx:12-38` — 1200×630 PNG metadata
- `site/public/assets/favicon.svg` — small-size Connected Bubbles geometry
- `site/scripts/build-static.mjs:63-68,91-94,160-184` — 신규 brand asset copy, 404 icon, manifest icons
- `site/test/build.test.mjs:41-47,63-68,93-112` — build output contract

### Delete after reference migration

- `assets/kmsg-logo.jpg`

## Task 1: Define the failing brand asset contract

**Files:**
- Create: `site/test/brand-assets.test.mjs`
- Modify: `site/test/build.test.mjs`

- [ ] **Step 1: Add a PNG header reader and required asset list**

`site/test/brand-assets.test.mjs`는 Node built-ins만 사용한다.

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const repoDir = resolve(fileURLToPath(new URL("../..", import.meta.url)))
const asset = (...parts) => join(repoDir, "assets", "brand", ...parts)

function pngHeader(buffer) {
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  assert.equal(buffer.toString("ascii", 12, 16), "IHDR")
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer.readUInt8(25),
  }
}
```

- [ ] **Step 2: Assert SVG release contracts**

```js
const svgFiles = [
  "kmsg-symbol-primary.svg",
  "kmsg-symbol-mono.svg",
  "kmsg-symbol-reverse.svg",
  "kmsg-symbol-small-ink.svg",
  "kmsg-signature-light.svg",
  "kmsg-signature-dark.svg",
  "kmsg-app-icon.svg",
  "kmsg-social-preview-1200x630.svg",
]

test("brand SVG sources are self-contained vector assets", async () => {
  for (const name of svgFiles) {
    const svg = await readFile(asset("source", name), "utf8")
    assert.match(svg, /<svg\b/)
    assert.match(svg, /viewBox="[^"]+"/)
    assert.doesNotMatch(svg, /<text\b|<image\b|https?:\/\/|data:/)
  }
})
```

- [ ] **Step 3: Assert PNG dimensions and transparency**

Create a table for all required PNGs. `kmsg-symbol-*-1024.png` must report PNG color type 6 (RGBA); app icon and social preview may use color type 2 or 6. Assert exact dimensions for 1024, 512, 192, 64, 32, 16, 220-wide signature, 1200×630 social preview, and both 1280×1024 review boards.

- [ ] **Step 4: Update build output assertions before implementation**

Replace `assets/kmsg-logo.jpg` with:

```js
"assets/brand/png/kmsg-app-icon-32.png",
"assets/brand/png/kmsg-app-icon-192.png",
"assets/brand/png/kmsg-app-icon-512.png",
"assets/brand/png/kmsg-social-preview-1200x630.png",
```

Change the Open Graph assertion to `kmsg-social-preview-1200x630.png`. Parse `site.webmanifest` and assert icon sizes `192x192` and `512x512` with `image/png`.

- [ ] **Step 5: Run tests and verify RED**

Run:

```bash
cd site
node --test test/brand-assets.test.mjs test/build.test.mjs
```

Expected: FAIL with `ENOENT` for `assets/brand/source/kmsg-symbol-primary.svg` or missing new build assets.

- [ ] **Step 6: Commit the test contract**

```bash
git add site/test/brand-assets.test.mjs site/test/build.test.mjs
git commit -m "test(brand): define connected bubbles asset contract"
```

## Task 2: Build the deterministic master asset generator

**Files:**
- Create: `tools/brand/generate_brand_assets.py`
- Create: `tools/brand/requirements.txt`
- Create: `assets/brand/README.md`
- Create: all files under `assets/brand/source/`, `assets/brand/png/`, `assets/brand/review/`

- [ ] **Step 1: Declare generator dependencies**

`tools/brand/requirements.txt`:

```text
fonttools[woff]>=4.58,<5
brotli>=1.1,<2
```

- [ ] **Step 2: Implement master geometry constants**

The generator must use these constants verbatim:

```python
CANVAS = 1024
YELLOW = "#FEE500"
YELLOW_PAPER = "#F2D500"
INK = "#19170D"
PAPER = "#F7F7F2"
WHITE = "#FFFFFF"
DARK = "#11110F"
STROKE = 96
SMALL_STROKE = 104
LEFT_PATH = "M312 304H472C534 304 584 354 584 416V496C584 558 534 608 472 608H352L240 712L264 600C226 580 200 540 200 496V416C200 354 250 304 312 304Z"
RIGHT_PATH = "M552 416H712C750 416 786 436 806 468L872 392L824 500V608C824 670 774 720 712 720H552C490 720 440 670 440 608V528C440 466 490 416 552 416Z"
```

Use `fill="none"`, round cap/join, and two masks. The left mask removes a 136px-diameter crossing window centered at `(512, 592)`; the right mask removes a 136px-diameter crossing window centered at `(556, 424)`. Draw right then left so each loop is frontmost at one crossing.

- [ ] **Step 3: Convert Geist `kmsg` glyphs to paths**

Load `site/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2` with `fontTools.ttLib.TTFont`, instantiate `wght=700` with `fontTools.varLib.instancer.instantiateVariableFont`, draw `k`, `m`, `s`, `g` through `SVGPathPen`, apply `-0.055em` tracking, flip the font y-axis, and normalize the combined wordmark to 512px height. The generated signature SVG must contain only `<path>` elements; no `<text>` element or external font URL is allowed.

- [ ] **Step 4: Write source variants**

Generate:

- primary symbol: yellow stroke on transparent background
- mono symbol: ink stroke on transparent background
- reverse symbol: white stroke on transparent background
- small ink symbol: 104px stroke and 1.15× crossing gaps
- light signature: ink wordmark with ink symbol
- dark signature: paper wordmark with yellow symbol
- app icon: `x=32 y=32 width=960 height=960 rx=216` yellow background and ink symbol, scaled to remain inside 144px safe area
- social preview: 1200×630 dark background, yellow app icon, paper `kmsg` wordmark, concise `KakaoTalk CLI · MCP server for macOS` descriptor

- [ ] **Step 5: Render required PNGs**

Use `subprocess.run([...], check=True)` with `/opt/homebrew/bin/rsvg-convert` discovered through `shutil.which("rsvg-convert")`. Render exact dimensions from the spec. Render signature PNGs at 220px width while preserving the SVG aspect ratio.

- [ ] **Step 6: Generate review boards**

Build temporary SVG boards and render each at 1280×1024:

- `kmsg-connected-bubbles-review-1280x1024.png`: app icon, primary/mono/reverse, light/dark signature, theme examples, social preview thumbnail
- `kmsg-connected-bubbles-size-test-1280x1024.png`: 16/24/32/64/128px row at actual pixel size plus 8× nearest-neighbor enlargements and old/new 32px comparison

Board labels must be English ASCII to avoid external font dependencies. Use `font-family="Arial, sans-serif"` only in review-only temporary SVG; release SVGs remain path-only.

- [ ] **Step 7: Document regeneration and usage**

`assets/brand/README.md` must include:

```bash
python3 -m venv /tmp/kmsg-brand-venv
/tmp/kmsg-brand-venv/bin/pip install -r tools/brand/requirements.txt
/tmp/kmsg-brand-venv/bin/python tools/brand/generate_brand_assets.py
cd site && node --test test/brand-assets.test.mjs
```

Document dark/light signature selection, minimum 32px icon size, yellow text restriction on light surfaces, and the fact that kmsg is unaffiliated with Kakao Corp.

- [ ] **Step 8: Install generator dependencies and run it**

```bash
python3 -m venv /tmp/kmsg-brand-venv
/tmp/kmsg-brand-venv/bin/pip install -r tools/brand/requirements.txt
/tmp/kmsg-brand-venv/bin/python tools/brand/generate_brand_assets.py
```

Expected: script exits 0 and prints the number of SVG, PNG, and review files written.

- [ ] **Step 9: Run asset tests and verify GREEN**

```bash
cd site
node --test test/brand-assets.test.mjs
```

Expected: all brand asset tests pass.

- [ ] **Step 10: Commit generated assets and tooling**

Use explicit paths only:

```bash
git add tools/brand/generate_brand_assets.py tools/brand/requirements.txt assets/brand/README.md assets/brand/source assets/brand/png assets/brand/review
git commit -m "feat(brand): add connected bubbles identity assets"
```

## Task 3: Apply the identity to README and website surfaces

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `site/app/components/site-header.tsx`
- Modify: `site/app/routes/page.tsx`
- Modify: `site/public/assets/favicon.svg`
- Modify: `site/scripts/build-static.mjs`
- Modify: `site/test/build.test.mjs`
- Delete: `assets/kmsg-logo.jpg`

- [ ] **Step 1: Replace README image with theme-aware signatures**

Use GitHub's light/dark fragment convention with two explicit assets:

```html
<p>
  <img src="assets/brand/source/kmsg-signature-light.svg#gh-light-mode-only" alt="kmsg" width="220" />
  <img src="assets/brand/source/kmsg-signature-dark.svg#gh-dark-mode-only" alt="kmsg" width="220" />
</p>
```

Apply the same markup to Korean and English README files.

- [ ] **Step 2: Replace the header image**

In `site-header.tsx`, keep `alt=""`, `width="32"`, and `height="32"`, and change only the source to `/kmsg/assets/brand/png/kmsg-app-icon-32.png`. Retain `rounded-lg` only if the generated icon's corner radius does not create visible double rounding at 32px; otherwise remove the class after screenshot QA.

- [ ] **Step 3: Replace social metadata**

Use:

```ts
const image = "https://channprj.github.io/kmsg/assets/brand/png/kmsg-social-preview-1200x630.png"
```

Set `og:image:type` to `image/png`, dimensions to `1200` and `630`, and alt text to `kmsg — KakaoTalk CLI and MCP server for macOS`.

- [ ] **Step 4: Replace favicon geometry**

Use a 64×64 viewBox, yellow 64×64 rounded square with `rx=15`, and the small ink Connected Bubbles geometry scaled from the 1024 master. No text, image, filter, gradient, or external reference.

- [ ] **Step 5: Update static copy and manifest**

Copy `assets/brand` recursively into `site/dist/assets/brand`; keep `demo1.mp4` copy unchanged. Update 404 image to `/kmsg/assets/brand/png/kmsg-app-icon-64.png`. Manifest icons:

```js
[
  { src: "/kmsg/assets/brand/png/kmsg-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/kmsg/assets/brand/png/kmsg-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
]
```

- [ ] **Step 6: Delete the legacy JPEG and verify references**

```bash
git rm assets/kmsg-logo.jpg
```

Run:

```bash
git grep -n "kmsg-logo.jpg" -- . ':!docs/superpowers/specs/*'
```

Expected: no output.

- [ ] **Step 7: Run focused build tests**

```bash
cd site
npm run build
node --test test/brand-assets.test.mjs test/build.test.mjs
```

Expected: build exits 0 and all focused tests pass.

- [ ] **Step 8: Commit integration**

```bash
git add README.md README.en.md site/app/components/site-header.tsx site/app/routes/page.tsx site/public/assets/favicon.svg site/scripts/build-static.mjs site/test/build.test.mjs
git commit -m "feat(site): apply connected bubbles brand identity"
```

The staged deletion of `assets/kmsg-logo.jpg` must be included in this commit.

## Task 4: Run visual QA and correct the assets

**Files:**
- Modify if needed: `tools/brand/generate_brand_assets.py`
- Regenerate if needed: `assets/brand/source/`, `assets/brand/png/`, `assets/brand/review/`

- [ ] **Step 1: Inspect both final review PNGs**

Use `vision_analyze` on each 1280×1024 PNG. Verify:

- two speech bubbles and opposite tails are distinguishable
- both crossings read as an interlock, not accidental breaks
- 16/24/32px counters remain open
- app icon is optically centered
- primary, mono, reverse share the same silhouette
- wordmark is readable and not vertically misaligned
- review labels and cards are not clipped
- old/new 32px comparison uses actual-size pixels

- [ ] **Step 2: Inspect the 32px header in a real build**

Start the existing site preview only if required by the repository's normal workflow. Capture the header at 1280×1024, confirm no double-rounded artifact, and verify the image URL returns the generated PNG rather than a broken asset.

- [ ] **Step 3: Fix generator constants, regenerate, and re-run tests if QA fails**

Allowed corrections are stroke, mask center/radius, optical translation, wordmark scale, and card spacing. Do not introduce gradients, shadows, mascot elements, or a third color.

- [ ] **Step 4: Commit visual corrections only when files changed**

```bash
git add tools/brand/generate_brand_assets.py assets/brand/source assets/brand/png assets/brand/review

git commit -m "fix(brand): refine connected bubbles optical balance"
```

Skip this commit if visual QA requires no corrections.

## Task 5: Full verification and delivery

**Files:**
- No new files unless verification finds a defect

- [ ] **Step 1: Validate generated files programmatically**

```bash
cd site
node --test test/brand-assets.test.mjs
```

Expected: all brand asset tests pass.

- [ ] **Step 2: Run the full website suite**

```bash
cd site
npm test
```

Expected: build, typecheck, Vitest, and Node tests all pass. Node `22.20.0` may emit the existing `>=22.22.0` engine warning; any nonzero exit is failure.

- [ ] **Step 3: Verify the Swift package remains unaffected**

```bash
swift build
```

Expected: `Build complete!` and exit 0.

- [ ] **Step 4: Verify repository contracts**

```bash
git diff --check origin/main...HEAD
git grep -n "kmsg-logo.jpg" -- . ':!docs/superpowers/specs/*'
git status --short --branch
```

Expected: no diff whitespace errors, no runtime/document reference to the legacy JPEG, and a clean working tree.

- [ ] **Step 5: Deliver final review artifacts**

Send both files directly in Telegram:

- `assets/brand/review/kmsg-connected-bubbles-review-1280x1024.png`
- `assets/brand/review/kmsg-connected-bubbles-size-test-1280x1024.png`

Report exact test counts, commit list, branch name, and any remaining Node engine warning. Do not claim remote push unless `git push -u origin design/connected-bubbles` has actually succeeded.
