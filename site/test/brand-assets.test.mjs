import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const repoDir = resolve(fileURLToPath(new URL("../..", import.meta.url)))
const asset = (...parts) => join(repoDir, "assets", "brand", ...parts)

function pngHeader(buffer) {
  assert.deepEqual(
    [...buffer.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  )
  assert.equal(buffer.toString("ascii", 12, 16), "IHDR")
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer.readUInt8(25),
  }
}

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
    assert.doesNotMatch(
      svg,
      /<text\b|<image\b|<style\b|(?:href|src)="(?:https?:\/\/|data:)|url\((?:https?:\/\/|data:)/,
    )
  }
})

test("brand SVG sources keep the approved palette and flat construction", async () => {
  const sources = await Promise.all(
    svgFiles.map((name) => readFile(asset("source", name), "utf8")),
  )
  const combined = sources.join("\n")
  assert.match(combined, /#FEE500/)
  assert.match(combined, /#19170D/)
  assert.doesNotMatch(combined, /<filter\b|<linearGradient\b|<radialGradient\b/)
})

const fixedPngs = new Map([
  ["kmsg-symbol-primary-1024.png", [1024, 1024]],
  ["kmsg-symbol-mono-1024.png", [1024, 1024]],
  ["kmsg-symbol-reverse-1024.png", [1024, 1024]],
  ["kmsg-app-icon-1024.png", [1024, 1024]],
  ["kmsg-app-icon-512.png", [512, 512]],
  ["kmsg-app-icon-192.png", [192, 192]],
  ["kmsg-app-icon-64.png", [64, 64]],
  ["kmsg-app-icon-32.png", [32, 32]],
  ["kmsg-app-icon-16.png", [16, 16]],
  ["kmsg-social-preview-1200x630.png", [1200, 630]],
])

test("brand PNG outputs use the required dimensions", async () => {
  for (const [name, [width, height]] of fixedPngs) {
    const header = pngHeader(await readFile(asset("png", name)))
    assert.equal(header.width, width, `${name} width`)
    assert.equal(header.height, height, `${name} height`)
  }
})

test("transparent symbol PNGs expose an alpha channel", async () => {
  for (const name of [
    "kmsg-symbol-primary-1024.png",
    "kmsg-symbol-mono-1024.png",
    "kmsg-symbol-reverse-1024.png",
  ]) {
    const header = pngHeader(await readFile(asset("png", name)))
    assert.equal(header.colorType, 6, `${name} must be RGBA`)
  }
})

test("signature PNGs are 220 pixels wide", async () => {
  for (const name of [
    "kmsg-signature-light-220.png",
    "kmsg-signature-dark-220.png",
  ]) {
    const header = pngHeader(await readFile(asset("png", name)))
    assert.equal(header.width, 220, `${name} width`)
    assert.ok(header.height >= 48, `${name} must remain legible`)
  }
})

test("Telegram review boards use the requested 1280 by 1024 surface", async () => {
  for (const name of [
    "kmsg-connected-bubbles-review-1280x1024.png",
    "kmsg-connected-bubbles-size-test-1280x1024.png",
  ]) {
    const header = pngHeader(await readFile(asset("review", name)))
    assert.deepEqual(
      [header.width, header.height],
      [1280, 1024],
      `${name} dimensions`,
    )
  }
})
