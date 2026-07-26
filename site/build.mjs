import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const siteDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(siteDir, "..");
const outputDir = join(siteDir, "dist");

const site = {
  baseUrl: "https://channprj.github.io/kmsg/",
  repositoryUrl: "https://github.com/channprj/kmsg",
  releasesUrl: "https://github.com/channprj/kmsg/releases",
  authorUrl: "https://github.com/channprj",
  authorName: "channprj",
  productName: "kmsg",
  licenseUrl: "https://github.com/channprj/kmsg/blob/main/LICENSE",
  imagePath: "assets/kmsg-logo.jpg",
};

const pages = [
  {
    source: "README.md",
    output: "index.html",
    path: "",
    lang: "ko",
    type: "home",
    title: "kmsg — macOS용 카카오톡 CLI 및 MCP 서버",
    description:
      "macOS용 비공식 카카오톡 CLI 및 네이티브 MCP 서버입니다. 손쉬운 사용 자동화로 메시지를 읽고, 감시하고, 전송합니다.",
    eyebrow: "카카오톡 자동화 · macOS 13 이상",
    heroTitle: "카카오톡을<br><em>터미널 안으로.</em>",
    primaryAction: "kmsg 설치하기",
    docsAction: "문서 읽기",
    sourceLabel: "README.md에서 자동 생성",
  },
  {
    source: "README.en.md",
    output: "en/index.html",
    path: "en/",
    lang: "en",
    type: "home",
    title: "kmsg — KakaoTalk CLI & MCP server for macOS",
    description:
      "Unofficial KakaoTalk CLI and native MCP server for macOS. Read, watch, and send messages through Accessibility automation for scripts and AI agents.",
    eyebrow: "KakaoTalk automation · macOS 13+",
    heroTitle: "Your KakaoTalk.<br><em>Now in the terminal.</em>",
    primaryAction: "Install kmsg",
    docsAction: "Read the docs",
    sourceLabel: "Generated from README.en.md",
  },
  {
    source: "USAGE.md",
    output: "usage/index.html",
    path: "usage/",
    lang: "en",
    type: "docs",
    title: "kmsg Usage — install and automate KakaoTalk on macOS",
    description:
      "Install kmsg, learn every command, configure JSON output, and troubleshoot KakaoTalk Accessibility automation on macOS.",
    eyebrow: "Documentation · Usage",
  },
  {
    source: "ARCHITECTURE.md",
    output: "architecture/index.html",
    path: "architecture/",
    lang: "en",
    type: "docs",
    title: "kmsg Architecture — macOS Accessibility automation",
    description:
      "How kmsg uses Swift and the macOS Accessibility API to read, watch, and send KakaoTalk messages without implementing the private LOCO protocol.",
    eyebrow: "Documentation · Architecture",
  },
  {
    source: "docs/openclaw.md",
    output: "openclaw/index.html",
    path: "openclaw/",
    lang: "en",
    type: "docs",
    title: "Connect kmsg to OpenClaw and MCP clients",
    description:
      "Configure the native kmsg MCP server and real-time watch mode for OpenClaw and other AI agent clients.",
    eyebrow: "Documentation · MCP & OpenClaw",
  },
  {
    source: "VERSIONING.md",
    output: "versioning/index.html",
    path: "versioning/",
    lang: "en",
    type: "docs",
    title: "kmsg Versioning and release automation",
    description:
      "Understand the date-based kmsg version format, source of truth, release commands, and compatibility rules.",
    eyebrow: "Documentation · Versioning",
  },
];

const markdownRouteMap = new Map([
  ["README.md", ""],
  ["README.en.md", "en/"],
  ["USAGE.md", "usage/"],
  ["ARCHITECTURE.md", "architecture/"],
  ["docs/openclaw.md", "openclaw/"],
  ["VERSIONING.md", "versioning/"],
]);

