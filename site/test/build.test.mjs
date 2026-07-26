import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const siteDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(siteDir, "dist");

const readOutput = (path) => readFile(join(distDir, path), "utf8");

const expectedFiles = [
  "index.html",
  "en/index.html",
  "ko/index.html",
  "usage/index.html",
  "architecture/index.html",
  "openclaw/index.html",
  "versioning/index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/favicon.svg",
  "assets/kmsg-logo.jpg",
  "assets/demo1.mp4",
  "assets/demo-captions.vtt",
  "robots.txt",
  "sitemap.xml",
  "llm.txt",
  "llms.txt",
  "llms-full.txt",
  "site.webmanifest",
  ".nojekyll",
];

test("build emits every public page and discovery artifact", async () => {
  await Promise.all(expectedFiles.map((path) => access(join(distDir, path))));
});

test("Korean homepage is canonical at root", async () => {
  const html = await readOutput("index.html");

  assert.match(html, /<html lang="ko"/);
  assert.match(html, /<body data-source="README\.md">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/">/,
  );
  assert.match(
    html,
    /hreflang="en" href="https:\/\/channprj\.github\.io\/kmsg\/en\/"/,
  );
  assert.match(
    html,
    /hreflang="x-default" href="https:\/\/channprj\.github\.io\/kmsg\/"/,
  );
  assert.match(html, /macOS용 카카오톡 CLI 및 MCP 서버/);
  assert.match(html, /자주 묻는 질문/);
  assert.match(html, /실사용 후기/);
  assert.match(html, /href="#설치"/);
  assert.match(html, /id="설치"/);
  assert.match(html, /_Pd1G33_R48\/maxresdefault\.jpg/);
  assert.match(html, /xz5fA7OyvQ0\/maxresdefault\.jpg/);
  assert.equal((html.match(/width="400"/g) || []).length, 2);
  assert.match(html, /<track kind="captions"/);
  assert.match(html, /application\/ld\+json/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.doesNotMatch(html, /href="(?:\.\/|\.\.\/)[^"]+\.md(?:#|")/);
  assert.doesNotMatch(html, /javascript:/i);
});

test("English homepage is canonical at its locale path", async () => {
  const html = await readOutput("en/index.html");

  assert.match(html, /<html lang="en"/);
  assert.match(html, /<body data-source="README\.en\.md">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/en\/">/,
  );
  assert.match(
    html,
    /hreflang="ko" href="https:\/\/channprj\.github\.io\/kmsg\/"/,
  );
  assert.match(html, /KakaoTalk CLI &amp; MCP server for macOS/);
  assert.match(html, /Frequently asked questions/);
  assert.match(html, /Featured video/);
  assert.equal((html.match(/width="400"/g) || []).length, 2);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
});

test("legacy Korean route redirects to the canonical root", async () => {
  const html = await readOutput("ko/index.html");

  assert.match(
    html,
    /http-equiv="refresh" content="0; url=https:\/\/channprj\.github\.io\/kmsg\/"/,
  );
  assert.match(
    html,
    /rel="canonical" href="https:\/\/channprj\.github\.io\/kmsg\/"/,
  );
  assert.match(html, /name="robots" content="noindex,follow"/);
});

test("every content page uses the 1280px site shell and LLM action", async () => {
  for (const path of [
    "index.html",
    "en/index.html",
    "usage/index.html",
    "architecture/index.html",
    "openclaw/index.html",
    "versioning/index.html",
  ]) {
    const html = await readOutput(path);
    assert.match(
      html,
      /<div class="site-shell">[\s\S]*<header[\s\S]*<main[\s\S]*<footer[\s\S]*<\/div>/,
    );
    assert.match(html, /class="llm-link"[^>]+href="[^"]*llm\.txt"/);
  }

  const [root, english, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("en/index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.match(root, /data-light-label="밝은 테마로 전환"/);
  assert.match(english, /data-light-label="Switch to light theme"/);
  assert.match(root, /<div class="story-grid">/);
  assert.equal((root.match(/<article class="story-card">/g) || []).length, 2);
  assert.match(english, /<div class="story-grid">/);
  assert.equal(
    (english.match(/<article class="story-card">/g) || []).length,
    2,
  );
  assert.match(styles, /--shell-width:\s*1280px/);
  assert.match(styles, /\.site-shell\s*{[\s\S]*width:\s*min\(100%,\s*var\(--shell-width\)\)/);
});

test("singular and compatible LLM indexes match", async () => {
  const [singular, plural] = await Promise.all([
    readOutput("llm.txt"),
    readOutput("llms.txt"),
  ]);

  assert.equal(singular, plural);
  assert.match(
    singular,
    /Canonical website: https:\/\/channprj\.github\.io\/kmsg\//,
  );
  assert.match(singular, /English documentation.*\/kmsg\/en\//);
});

test("wide Markdown tables are keyboard-scrollable", async () => {
  const [architecture, styles] = await Promise.all([
    readOutput("architecture/index.html"),
    readOutput("assets/styles.css"),
  ]);

  assert.match(
    architecture,
    /<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table"><table>/,
  );
  assert.match(styles, /\.table-scroll\s*{[\s\S]*overflow-x:\s*auto/);
});

test("structured data describes the software, source, page, and FAQ", async () => {
  const html = await readOutput("index.html");
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]+?)<\/script>/,
  );
  assert.ok(match);

  const data = JSON.parse(match[1]);
  const types = data["@graph"].map((node) => node["@type"]);
  assert.ok(types.includes("SoftwareApplication"));
  assert.ok(types.includes("SoftwareSourceCode"));
  assert.ok(types.includes("WebPage"));
  assert.ok(types.includes("FAQPage"));

  const software = data["@graph"].find(
    (node) => node["@type"] === "SoftwareApplication",
  );
  assert.equal(software.operatingSystem, "macOS 13 or later");
  assert.equal(software.offers.price, "0");
  assert.match(software.installUrl, /usage\/#homebrew$/);

  const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, 6);
});

test("robots, sitemap, and LLM index point to canonical resources", async () => {
  const [robots, sitemap, llms, full] = await Promise.all([
    readOutput("robots.txt"),
    readOutput("sitemap.xml"),
    readOutput("llms.txt"),
    readOutput("llms-full.txt"),
  ]);

  assert.match(robots, /^User-agent: \*\nAllow: \//);
  assert.match(
    robots,
    /Sitemap: https:\/\/channprj\.github\.io\/kmsg\/sitemap\.xml/,
  );
  assert.match(sitemap, /<loc>https:\/\/channprj\.github\.io\/kmsg\/<\/loc>/);
  assert.match(
    sitemap,
    /<loc>https:\/\/channprj\.github\.io\/kmsg\/en\/<\/loc>/,
  );
  assert.doesNotMatch(
    sitemap,
    /<loc>https:\/\/channprj\.github\.io\/kmsg\/ko\/<\/loc>/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/channprj\.github\.io\/kmsg\/architecture\/<\/loc>/,
  );
  assert.match(llms, /KakaoTalk CLI and native MCP server/);
  assert.match(llms, /brew install channprj\/tap\/kmsg/);
  assert.match(full, /# Source: README\.md/);
  assert.match(full, /# Source: README\.en\.md/);
  assert.doesNotMatch(full, /# Source: README\.ko\.md/);
  assert.match(full, /# Source: ARCHITECTURE\.md/);
});
