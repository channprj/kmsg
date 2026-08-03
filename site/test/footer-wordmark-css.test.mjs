import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const styles = await readFile(
  new URL("../app/app.css", import.meta.url),
  "utf8",
);

test("footer wordmark keeps the reference crop and stagger timing", () => {
  assert.match(
    styles,
    /\.footer-wordmark\s*\{[^}]*height:\s*\.72em;[^}]*overflow:\s*hidden;[^}]*font-size:\s*clamp\(5rem,\s*12vw,\s*11rem\);[^}]*line-height:\s*\.84;/s,
  );
  assert.match(styles, /translateY\(\.42em\)/);
  assert.match(styles, /transition-duration:\s*800ms/);
  assert.match(
    styles,
    /transition-delay:\s*calc\(var\(--letter-index\)\s*\*\s*55ms\)/,
  );
  assert.match(styles, /cubic-bezier\(\.16,\s*1,\s*\.3,\s*1\)/);
  assert.match(
    styles,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.footer-wordmark\[data-state] span\s*\{[^}]*transition:\s*none;/,
  );
});
