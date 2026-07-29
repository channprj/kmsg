# Cohesive KMSG Interface System Design

**Date:** 2026-07-29
**Status:** Approved through the user's autonomous-execution instruction

## Purpose

Refine the KMSG site into one coherent developer-product system. The work keeps
the existing black, off-white, and Kakao yellow identity while removing the
typographic, iconographic, and spatial inconsistencies that make the homepage
and documentation feel assembled from separate visual languages.

The user-visible outcomes are:

- make “more examples” search all three phrases in one result set:
  `"kmsg 카카오톡"`, `"kmsg 카톡"`, and `"kmsg 카카오"`;
- expose those three phrases visibly before the user opens Google;
- replace text-character icons with one consistent SVG icon language;
- reduce the number of arbitrary font sizes and establish a readable type
  scale;
- harmonize header controls, buttons, cards, code panels, section headings,
  metadata, and documentation typography;
- improve information density without sacrificing the restrained KMSG
  terminal aesthetic; and
- preserve localization, dark/paper themes, reduced motion, search metadata,
  and static GitHub Pages deployment.

## Reference Synthesis

The implementation uses the references as evidence, not as templates to copy.

### Firecrawl

Adopt:

- strict alignment to a visible grid;
- clear 60px-class hero typography;
- compact 14px controls with one repeated radius; and
- a deliberate product interaction placed inside the hero.

Do not adopt:

- a light-first visual identity;
- large amounts of decorative interface simulation; or
- Firecrawl's orange palette.

### Supabase

Adopt:

- consistent 14px navigation and button text;
- 16px body copy;
- repeated 12px card radii;
- a restrained bento rhythm; and
- one coherent family of outline icons.

Do not adopt:

- product-feature density that would overstate KMSG's smaller scope; or
- generic dashboard chrome.

### Fedify, LogTape, Optique, and Upyo

These sites share a documentation-oriented product language. Adopt:

- a 64px desktop header;
- 14px navigation;
- 16–20px outline icons;
- 54–67px hero headings;
- a two-column story-plus-working-code composition;
- clear runtime or capability evidence near the main claim; and
- code surfaces that share the same border, radius, label, and typography.

Do not adopt:

- their framework-specific navigation complexity;
- decorative mascots unrelated to KMSG; or
- their accent palettes.

## Design Direction

### KMSG Console System

The site remains an editorial terminal product rather than becoming a generic
SaaS landing page. Its memorable element is the pairing of Kakao yellow with a
real, readable command transcript. Every other visual decision supports that
pairing through consistent scale, density, and geometry.

The system uses:

- one shared shell for home and documentation;
- one typography scale;
- one SVG icon grammar;
- one surface grammar for cards and code;
- one spacing scale based on 4px increments; and
- one interaction grammar for hover, focus, pressed, and copied states.

## URL Routing Contract

The public MCP documentation URL is `/mcp/`, with localized equivalents at
`/en/mcp/`, `/jp/mcp/`, and `/cn/mcp/`.

Every generated:

- navigation link;
- Markdown link;
- canonical and alternate URL;
- structured-data URL;
- sitemap entry; and
- visible source or share action

uses `/mcp/`, never `/openclaw/`.

The old `/openclaw/` paths remain only as `noindex,follow` compatibility
redirects to the matching localized `/mcp/` path. They are not linked from the
rendered interface or included in discovery files. Source Markdown filenames
and references to the OpenClaw product may keep the word “OpenClaw”; the URL
contract concerns the public route.

## Story Search Contract

Use the following human-readable query:

```text
"kmsg 카카오톡" OR "kmsg 카톡" OR "kmsg 카카오"
```

Use this exact encoded URL:

```text
https://www.google.com/search?q=%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%ED%86%A1%22+OR+%22kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%22
```

The stories section ends with a search action panel rather than an isolated
text link. It contains:

- a 20px search icon;
- the localized “more examples” label;
- the three Korean query phrases as visible chips;
- a 20px external-link icon;
- `target="_blank"`; and
- `rel="noopener noreferrer"`.

