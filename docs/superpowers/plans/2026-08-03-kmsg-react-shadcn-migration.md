# KMSG React and Shadcn Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generated static interface with a prerendered React Router, Tailwind CSS v4, and real Shadcn/Radix implementation while preserving every KMSG route, localized content contract, static artifact, interaction, and GitHub Pages deployment behavior.

**Architecture:** React Router Framework Mode owns the document and route modules with `ssr: false` and an explicit 32-route prerender list. Typed locale and route records drive route matching, links, metadata, language switching, sitemap output, and artifact verification. Shadcn CLI-owned components live under `site/app/components/ui`; KMSG components compose them without duplicating primitive behavior. A post-build script copies the client output to `site/dist` and generates compatibility/discovery artifacts.

**Tech Stack:** Node.js 22.22+, React 19, TypeScript 6, React Router 8.3, Vite 8, Tailwind CSS 4, Shadcn `nova` style with Radix primitives, Lucide icons, `marked`, `sanitize-html`, Vitest, Testing Library, Playwright, axe-core, GitHub Pages. React Router 8.3 is the first patched release for the RSC CSRF advisory published during implementation; KMSG does not use RSC, but the build stays on the patched line.

## Global constraints

- Execute inline in the main thread because repository instructions prohibit subagent dispatch.
- Preserve the unrelated untracked `tasks/` directory and never stage it.
- Preserve all existing user-facing copy, KMSG claims, commands, terminal data, videos, imagery, legal text, and Markdown sources exactly unless React syntax requires escaping.
- Preserve `#fee500` dark primary, `#f2d500` paper primary, and terminal `#282c34`.
- Keep Korean at `/`, with English `/en/`, Japanese `/jp/`, and Chinese `/cn/`; keep the eight canonical page keys and all legacy redirects.
- Keep complete static HTML, metadata, structured data, discovery files, manifest, 404, `.nojekyll`, and `site/dist` as the Pages artifact.
- Use actual Shadcn-generated component source. Do not retain or add static `data-slot` imitations.
- Keep browser-only APIs out of render paths. Initialize storage, DOM, media-query, clipboard, observer, and timer behavior from effects or stable inline bootstrap code.
- Stage explicit paths only; never use `git add .` or `git add -A`.
- Push with `git push origin refs/heads/main:refs/heads/main` because a `main` tag also exists.
- After every push, require `git rev-list --left-right --count HEAD...@{u}` to print `0 0`.
- Run `git diff --check` before every checkpoint.

## Target file map

- Create `site/components.json`, `site/react-router.config.ts`, `site/vite.config.ts`, and TypeScript configs.
- Replace `site/package.json` and `site/package-lock.json` scripts/dependencies for React Router, Tailwind, Shadcn, Vitest, and Playwright.
- Create `site/app/root.tsx`, `site/app/routes.ts`, route modules, typed content modules, browser components, and Shadcn UI source.
- Create `site/app/app.css` with Tailwind v4, Shadcn semantic tokens, KMSG themes, terminal styles, documentation styles, responsive rules, and footer reveal.
- Create `site/scripts/build-static.mjs` and `site/scripts/verify-dist.mjs`.
- Create unit/component tests under `site/test/` and browser tests under `site/e2e/`.
- Remove `site/build.mjs`, `site/src/app.js`, and `site/src/styles.css` only after the replacement artifact verifier passes.
- Preserve static media by moving or copying source-controlled site media into `site/public/`.

---

### Task 1: Establish the React Router, Tailwind, and Shadcn foundation

**Files:**
- Modify: `site/package.json`, `site/package-lock.json`
- Create: `site/components.json`, `site/react-router.config.ts`, `site/vite.config.ts`, `site/tsconfig.json`, `site/tsconfig.node.json`
- Create: `site/app/root.tsx`, `site/app/routes.ts`, `site/app/routes/home.tsx`, `site/app/app.css`, `site/app/lib/utils.ts`
- Create: `site/test/setup.ts`, `site/test/foundation.test.tsx`

**Interfaces:**
- `react-router.config.ts` exports `ssr: false` and `prerender: getPrerenderPaths`.
- `site/app/root.tsx` exports `Layout`, default `App`, and `ErrorBoundary`.
- `site/app/lib/utils.ts` exports `cn(...inputs: ClassValue[]): string`.
- `npm run build --prefix site` leaves the final publish tree under `site/dist`.