marked.setOptions({
  gfm: true,
  breaks: false,
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const stripTags = (value) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();

const stripMarkdown = (value) => stripTags(marked.parse(value));

const slugify = (value) => {
  const slug = stripTags(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
};

const relativeAsset = (output, target) => {
  const path = relative(dirname(output), target).split("\\").join("/");
  return path.startsWith(".") ? path : `./${path}`;
};

const pageUrl = (path) => new URL(path, site.baseUrl).href;

const gitLastModified = (source) => {
  try {
    return execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", source],
      { cwd: repoDir, encoding: "utf8" },
    ).trim();
  } catch {
    return new Date(0).toISOString();
  }
};

const resolveMarkdownTarget = (target, page) => {
  if (
    target.startsWith("#") ||
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:")
  ) {
    return target;
  }

  const [rawPath, anchor = ""] = target.split("#", 2);
  const sourceRelativePath = posix.normalize(
    posix.join(posix.dirname(page.source), rawPath),
  );
  const route = markdownRouteMap.get(sourceRelativePath);
  const suffix = anchor ? `#${anchor}` : "";

  if (route !== undefined) {
    return `${relativeAsset(page.output, posix.join(route, "index.html"))}${suffix}`;
  }

  if (sourceRelativePath.startsWith("assets/")) {
    return `${relativeAsset(page.output, sourceRelativePath)}${suffix}`;
  }

  return `${site.repositoryUrl}/blob/main/${sourceRelativePath}${suffix}`;
};

const rewriteMarkdownLinks = (markdown, page) =>
  markdown.replace(
    /(!?\[[^\]]*])\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (match, label, target) =>
      `${label}(${resolveMarkdownTarget(target, page)})`,
  );

const prepareMarkdown = (markdown, page) => {
  const lines = markdown.split("\n");
  let skippedTitle = false;

  const filtered = lines.filter((line) => {
    if (!skippedTitle && line.startsWith("# ")) {
      skippedTitle = true;
      return false;
    }
    if (/^\[!\[.+]\(https:\/\/img\.shields\.io\//.test(line)) return false;
    if (/^\[(한국어|English)]\(.+\)$/.test(line)) return false;
    if (/^<p><img src="assets\/kmsg-logo\.jpg"/.test(line)) return false;
    return true;
  });

  return rewriteMarkdownLinks(filtered.join("\n").trim(), page);
};

const sanitizeOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "video",
    "source",
    "details",
    "summary",
    "kbd",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["id", "class", "aria-label", "aria-hidden", "data-language"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    video: ["src", "controls", "preload", "playsinline", "poster"],
    source: ["src", "type"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

const enhanceRenderedMarkdown = (html, page) => {
  const headingCounts = new Map();
  const headings = [];

  let enhanced = html.replace(
    /<h([2-4])>([\s\S]*?)<\/h\1>/g,
    (match, level, content) => {
      const baseSlug = slugify(content);
      const count = headingCounts.get(baseSlug) ?? 0;
      headingCounts.set(baseSlug, count + 1);
      const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
      const label = stripTags(content);
      headings.push({ level: Number(level), id, label });
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}">${content}</a></h${level}>`;
    },
  );

  enhanced = enhanced.replace(
    /<p><a href="(https:\/\/github\.com\/user-attachments\/assets\/[^"]+)">\1<\/a><\/p>/g,
    `<div class="media-frame"><video src="${relativeAsset(page.output, "assets/demo1.mp4")}" controls preload="metadata" playsinline aria-label="kmsg command line demo"><track kind="captions" srclang="en" label="English" src="${relativeAsset(page.output, "assets/demo-captions.vtt")}" default></video></div>`,
  );

  enhanced = enhanced.replace(
    /(<h2 id="(?:실사용-후기|featured-video)">[\s\S]*?<\/h2>)\s*<p>(<a[^>]+><img[^>]+><\/a>)<\/p>\s*<p>([\s\S]*?)<\/p>\s*<p>(<a[^>]+><img[^>]+><\/a>)<\/p>\s*<p>([\s\S]*?)<\/p>/,
    `$1
<div class="story-grid">
  <article class="story-card">
    <div class="story-media">$2</div>
    <div class="story-copy"><p>$3</p></div>
  </article>
  <article class="story-card">
    <div class="story-media">$4</div>
    <div class="story-copy"><p>$5</p></div>
  </article>
</div>`,
  );

  const tableLabel =
    page.lang === "ko" ? "스크롤 가능한 표" : "Scrollable table";
  enhanced = enhanced
    .replace(
      /<table>/g,
      `<div class="table-scroll" tabindex="0" role="region" aria-label="${tableLabel}"><table>`,
    )
    .replace(/<\/table>/g, "</table></div>");

  enhanced = enhanced.replace(
    /<a href="(https?:\/\/[^"]+)">/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">',
  );

  return { html: enhanced, headings };
};

const renderMarkdown = (markdown, page) => {
  const prepared = prepareMarkdown(markdown, page);
  const unsafeHtml = marked.parse(prepared);
  const safeHtml = sanitizeHtml(unsafeHtml, sanitizeOptions);
  return enhanceRenderedMarkdown(safeHtml, page);
};

const extractIntro = (markdown, lang) => {
  const paragraphs = markdown
    .replace(/^# .+$/m, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const candidate = paragraphs.find((paragraph) =>
    lang === "ko"
      ? paragraph.startsWith("`kmsg`는")
      : paragraph.startsWith("`kmsg` is"),
  );

  return candidate ? stripMarkdown(candidate) : "";
};

const extractFaqs = (markdown, lang) => {
  const sectionTitle =
    lang === "ko" ? "## 자주 묻는 질문" : "## Frequently asked questions";
  const start = markdown.indexOf(sectionTitle);
  if (start === -1) return [];

  const section = markdown.slice(start + sectionTitle.length);
  const end = section.search(/^##\s/m);
  const faqMarkdown = end === -1 ? section : section.slice(0, end);
  const chunks = faqMarkdown.split(/^###\s+/m).slice(1);

  return chunks
    .map((chunk) => {
      const [question, ...answerLines] = chunk.split("\n");
      return {
        question: stripMarkdown(question),
        answer: stripMarkdown(answerLines.join("\n").trim()),
      };
    })
    .filter(({ question, answer }) => question && answer);
};

const renderToc = (headings, page) => {
  const items = headings
    .filter(({ level }) => level === 2)
    .map(
      ({ id, label }) =>
        `<li><a href="#${id}" data-toc-link>${escapeHtml(label)}</a></li>`,
    )
    .join("");

  const label = page.lang === "ko" ? "이 페이지에서" : "On this page";
  return `
    <aside class="toc" aria-label="${label}">
      <p class="toc-label">${label}</p>
      <ol>${items}</ol>
      <a class="toc-source" href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">
        ${page.lang === "ko" ? "원본 Markdown 보기" : "View source Markdown"}
        <span aria-hidden="true">↗</span>
      </a>
    </aside>`;
};

const renderHeader = (page) => {
  const rootLink = relativeAsset(page.output, "index.html");
  const usageLink = relativeAsset(page.output, "usage/index.html");
  const architectureLink = relativeAsset(
    page.output,
    "architecture/index.html",
  );
  const openClawLink = relativeAsset(page.output, "openclaw/index.html");
  const llmLink = relativeAsset(page.output, "llm.txt");
  const languageLink =
    page.lang === "ko"
      ? relativeAsset(page.output, "en/index.html")
      : rootLink;
  const languageLabel = page.lang === "ko" ? "EN" : "한국어";
  const navigationLabel =
    page.lang === "ko" ? "주요 탐색 메뉴" : "Primary navigation";
  const lightThemeLabel =
    page.lang === "ko" ? "밝은 테마로 전환" : "Switch to light theme";
  const darkThemeLabel =
    page.lang === "ko" ? "어두운 테마로 전환" : "Switch to dark theme";

  return `
    <header class="site-header" data-header>
      <div class="header-inner">
        <a class="brand" href="${rootLink}" aria-label="kmsg home">
          <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="36" height="36">
          <span>kmsg</span>
          <span class="brand-status" aria-label="project status: online"></span>
        </a>
        <nav class="primary-nav" aria-label="${navigationLabel}">
          <a href="${usageLink}">${page.lang === "ko" ? "사용법" : "Usage"}</a>
          <a href="${architectureLink}">${page.lang === "ko" ? "구조" : "Architecture"}</a>
          <a href="${openClawLink}">MCP</a>
          <a href="${site.repositoryUrl}" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </nav>
        <div class="header-tools">
          <a class="llm-link" href="${llmLink}" type="text/plain">LLM.txt <span aria-hidden="true">↗</span></a>
          <a class="language-link" href="${languageLink}" hreflang="${page.lang === "ko" ? "en" : "ko"}">${languageLabel}</a>
          <button class="theme-toggle" type="button" aria-label="${lightThemeLabel}" data-theme-toggle data-light-label="${lightThemeLabel}" data-dark-label="${darkThemeLabel}">
            <span class="theme-toggle-track"><span class="theme-toggle-thumb"></span></span>
          </button>
        </div>
      </div>
    </header>`;
};

const renderHomeHero = (page, intro, version) => {
  const installationId = page.lang === "ko" ? "설치" : "installation";
  const docsLink = relativeAsset(page.output, "usage/index.html");
  const copiedLabel = page.lang === "ko" ? "복사됨" : "Copied";
  const previewLabel =
    page.lang === "ko" ? "kmsg 터미널 미리보기" : "kmsg terminal preview";
  const projectHighlightsLabel =
    page.lang === "ko" ? "프로젝트 주요 정보" : "Project highlights";
  const chatName = page.lang === "ko" ? "프로젝트" : "Product Team";
  const firstSender = page.lang === "ko" ? "지나" : "Jina";
  const firstMessage =
    page.lang === "ko" ? "배포할까요?" : "Ship it?";
  const secondSender = page.lang === "ko" ? "나" : "Me";
  const secondMessage =
    page.lang === "ko" ? "이미 완료했어요." : "Already did.";

  return `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span>${escapeHtml(page.eyebrow)}</p>
        <h1 id="hero-title">${page.heroTitle}</h1>
        <p class="hero-lead">${escapeHtml(intro)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#${installationId}">
            ${escapeHtml(page.primaryAction)}
            <span aria-hidden="true">↓</span>
          </a>
          <a class="button button-ghost" href="${docsLink}">
            ${escapeHtml(page.docsAction)}
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <button class="install-command copy-control" type="button" data-copy="brew install channprj/tap/kmsg" data-copied-label="${copiedLabel}">
          <span class="prompt" aria-hidden="true">$</span>
          <code>brew install channprj/tap/kmsg</code>
          <span class="copy-icon" aria-hidden="true">⧉</span>
        </button>
      </div>

      <div class="hero-visual" role="img" aria-label="${previewLabel}">
        <div class="terminal-window">
          <div class="terminal-bar">
            <div class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></div>
            <span>kmsg · zsh</span>
            <span class="terminal-version">v${escapeHtml(version)}</span>
          </div>
          <div class="terminal-body" aria-hidden="true">
            <p><span class="terminal-prompt">~</span> <span class="terminal-command">kmsg read "${chatName}" --limit 2</span></p>
            <div class="json-output">
              <p><span class="syntax-brace">{</span></p>
              <p><span class="syntax-key">"chat"</span>: <span class="syntax-string">"${chatName}"</span>,</p>
              <p><span class="syntax-key">"messages"</span>: <span class="syntax-brace">[</span></p>
              <p class="indent"><span class="syntax-brace">{</span> <span class="syntax-key">"sender"</span>: <span class="syntax-string">"${firstSender}"</span>,</p>
              <p class="indent-2"><span class="syntax-key">"text"</span>: <span class="syntax-string">"${firstMessage}"</span> <span class="syntax-brace">}</span>,</p>
              <p class="indent"><span class="syntax-brace">{</span> <span class="syntax-key">"sender"</span>: <span class="syntax-string">"${secondSender}"</span>,</p>
              <p class="indent-2"><span class="syntax-key">"text"</span>: <span class="syntax-string">"${secondMessage}"</span> <span class="syntax-brace">}</span></p>
              <p><span class="syntax-brace">]</span></p>
              <p><span class="syntax-brace">}</span></p>
            </div>
            <p class="terminal-ready"><span class="terminal-prompt">~</span> <span class="cursor-block"></span></p>
          </div>
          <div class="terminal-footer">
            <span><i></i> AX CONNECTED</span>
            <span>JSON · STDOUT</span>
          </div>
        </div>
      </div>

      <ul class="hero-signals" aria-label="${projectHighlightsLabel}">
        <li><span>Swift</span><strong>6</strong></li>
        <li><span>MCP</span><strong>3 tools</strong></li>
        <li><span>Output</span><strong>JSON</strong></li>
        <li><span>Runtime</span><strong>Local AX API</strong></li>
      </ul>
    </section>`;
};

const renderDocsHero = (page, markdown, lastModified) => {
  const sourceTitle = markdown.match(/^#\s+(.+)$/m)?.[1] ?? page.title;
  const dateLabel = new Intl.DateTimeFormat(page.lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(lastModified));

  return `
    <section class="docs-hero" aria-labelledby="page-title">
      <p class="eyebrow"><span></span>${escapeHtml(page.eyebrow)}</p>
      <h1 id="page-title">${escapeHtml(sourceTitle)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <div class="docs-meta">
        <span>README pipeline</span>
        <span>Updated ${escapeHtml(dateLabel)}</span>
        <a href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">Edit on GitHub ↗</a>
      </div>
    </section>`;
};

const renderFooter = (page, version) => {
  const architectureLink = relativeAsset(
    page.output,
    "architecture/index.html",
  );
  const versioningLink = relativeAsset(page.output, "versioning/index.html");

  return `
    <footer class="site-footer">
      <div class="footer-brand">
        <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="56" height="56">
        <div><strong>kmsg</strong><span>KakaoTalk CLI for macOS</span></div>
      </div>
      <div class="footer-links">
        <a href="${architectureLink}">Architecture</a>
        <a href="${versioningLink}">v${escapeHtml(version)}</a>
        <a href="${site.licenseUrl}" target="_blank" rel="noopener noreferrer">MIT License</a>
      </div>
      <p>Independent open source. Not affiliated with Kakao Corp.</p>
    </footer>`;
};

const buildStructuredData = ({
  page,
  version,
  canonical,
  lastModified,
  faqs,
}) => {
  const productId = `${site.baseUrl}#software`;
  const authorId = `${site.baseUrl}#author`;
  const websiteId = `${site.baseUrl}#website`;
  const graph = [
    {
      "@type": "Person",
      "@id": authorId,
      name: site.authorName,
      url: site.authorUrl,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: site.baseUrl,
      name: "kmsg",
      description: page.description,
      inLanguage: ["en", "ko"],
      publisher: { "@id": authorId },
    },
    {
      "@type": "SoftwareApplication",
      "@id": productId,
      name: "kmsg",
      alternateName: "KakaoTalk CLI for macOS",
      description:
        "Unofficial KakaoTalk CLI and native MCP server for reading, watching, and sending messages on macOS.",
      url: site.baseUrl,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Command-line interface",
      operatingSystem: "macOS 13 or later",
      softwareVersion: version,
      downloadUrl: site.releasesUrl,
      installUrl: `${site.baseUrl}usage/#homebrew`,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: { "@id": authorId },
      license: site.licenseUrl,
      sameAs: [site.repositoryUrl],
    },
    {
      "@type": "SoftwareSourceCode",
      name: "kmsg",
      description: page.description,
      codeRepository: site.repositoryUrl,
      programmingLanguage: "Swift",
      runtimePlatform: "macOS 13 or later",
      version: version,
      license: site.licenseUrl,
      author: { "@id": authorId },
      isPartOf: { "@id": productId },
    },
    {
      "@type": page.type === "docs" ? "TechArticle" : "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      headline: page.title,
      description: page.description,
      inLanguage: page.lang,
      dateModified: lastModified,
      isPartOf: { "@id": websiteId },
      about: { "@id": productId },
      author: { "@id": authorId },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "kmsg",
            item: site.baseUrl,
          },
          ...(page.path
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: page.eyebrow.replace(/^.+ · /, ""),
                  item: canonical,
                },
              ]
            : []),
        ],
      },
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    });
  }

  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph },
    null,
    2,
  ).replaceAll("<", "\\u003c");
};

