# KMSG smooth install navigation

Status: Approved by the user on 2026-08-04.

## Context

The homepage hero exposes a localized installation action as a semantic anchor
with `href="#install"`. Its target is the existing installation section near
the end of the page. The browser currently jumps to that section immediately,
which feels abrupt relative to the site's restrained motion system.

## Goal

Make the hero installation action scroll smoothly to the existing installation
section while preserving the anchor link, URL hash, keyboard behavior, static
output, and reduced-motion accessibility.

## Success criteria

- Activating the hero installation link scrolls smoothly to `#install`.
- The installation section stops below the fixed site header with about `6rem`
  of top clearance.
- The original `href="#install"` and target `id="install"` remain intact.
- Keyboard activation and opening or copying the anchor URL continue to use
  native browser behavior.
- `prefers-reduced-motion: reduce` changes the movement to an immediate jump.
- The behavior works at desktop, 390px, and 320px viewport widths without
  introducing horizontal overflow.
- Other homepage content, animations, themes, locales, and navigation remain
  unchanged.

## Approaches considered

### Native CSS anchor scrolling (selected)

Set the document scroll behavior to `smooth`, give `#install` a scroll margin
that clears the fixed header, and restore `auto` scrolling in the existing
reduced-motion media query. This keeps native anchor semantics and needs no new
client-side event handler or dependency.

### JavaScript `scrollIntoView`

Intercept the installation link click and call `scrollIntoView` with explicit
options. This could scope animation to one link, but it would add event and hash
synchronization code for behavior the browser already provides.

### Animation-library timeline

Drive the document position through an animation library. This would provide
custom duration and easing, but would be disproportionate for a single anchor
transition and would add runtime complexity.

## Design

The existing hero anchor and installation section markup remain unchanged.
Global document scrolling uses native smooth behavior so activation still
updates the URL fragment and the browser remains responsible for navigation.
The `#install` target receives a `scroll-margin-top` of `6rem`, placing its top
below the fixed header rather than flush against the viewport edge.

The existing `prefers-reduced-motion: reduce` media query sets document scroll
behavior back to `auto`. This ensures the target still moves into view and
receives the same header clearance without animated travel.

No JavaScript fallback is required: browsers that do not understand smooth
scrolling retain a functional immediate anchor jump. The target remains a
semantic section and no focus manipulation is introduced.

## Verification

Automated tests will assert the link-to-target contract, native smooth-scroll
CSS, the `6rem` target offset, and the reduced-motion override. The full site
gate must build all static routes, typecheck, and pass Vitest and Node tests.

Local browser verification will click the rendered installation action and
sample scroll position immediately, during movement, and after settlement. It
will confirm the final installation-section offset, `#install` URL fragment,
zero horizontal overflow, and reduced-motion immediate movement at desktop,
390px, and 320px widths. The same behavior will be checked on GitHub Pages after
CI and deployment succeed for the implementation commit.

## Realtime checkpoints

1. `docs(site): define smooth install navigation` publishes this approved
   design.
2. `docs(site): plan smooth install navigation` publishes the reviewed TDD and
   deployment steps.
3. `feat(site): smooth-scroll install navigation` publishes the tested CSS
   behavior and regression coverage.

If verification reveals a regression after a checkpoint is published, the fix
will be a new ordinary commit and push. Published history will not be amended or
force-pushed.

## Non-goals

- No change to installation wording, command, card content, or section order.
- No custom duration, easing curve, scroll listener, focus transfer, or route
  transition.
- No change to the tagline scrub, footer wordmark, theme persistence, locale
  selection, Swift CLI, MCP server, packaging, versioning, or releases.