The Korean search phrases remain unchanged on all locales because they are the
actual terms used to discover Korean KakaoTalk-related results. The surrounding
action label remains localized.

## Typography

Retain IBM Plex Sans, IBM Plex Sans KR, the locale fallbacks, IBM Plex Mono, and
JetBrains Mono. They fit the product's technical identity and already load
across the four locales.

Introduce semantic tokens:

| Token | Size | Use |
|---|---:|---|
| `--text-xs` | 12px | labels, metadata, table headers |
| `--text-sm` | 14px | navigation, buttons, secondary copy |
| `--text-md` | 16px | body copy |
| `--text-lg` | 18px | leads and emphasized copy |
| `--text-xl` | 24px | card titles and tertiary headings |
| `--heading-sm` | clamp(30px, 3vw, 40px) | section headings |
| `--heading-md` | clamp(44px, 5vw, 60px) | documentation hero |
| `--heading-lg` | clamp(52px, 5.8vw, 72px) | homepage hero |

Rules:

- no interface label, metadata, button, navigation, or prose text below 12px;
- navigation is 14px, never uppercase microtype;
- body text is 16px with a 1.65–1.75 line height;
- code text is at least 12px desktop and mobile;
- the homepage terminal transcript may use 11px only at the 320px breakpoint
  to preserve the previously verified three-command workflow without clipping;
- metadata uses 12px with restrained letter spacing;
- hero headings use consistent display weight and tighter leading; and
- Japanese and Chinese retain normal word breaking while Korean prose retains
  keep-all behavior.

## Iconography

Add a generator-side `renderIcon(name, className)` helper that emits inline SVG.
Every icon uses:

- `viewBox="0 0 24 24"`;
- `width` and `height` controlled through CSS;
- `fill="none"`;
- `stroke="currentColor"`;
- `stroke-width="1.75"`;
- `stroke-linecap="round"`; and
- `stroke-linejoin="round"`.

Required icons:

- `arrow-right`;
- `external-link`;
- `copy`;
- `check`;
- `chevron-down`;
- `plus`;
- `minus`;
- `search`; and
- `sun`; and
- `moon`.

Standard sizes:

- 16px for compact metadata;
- 18px for header controls and inline links;
- 20px for buttons, story actions, and FAQ controls.

Replace visible `↗`, `→`, `⌄`, `⧉`, and `+` UI glyphs. Terminal prompts,
traffic lights, textual `$`, code punctuation, and decorative CSS marks are not
UI icons and remain unchanged.

## Shared Geometry

### Header

- 64px desktop height;
- shared home/docs rendering and styling;
- 36px desktop language and theme controls;
- 44px mobile controls;
- 32px brand image with a 7px status dot;
- 14px navigation;
- 18px header icons; and
- a two-row mobile layout with horizontally scrollable navigation.

### Surfaces

Use:

- `--radius-sm: 8px`;
- `--radius-md: 12px`;
- `--radius-lg: 16px`;
- one subtle default border;
- one stronger hover/focus border;
- no arbitrary 9px, 10px, 14px, and 24px radius mixture; and
- shadows only for the primary terminal or raised install panel.

### Spacing

Use a 4px-derived scale:

```text
4, 8, 12, 16, 24, 32, 48, 64, 80, 96
```

Homepage sections use 80px desktop and 64px mobile vertical padding. Internal
card spacing uses 24px or 32px. Documentation uses 80px top/bottom content
padding rather than the current 104px/140px split.

## Homepage

### Hero and workflow

- retain the current localized headline and exact Korean line break;
- keep the centered install and Usage actions;
- keep the real `kmsg chats → kmsg read → kmsg send` replay;
- align the hero mark, copy, actions, and terminal to the shared grid;
- use the standard hero and body tokens; and
- retain the `#282c34` Ghostty terminal family.

### Principles, capabilities, and Skill