const renderDocument = ({
  page,
  markdown,
  rendered,
  intro,
  version,
  faqs,
  lastModified,
}) => {
  const canonical = pageUrl(page.path);
  const rootAsset = (target) => relativeAsset(page.output, target);
  const alternateEn = page.type === "home" ? pageUrl("en/") : canonical;
  const alternateKo = page.type === "home" ? pageUrl("") : null;
  const xDefault = page.type === "home" ? pageUrl("") : canonical;
  const structuredData = buildStructuredData({
    page,
    version,
    canonical,
    lastModified,
    faqs,
  });
  const hero =
    page.type === "home"
      ? renderHomeHero(page, intro, version)
      : renderDocsHero(page, markdown, lastModified);

  return `<!doctype html>
<html lang="${page.lang}" data-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <meta name="author" content="${site.authorName}">
    <meta name="application-name" content="kmsg">
    <meta name="generator" content="kmsg README site generator">
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
    <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
    <meta name="theme-color" content="#0d1117">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="en" href="${alternateEn}">
    ${alternateKo ? `<link rel="alternate" hreflang="ko" href="${alternateKo}">` : ""}
    <link rel="alternate" hreflang="x-default" href="${xDefault}">
    <link rel="alternate" type="text/markdown" href="${site.repositoryUrl}/raw/main/${page.source}" title="${escapeHtml(page.source)}">
    <link rel="alternate" type="text/plain" href="${pageUrl("llm.txt")}" title="LLM-readable site index">
    <link rel="manifest" href="${rootAsset("site.webmanifest")}">
    <link rel="icon" href="${rootAsset("assets/favicon.svg")}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Syne:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${rootAsset("assets/styles.css")}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="kmsg">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${pageUrl(site.imagePath)}">
    <meta property="og:image:alt" content="kmsg KakaoTalk CLI logo">
    <meta property="og:locale" content="${page.lang === "ko" ? "ko_KR" : "en_US"}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${pageUrl(site.imagePath)}">

    <script type="application/ld+json">${structuredData}</script>
    <script>
      try {
        const savedTheme = localStorage.getItem("kmsg-theme");
        if (savedTheme) document.documentElement.dataset.theme = savedTheme;
      } catch {}
    </script>
  </head>
  <body data-source="${escapeHtml(page.source)}">
    <a class="skip-link" href="#content">${page.lang === "ko" ? "본문으로 이동" : "Skip to content"}</a>
    <div class="site-grid" aria-hidden="true"></div>
    <div class="site-shell">
      ${renderHeader(page)}
      <main id="content">
        ${hero}
        <div class="content-layout">
          ${renderToc(rendered.headings, page)}
          <article class="markdown-body" data-markdown-content>
            <div class="source-stamp">
              <span class="source-dot"></span>
              ${escapeHtml(page.sourceLabel ?? page.source)}
              <a href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">source ↗</a>
            </div>
            ${rendered.html}
          </article>
        </div>
      </main>
      ${renderFooter(page, version)}
    </div>
    <script src="${rootAsset("assets/app.js")}" defer></script>
  </body>
</html>`;
};