- [ ] Add a failing foundation test that imports `Button`, renders `data-slot="button"`, and checks the root document uses the KMSG stylesheet and `lang` contract.
- [ ] Replace the package manifest with exact React Router/Shadcn scaffold dependencies plus pinned `marked`, `sanitize-html`, and Geist dependencies. Add `typecheck`, `test:unit`, `test:e2e`, `build:router`, `build`, `verify`, and aggregate `test` scripts.
- [ ] Run `npm install --prefix site` and retain the resulting lockfile.
- [ ] Initialize Shadcn with React Router, Tailwind v4, Radix base, Nova style, Lucide icons, and `~/` aliases. Add `button`, `dropdown-menu`, `sheet`, `card`, `badge`, `accordion`, `separator`, and `tooltip` through the Shadcn CLI.
- [ ] Configure Vite base `/kmsg/`, React Router plugin, Tailwind plugin, `~/` alias, and Vitest JSDOM setup.
- [ ] Implement the smallest root/route shell and semantic KMSG CSS tokens needed for the foundation test.
- [ ] Run `npm run typecheck --prefix site`, `npm run test:unit --prefix site`, and `npm run build:router --prefix site`; expect all to pass.
- [ ] Commit `feat(site): establish React Shadcn foundation`, push the explicit branch ref, and verify parity `0 0`.

### Task 2: Define typed locale, route, and content contracts

**Files:**
- Create: `site/app/content/locales.ts`, `site/app/content/routes.ts`, `site/app/content/home.ts`, `site/app/content/legal.ts`, `site/app/content/faq.ts`
- Create: `site/app/lib/locale.ts`, `site/app/lib/metadata.ts`
- Create: `site/test/routes.test.ts`, `site/test/metadata.test.ts`
- Read as source: `site/build.mjs`, `README.md`, `README.en.md`, `USAGE.md`, `ARCHITECTURE.md`, `VERSIONING.md`, `docs/openclaw.md`

**Interfaces:**
- `type LocaleId = "ko" | "en" | "jp" | "cn"`.
- `type PageKey = "home" | "usage" | "architecture" | "mcp" | "skill" | "versioning" | "privacy" | "terms"`.
- `routeFor(locale, pageKey): string` returns a trailing-slash public pathname.
- `routeFromPath(pathname): { locale: LocaleId; pageKey: PageKey } | null` round-trips every canonical path.
- `localeTargets(pageKey): Record<LocaleId, string>` supplies the language menu and hreflang values.
- `metadataFor(locale, pageKey)` returns localized title, description, canonical URL, alternates, and home structured data.

- [ ] Write failing tests for the 32 unique paths, parse/format round trips, same-page language targets, invalid values, canonical URLs, hreflang parity, Open Graph locales, and FAQ schema parity.
- [ ] Extract all localized UI/product/legal/FAQ records from the legacy generator without copy edits. Rename only the internal `openclaw` page key to canonical `mcp`.
- [ ] Implement route and locale pure functions with exhaustive typed records and fail-fast invariant checks.
- [ ] Implement metadata from the same content and route records used by visible pages.
- [ ] Run targeted unit tests and typecheck; expect green.
- [ ] Commit `feat(site): model localized route content`, push, and verify `0 0`.

### Task 3: Build the shared shell with real Shadcn controls

**Files:**
- Create: `site/app/components/site-header.tsx`, `site/app/components/language-menu.tsx`, `site/app/components/theme-toggle.tsx`, `site/app/components/mobile-navigation.tsx`, `site/app/components/site-footer.tsx`
- Modify: `site/app/root.tsx`, `site/app/app.css`
- Create: `site/test/language-menu.test.tsx`, `site/test/theme-toggle.test.tsx`, `site/test/shell.test.tsx`

**Interfaces:**
- `LanguageMenuProps = { locale: LocaleId; pageKey: PageKey; targets: Record<LocaleId, string> }`.
- Language selection stores `kmsg-locale` and assigns the selected same-page URL.
- `ThemeToggle` uses storage key `kmsg-theme`, root `.dark`, `data-theme`, and theme-color metadata.
- `MobileNavigation` composes `Sheet`, `SheetTitle`, and semantic anchors.

