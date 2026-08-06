import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const styles = await readFile(
  new URL("../app/app.css", import.meta.url),
  "utf8",
)

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