const buildLlmsIndex = (version) => {
  const links = pages
    .map(
      ({ path, title, description }) =>
        `- [${title}](${pageUrl(path)}): ${description}`,
    )
    .join("\n");

  return `# kmsg

> kmsg is an unofficial KakaoTalk CLI and native MCP server for macOS. It reads, watches, and sends messages through Apple's Accessibility API for local automation and AI agents.

Current version: ${version}
Canonical website: ${site.baseUrl}
Source repository: ${site.repositoryUrl}
License: MIT

## Documentation

${links}

## Primary facts

- Platform: macOS 13 or later
- Runtime dependency: KakaoTalk for macOS
- Implementation: Swift 6
- Interface: CLI, structured JSON, hooks, and native stdio MCP server
- Access method: macOS Accessibility API; kmsg does not implement the private LOCO protocol
- Install: \`brew install channprj/tap/kmsg\`
- Affiliation: Independent open source; not affiliated with Kakao Corp.

## Optional

- [Korean documentation](${site.baseUrl}): 한국어 프로젝트 소개, 설치 방법, 주요 기능, FAQ
- [English documentation](${pageUrl("en/")}): English project overview, installation, highlights, and FAQ
- [Full Markdown corpus](${pageUrl("llms-full.txt")}): README and project documentation combined as plain Markdown
`;
};