- [ ] Add failing component tests for trigger accessible name, current radio item, group composition, keyboard opening, locale storage/navigation intent, storage failure, no native `<select>`, Sheet title, theme labels, and focus-visible controls.
- [ ] Implement `LanguageMenu` with Shadcn `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuRadioGroup`, and four `DropdownMenuRadioItem` elements.
- [ ] Use a Shadcn outline small `Button` trigger with Globe and ChevronDown icons. Add a direct-link `<noscript>` language fallback.
- [ ] Implement a pre-hydration theme bootstrap and a Shadcn icon `Button`/`Tooltip` theme toggle without hydration mismatches.
- [ ] Implement desktop navigation and mobile `Sheet`; keep the language menu in the compact header and give every mobile action at least 44px hit area.
- [ ] Run component tests and typecheck; expect green.
- [ ] Commit `feat(site): add Shadcn navigation controls`, push, and verify `0 0`.

### Task 4: Migrate the localized home experience and interactions

**Files:**
- Create: `site/app/components/copy-button.tsx`, `site/app/components/terminal-replay.tsx`, `site/app/components/footer-wordmark.tsx`
- Create: `site/app/routes/home.tsx`
- Modify: `site/app/app.css`
- Create: `site/test/home.test.tsx`, `site/test/copy-button.test.tsx`, `site/test/footer-wordmark.test.tsx`, `site/test/terminal-replay.test.tsx`

**Interfaces:**
- `CopyButton` accepts text and localized idle/copied/failed labels and restores idle after 1.6s.
- `TerminalReplay` owns an `AbortController`, timers, visibility/viewport pause state, and reduced-motion final state.
- `FooterWordmark` renders one span per Unicode code point, `aria-hidden="true"`, with CSS variable `--letter-index`.

- [ ] Add failing tests for full localized content, exact `kmsg chats → kmsg read → kmsg send` sequence, Card composition, six FAQ items, copy success/fallback/failure, timer cleanup, terminal cancellation, and footer reveal/crop contracts.
- [ ] Compose hero actions with `Button`/`buttonVariants`, principles and agent/stories/install surfaces with complete `Card` parts, proof points with `Badge`, boundaries with `Separator`, and FAQs with one-open collapsible `Accordion` items.
- [ ] Port the existing Unicode-safe terminal replay, complete static transcript, cancellation, visibility pause, internal scroll, reset, and reduced-motion behavior.
- [ ] Implement the reference-inspired decorative footer wordmark: `.72em` overflow-hidden line box, `line-height: .84`, `translateY(.42em)`/opacity entrance, 55ms per-letter stagger, 800ms duration, `cubic-bezier(.16,1,.3,1)`, one IntersectionObserver at 20%, and immediate reduced-motion final state.
- [ ] Keep the wordmark final lower crop visible at all sizes; use `clamp(5rem,12vw,11rem)` on desktop and prevent overflow at 320px.
- [ ] Run targeted component tests, typecheck, and the React build; expect green.
- [ ] Commit `feat(site): migrate localized product home`, push, and verify `0 0`.

### Task 5: Migrate documentation and legal routes

**Files:**
- Create: `site/app/lib/markdown.server.ts`, `site/app/components/markdown-article.tsx`
- Create: `site/app/routes/document.tsx`, `site/app/routes/legal.tsx`
- Modify: `site/app/routes.ts`, `site/app/root.tsx`, `site/app/app.css`
- Create: `site/test/markdown.test.ts`, `site/test/routes-render.test.tsx`

**Interfaces:**
- `renderMarkdown(sourcePath)` returns sanitized HTML plus a deterministic heading outline.
- Route modules derive `{ locale, pageKey }` from the central route table and reject unknown combinations.
- Wide tables render inside a focusable, labelled `role="region"` scroller.

- [ ] Add failing tests for authoritative Markdown loading, sanitization allowlist, heading IDs, code-copy controls, all localized document/legal routes, and missing-source failure.
- [ ] Implement build-time Markdown parsing with `marked` and `sanitize-html`; never duplicate source Markdown into JSX.
- [ ] Implement shared document and legal layouts using Shadcn navigation/actions and preserved localized legal text.
- [ ] Add accessible table/code overflow treatment, locale-aware CJK wrapping, and responsive side navigation.
- [ ] Run unit tests, typecheck, and React build; expect green.
- [ ] Commit `feat(site): migrate documentation routes`, push, and verify `0 0`.

### Task 6: Restore static artifact and compatibility parity

