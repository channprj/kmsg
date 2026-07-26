# Korean-first developer site redesign

Status: Approved through the visual-companion review and subsequent user
directives on 2026-07-26.

## Context

The kmsg documentation site is generated from repository Markdown. Its current
root page is English, its visual language is an industrial terminal theme, and
the Korean project README lives in `README.ko.md`. The redesign makes Korean the
canonical project and website language, preserves an explicit English path, and
refines the full site into a precise developer-tool interface inspired by the
restraint of Vercel rather than copying any one product.

## Goals

- Make Korean the canonical GitHub README and the default language at `/`.
- Preserve English documentation at explicit, crawlable file and URL paths.
- Rename the Korean video section from `추천 영상` to `실사용 후기`.
- Keep both maximum-resolution YouTube thumbnails while displaying them at
  400px in repository READMEs.
- Apply one coherent visual system to the homepage and every documentation page.
- Center the entire website inside a real wrapper capped at 1280px.
- Keep dark mode as the default while retaining a polished light mode.
- Publish `llm.txt` and expose it as a visible UI action while preserving the
  existing `llms.txt` and `llms-full.txt` discovery files.
- Preserve existing SEO, AEO, accessibility, responsive behavior, and static
  GitHub Pages deployment.

## Canonical files and routes

| Purpose | Source | Public route | Canonical behavior |
| --- | --- | --- | --- |
| Korean project homepage | `README.md` | `/` | Primary and `x-default` |
| English project homepage | `README.en.md` | `/en/` | English alternate |
| Legacy Korean homepage | none | `/ko/` | Redirect to `/` |
| Usage | `USAGE.md` | `/usage/` | Existing route retained |
| Architecture | `ARCHITECTURE.md` | `/architecture/` | Existing route retained |
| OpenClaw and MCP | `docs/openclaw.md` | `/openclaw/` | Existing route retained |
| Versioning | `VERSIONING.md` | `/versioning/` | Existing route retained |

The migration uses Git-aware renames:

1. Rename the current English `README.md` to `README.en.md`.
2. Rename the current Korean `README.ko.md` to `README.md`.
3. Update every source link, generator input, test expectation, workflow path,
   and generated discovery reference that names either file.

GitHub will therefore display Korean by default without maintaining duplicate
Korean README files.

## Information and content design

The Korean homepage retains the current factual README content. Its visible
video heading becomes `실사용 후기`; its two videos retain their original
publisher names, target URLs, captions, and `maxresdefault.jpg` sources. The
English page keeps the heading `Featured video`.

README thumbnail links use explicit HTML images with `width="400"` so GitHub
renders them compactly without downloading a lower-resolution asset. The site
sanitizer permits the safe image `width` attribute, and the website presents the
same entries as compact story cards rather than full-width screenshots.

## Visual direction

The chosen direction is **Vercel Precision with a Balanced Split hero**:

- near-black graphite surfaces and porcelain light surfaces;
- Kakao yellow used as a sparse product-specific signal;
- crisp one-pixel borders, restrained shadows, and disciplined spacing;
- high-contrast sans-serif display type paired with a technical mono face;
- a left-side product statement and actions balanced by a right-side live
  terminal preview;
- structural grid lines and proof rows instead of decorative glassmorphism;
- subtle entrance and hover motion with a complete reduced-motion fallback.

The interface remains recognizably kmsg through its logo, Kakao yellow signal,
real command output, and Korean-first messaging. It must not reproduce Vercel,
Raycast, or Linear branding, artwork, or exact component styling.

## Wrapper and responsive layout

Every visible site surface sits inside one generated wrapper:

```html
<div class="site-shell">
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
</div>
```

`site-shell` has `width: min(100%, 1280px)` and centered auto margins. The body
may provide a viewport-wide background, but header, main content, and footer
cannot exceed the 1280px shell. Inner content uses responsive gutters rather
than a second viewport-based width that could escape the shell.

Desktop keeps the balanced two-column hero. Tablet stacks or narrows the
terminal without horizontal overflow. Mobile uses one column, a compact header,
full-width actions, readable command controls, and story cards that never exceed
the viewport. Both themes use the same dimensions and hierarchy.

## Components

### Header

The sticky header contains:

- kmsg identity;
- Usage, MCP, Architecture, and GitHub navigation;
- an `LLM.txt` action linking to `/llm.txt`;
- an `EN` or `한국어` locale switch on pages with an alternate;
- the existing dark/light theme control.

The mobile header preserves the brand, `LLM.txt`, language, and theme actions,
while lower-priority documentation links wrap or move into a compact secondary
row without adding a menu dependency.

### Homepage hero