- section headings use the same label, title, and description geometry;
- labels become readable 12px text;
- principles become equal bordered surfaces rather than borderless fragments;
- capability copy and command panels share one row/card geometry;
- Skill cards use the same padding, radius, and title scale;
- numeric indexes remain textual data but use the metadata token; and
- all copy buttons use the shared SVG icon and copied state.

### Stories, FAQ, and install

- story cards retain equal 16:9 media;
- story cards, FAQ rows, and the install panel share borders and radii;
- the story search panel visibly exposes all three query phrases;
- FAQ uses SVG plus/minus icons while preserving native details/summary;
- install requirements use readable 12px chips; and
- footer text and links use the same 12px/14px metadata scale as the rest of
  the site.

## Documentation

- documentation hero uses `--heading-md`, capped at 60px;
- lead text uses 18px;
- document metadata uses 12px;
- TOC labels and links use 12px/13px;
- Markdown body copy uses 16px and 1.75 line height;
- the first paragraph uses 18px rather than an unrelated 19px size;
- `h2`, `h3`, and `h4` use the shared heading and card-title scale;
- tables use 14px cells and 12px headers;
- code blocks use the same terminal palette and shared copy icon;
- inline code never shrinks below 14px-equivalent body scale; and
- source, external, and heading links use the shared icon language.

## Themes and Accessibility

- dark remains the default;
- paper keeps equivalent hierarchy and contrast;
- visible focus rings remain 2px Kakao yellow with sufficient offset;
- controls remain at least 44px on touch viewports;
- SVG icons that repeat adjacent text are `aria-hidden="true"`;
- icon-only controls retain localized static accessible names;
- native details/summary keyboard behavior remains;
- reduced motion disables nonessential transitions and entrance motion; and
- no information depends on hover alone.

## Responsive Behavior

Validate at:

- 1440×1000;
- 1024×768;
- 768×1024;
- 390×844; and
- 320×800.

At every width:

- `documentElement.scrollWidth === documentElement.clientWidth`;
- all five navigation destinations remain reachable;
- hero actions remain centered;
- search query chips wrap within their panel;
- internal code/table scrolling does not create page overflow;
- icons retain their specified size; and
- no localized label collides with adjacent controls.

## Testing and Verification

### Static tests

Extend `site/test/build.test.mjs` to verify:

- the exact three-phrase encoded Google URL;
- the three visible query chips on all four home routes;
- secure new-tab attributes;
- an inline SVG icon for search and external navigation;
- no visible legacy UI glyphs in generated header/home/docs controls;
- the semantic type token declarations;
- no interface-label font-size declaration below 12px, with the named
  320px terminal transcript exception;
- standard icon classes and SVG stroke contract;
- shared radii and header geometry; and
- `/mcp/` as the only linked and indexed MCP route while `/openclaw/` remains
  redirect-only;
- the existing route, localization, SEO, FAQ, and discovery contracts.

### Browser verification

Use a production-like local server and isolated agent-browser session to inspect:

- home, Usage, MCP, Skill, and Architecture;
- dark and paper themes;
- all four locales;
- desktop, tablet, and mobile layouts;
- computed type and icon sizes;
- story search link/tab URL;
- copy feedback;
- FAQ keyboard behavior;
- console and page errors;
- axe violations; and
- full-page screenshots against the reference-derived design goals.

### Publication

For each green checkpoint:

- commit only explicit affected paths;
- push `refs/heads/main:refs/heads/main`;
- fetch and prove `HEAD...origin/main` is `0 0`;
- run the complete local gates before completion;
- wait for Swift CI and Pages success on the final site SHA; and
- re-run representative browser checks against production.

## Checkpoint Boundaries

1. `docs(site): define cohesive interface system`
2. `feat(site): expand story discovery queries`
3. `style(site): unify typography and iconography`
4. `style(site): harmonize home and docs surfaces`
5. corrective `fix(site)` commits only when browser QA reveals defects
