import assert from "node:assert/strict"
import test from "node:test"

import { lastModifiedForPath } from "../scripts/git-metadata.mjs"

test("uses the source commit timestamp when history contains the path", () => {
  const calls = []
  const timestamp = lastModifiedForPath("/repo", "docs/page.md", (args) => {
    calls.push(args)
    return "2026-08-20T10:00:00+09:00"
  })

  assert.equal(timestamp, "2026-08-20T10:00:00+09:00")
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].slice(-2), ["--", "docs/page.md"])
})

test("falls back to the checked-out commit in shallow history", () => {
  const calls = []
  const timestamp = lastModifiedForPath("/repo", "docs/page.md", (args) => {
    calls.push(args)
    return calls.length === 1 ? "" : "2026-08-23T21:00:00Z"
  })

  assert.equal(timestamp, "2026-08-23T21:00:00Z")
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], ["log", "-1", "--format=%cI"])
})

test("returns a valid deterministic timestamp when git has no commits", () => {
  const timestamp = lastModifiedForPath("/repo", "docs/page.md", () => "")
  assert.equal(timestamp, "1970-01-01T00:00:00.000Z")
})