The hero keeps the selected Balanced Split structure. The Korean message,
installation call to action, documentation link, copyable Homebrew command, and
terminal preview remain visible above the fold on common desktop displays.
Perspective and glow effects are reduced in favor of a flatter, sharper product
surface.

### Proof and documentation content

A restrained proof strip summarizes Swift 6, native MCP tools, structured JSON,
and local Accessibility automation. README-derived sections remain semantic
Markdown under the hero. Documentation pages use the same shell, header, type
system, borders, code controls, sticky table of contents, and footer.

### Real-world stories

The Korean `실사용 후기` section presents both videos as compact cards with a
thumbnail, publisher, title, and supporting description. Links remain normal
anchors so search engines and assistive technology can follow them without
JavaScript.

## LLM-readable resources

The generator emits:

- `/llm.txt` as the user-facing AI-readable site index;
- `/llms.txt` with the same current index content for ecosystem compatibility;
- `/llms-full.txt` as the full Markdown corpus.

The visible `LLM.txt` header action links to `/llm.txt`. HTML metadata can keep
an alternate link to the compatible machine-readable index. `robots.txt` does
not block any of these resources. Tests assert that the singular and plural
indexes contain the canonical Korean root, the English alternate, the primary
facts, and links to the full corpus.

## SEO and AEO

- `/` uses `lang="ko"`, a Korean canonical URL, `hreflang="ko"` pointing to
  `/`, `hreflang="en"` pointing to `/en/`, and `x-default` pointing to `/`.
- `/en/` uses the inverse canonical and the same bidirectional alternates.
- `/ko/` is a redirect-only compatibility route and is excluded from the
  sitemap and structured-data graph.
- Structured data describes the correct page language and source README.
- Sitemap, `llm.txt`, `llms.txt`, `llms-full.txt`, source alternate links, and
  internal navigation use the new canonical README and route names.
- Existing FAQ, SoftwareApplication, SoftwareSourceCode, WebSite, WebPage,
  BreadcrumbList, Open Graph, Twitter, and crawl directives remain intact.

## Build and data flow

1. The Node generator reads the renamed Markdown sources and project version.
2. Markdown is rendered and sanitized with the existing allowlist, extended
   only for the safe image width required by README content.
3. Shared header, shell, hero, documentation layout, structured data, and footer
   templates produce six content pages plus the legacy redirect.
4. Shared CSS and JavaScript provide responsive layout, theme persistence, copy
   controls, sticky navigation, active table-of-contents state, and restrained
   motion.
5. The Pages workflow runs the build tests and deploys `site/dist`.

A missing source file, malformed route definition, unsafe Markdown URL, or
invalid generated JSON-LD must fail the build or test suite rather than publish
partial output.

## Accessibility and interaction requirements

- Exactly one `h1` per content page.
- Keyboard-visible focus states for navigation, theme, copy, locale, video, and
  LLM actions.
- Semantic anchors for navigation and downloads; buttons only for actions.
- WCAG AA color contrast in both themes.
- Descriptive labels for theme and copy state in Korean and English.
- Captions retained for the demo video.
- No horizontal page overflow at 390px.
- `prefers-reduced-motion` disables transforms, reveal motion, and blinking
  decoration without hiding content.

## Verification

Automated checks must prove:

- the canonical README names and all expected output files;
- Korean at `/`, English at `/en/`, and the `/ko/` redirect;
- correct canonical and bidirectional hreflang metadata;
- `실사용 후기`, both 400px README images, and both maximum-resolution sources;
- `llm.txt`, `llms.txt`, `llms-full.txt`, robots, sitemap, and structured data;
- a rendered `.site-shell` around header, main, and footer;
- no rewritten `.md` links, unsafe URLs, duplicate `h1`, or omitted captions.

Browser verification covers desktop and 390px mobile in both themes, shell width
at viewports wider than 1280px, locale navigation, copy controls, `LLM.txt`,
video links, keyboard focus, reduced motion, and automated WCAG A/AA scanning.
After deployment, the same routes and critical metadata are fetched from the
production Pages URL before completion is claimed.

## Checkpoint strategy

1. Publish the 400px README thumbnail presentation independently.
2. Publish canonical Korean README names, locale routes, terminology, SEO/AEO
   mappings, and updated generator tests as one green behavior change.
3. Publish the 1280px shell, full visual system, story-card treatment,
   `llm.txt` endpoint, and visible LLM action with browser verification.
4. Run a final production deployment audit and create a corrective checkpoint
   only if verification exposes a real defect.

## Non-goals

- No framework migration or client-side router.
- No translation of the existing English-only long-form documentation pages.
- No analytics, account system, search backend, or new release/tag.
- No change to kmsg CLI, MCP, or Accessibility behavior.