const buildLlmsFull = (documents, version) => {
  const sections = documents
    .map(
      ({ page, markdown }) =>
        `# Source: ${page.source}\nCanonical URL: ${pageUrl(page.path)}\n\n${markdown.trim()}`,
    )
    .join("\n\n---\n\n");

  return `# kmsg documentation corpus

Version: ${version}
Repository: ${site.repositoryUrl}
Generated automatically from the repository Markdown sources.

---

${sections}
`;
};

const buildSitemap = (documents) => {
  const entries = documents
    .map(
      ({ page, lastModified }) => `  <url>
    <loc>${pageUrl(page.path)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${page.type === "home" ? "weekly" : "monthly"}</changefreq>
    <priority>${page.type === "home" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
};

const buildRedirect = (target, lang = "ko") =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">` +
  `<meta http-equiv="refresh" content="0; url=${target}">` +
  `<link rel="canonical" href="${target}">` +
  `<meta name="robots" content="noindex,follow"></head>` +
  `<body><p><a href="${target}">kmsg 문서로 이동</a></p></body></html>`;

const main = async () => {
  const version = (await readFile(join(repoDir, "VERSION"), "utf8")).trim();
  const documents = await Promise.all(
    pages.map(async (page) => {
      const markdown = await readFile(join(repoDir, page.source), "utf8");
      return {
        page,
        markdown,
        rendered: renderMarkdown(markdown, page),
        intro: extractIntro(markdown, page.lang),
        faqs: extractFaqs(markdown, page.lang),
        lastModified: gitLastModified(page.source),
      };
    }),
  );

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(join(outputDir, "assets"), { recursive: true });

  for (const document of documents) {
    const outputPath = join(outputDir, document.page.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      renderDocument({ ...document, version }),
      "utf8",
    );
  }

  await mkdir(join(outputDir, "ko"), { recursive: true });
  await writeFile(
    join(outputDir, "ko/index.html"),
    buildRedirect(site.baseUrl),
    "utf8",
  );

  const llmsIndex = buildLlmsIndex(version);

  await Promise.all([
    copyFile(join(siteDir, "src/styles.css"), join(outputDir, "assets/styles.css")),
    copyFile(join(siteDir, "src/app.js"), join(outputDir, "assets/app.js")),
    copyFile(join(siteDir, "src/favicon.svg"), join(outputDir, "assets/favicon.svg")),
    copyFile(join(siteDir, "src/demo-captions.vtt"), join(outputDir, "assets/demo-captions.vtt")),
    copyFile(join(repoDir, site.imagePath), join(outputDir, site.imagePath)),
    copyFile(join(repoDir, "assets/demo1.mp4"), join(outputDir, "assets/demo1.mp4")),
    writeFile(join(outputDir, ".nojekyll"), "", "utf8"),
    writeFile(
      join(outputDir, "robots.txt"),
      `User-agent: *\nAllow: /\n\nSitemap: ${pageUrl("sitemap.xml")}\n`,
      "utf8",
    ),
    writeFile(join(outputDir, "sitemap.xml"), buildSitemap(documents), "utf8"),
    writeFile(join(outputDir, "llm.txt"), llmsIndex, "utf8"),
    writeFile(join(outputDir, "llms.txt"), llmsIndex, "utf8"),
    writeFile(
      join(outputDir, "llms-full.txt"),
      buildLlmsFull(documents, version),
      "utf8",
    ),
    writeFile(
      join(outputDir, "site.webmanifest"),
      JSON.stringify(
        {
          name: "kmsg — KakaoTalk CLI for macOS",
          short_name: "kmsg",
          description: pages[0].description,
          start_url: "/kmsg/",
          display: "standalone",
          background_color: "#0d1117",
          theme_color: "#fee500",
          icons: [
            {
              src: "assets/kmsg-logo.jpg",
              sizes: "1000x1000",
              type: "image/jpeg",
              purpose: "any",
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    ),
    writeFile(
      join(outputDir, "404.html"),
      `<!doctype html><meta charset="utf-8"><title>kmsg</title><meta http-equiv="refresh" content="0; url=${site.baseUrl}"><link rel="canonical" href="${site.baseUrl}"><p><a href="${site.baseUrl}">Continue to kmsg</a></p>`,
      "utf8",
    ),
  ]);

  console.log(
    `Built ${documents.length} pages and discovery files in ${relative(repoDir, outputDir)}`,
  );
};

await main();