**Files:**
- Create: `site/scripts/build-static.mjs`, `site/scripts/verify-dist.mjs`
- Create or move: `site/public/favicon.svg`, `site/public/kmsg-workspace.webp`, `site/public/demo-captions.vtt`, product logo/video assets
- Modify: `site/react-router.config.ts`, `site/package.json`, `site/test/build.test.mjs`
- Remove after parity: `site/build.mjs`, `site/src/app.js`, `site/src/styles.css`, obsolete `site/src/` directory

**Interfaces:**
- `getPrerenderPaths(): string[]` returns exactly the 32 canonical public paths.
- `npm run build --prefix site` produces `site/dist` only from React Router output and post-build resources.
- `verify-dist.mjs` exits nonzero on any missing route, locale, canonical, alternate, structured data, asset, redirect, discovery file, or native language `<select>`.

- [ ] Replace legacy artifact assertions with framework-agnostic tests for all 32 canonical documents, asset base `/kmsg/`, full localized content, metadata, language dropdown markers, terminal commands, FAQ count, and install command.
- [ ] Add failing tests for `/ko/*`, `/openclaw/*`, localized legacy redirects, 404 recovery, robots, sitemap, manifest, LLM files, `.nojekyll`, and absence of development origins/native language selects.
- [ ] Configure explicit prerender paths and implement the post-build resource/redirect/discovery generator from central route data.
- [ ] Normalize client output into `site/dist`, copy source-controlled media and Geist assets, then run the strict verifier.
- [ ] Run `npm test --prefix site`; only after it passes, delete the legacy generator and legacy CSS/JS.
- [ ] Re-run `npm ci --prefix site`, `npm test --prefix site`, and `git diff --check` from the clean dependency state.
- [ ] Commit `refactor(site): complete React static migration`, push, and verify `0 0`.

### Task 7: Prove browser, accessibility, responsive, and motion behavior

**Files:**
- Create: `site/playwright.config.ts`, `site/e2e/site.spec.ts`
- Modify as failures require: `site/app/**`, `site/test/**`, `site/scripts/**`

**Interfaces:**
- Playwright web server uses the production static output at base `/kmsg/`.
- Tests collect console errors, page errors, failed local requests, overflow measurements, and axe results.

- [ ] Add browser tests for KO/EN/JP/CN language switching on home and documentation routes, persistence, same-page preservation, reload, keyboard-only menu use, focus return, mobile Sheet, FAQ, copy, theme, and navigation.
- [ ] Add terminal play/pause/reset/reduced-motion assertions and footer entrance/final crop/reduced-motion assertions.
- [ ] Verify 1440, 1024, 768, 390, 375, and 320 CSS-pixel widths; both themes; no page overflow; dropdown kept in viewport; 44px mobile targets.
- [ ] Run axe on representative home and document pages. Fail on violations; report `incomplete` separately.
- [ ] Capture desktop and 390px screenshots for both themes and visually inspect the footer crop, header/menu, cards, terminal, docs, and CJK wrapping.
- [ ] Fix every regression in scope, then run unit, type, build, artifact, and browser suites again.
- [ ] Commit `test(site): verify React migration in browser`, push, and verify `0 0`.

### Task 8: Verify CI, production Pages, and final repository parity

**Files:**
- Modify only if needed: `.github/workflows/pages.yml`, site sources/tests found by live verification

- [ ] Inspect the Pages workflow for the final pushed SHA and wait for build/deploy success.
- [ ] Open the live Korean home plus representative EN/JP/CN and document routes; verify HTTP success, current commit assets, language dropdown, theme, mobile Sheet, terminal, footer reveal/crop, and no console/network errors.
- [ ] If production differs from local, add a focused failing regression test, fix, run full verification, commit/push a Conventional Commit checkpoint, and repeat CI/live checks.
- [ ] Run `git status --short --branch`, `git rev-list --left-right --count HEAD...@{u}`, compare `HEAD`, `@{u}`, and `refs/remotes/origin/main`, and confirm only the pre-existing `tasks/` remains untracked.
- [ ] Record final commit hashes, test/build/browser evidence, deployment URL, and any environment-only limitation in the handoff.

## Completion gate

Do not report completion until the repository contains actual Shadcn component source, the native locale select and static imitations are absent, all 32 canonical documents and compatibility artifacts pass strict verification, the clipped staggered `kmsg` animation is visibly confirmed, production Pages serves the final SHA, and local/upstream/remote parity is `0 0`.
