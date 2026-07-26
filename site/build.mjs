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

const localeOrder = ["ko", "en", "jp", "cn"];

const locales = {
  ko: {
    id: "ko",
    lang: "ko",
    hrefLang: "ko",
    prefix: "",
    label: "KO",
    name: "한국어",
    dateLocale: "ko-KR",
    ogLocale: "ko_KR",
    ui: {
      navigation: "주요 탐색 메뉴",
      usage: "사용법",
      architecture: "구조",
      skip: "본문으로 이동",
      toc: "이 페이지에서",
      source: "원본 Markdown 보기",
      sourceAction: "source ↗",
      lightTheme: "밝은 테마로 전환",
      darkTheme: "어두운 테마로 전환",
      language: "언어 선택",
      copy: "복사",
      copied: "복사됨",
      copyFailed: "복사 실패",
      table: "스크롤 가능한 표",
      updated: "업데이트",
      edit: "GitHub에서 편집 ↗",
      pipeline: "현지화 문서",
      footerTagline: "macOS용 KakaoTalk CLI",
      footerDisclaimer: "Kakao Corp.와 무관한 독립 오픈소스 프로젝트입니다.",
    },
  },
  en: {
    id: "en",
    lang: "en",
    hrefLang: "en",
    prefix: "en",
    label: "EN",
    name: "English",
    dateLocale: "en-US",
    ogLocale: "en_US",
    ui: {
      navigation: "Primary navigation",
      usage: "Usage",
      architecture: "Architecture",
      skip: "Skip to content",
      toc: "On this page",
      source: "View source Markdown",
      sourceAction: "source ↗",
      lightTheme: "Switch to light theme",
      darkTheme: "Switch to dark theme",
      language: "Select language",
      copy: "Copy",
      copied: "Copied",
      copyFailed: "Copy failed",
      table: "Scrollable table",
      updated: "Updated",
      edit: "Edit on GitHub ↗",
      pipeline: "Canonical docs",
      footerTagline: "KakaoTalk CLI for macOS",
      footerDisclaimer: "Independent open source. Not affiliated with Kakao Corp.",
    },
  },
  jp: {
    id: "jp",
    lang: "ja",
    hrefLang: "ja",
    prefix: "jp",
    label: "JP",
    name: "日本語",
    dateLocale: "ja-JP",
    ogLocale: "ja_JP",
    ui: {
      navigation: "メインナビゲーション",
      usage: "使い方",
      architecture: "構成",
      skip: "本文へ移動",
      toc: "このページの内容",
      source: "Markdown原文を見る",
      sourceAction: "source ↗",
      lightTheme: "ライトテーマに切り替え",
      darkTheme: "ダークテーマに切り替え",
      language: "言語を選択",
      copy: "コピー",
      copied: "コピーしました",
      copyFailed: "コピーできませんでした",
      table: "横にスクロールできる表",
      updated: "更新",
      edit: "GitHubで編集 ↗",
      pipeline: "日本語ドキュメント",
      footerTagline: "macOS向けKakaoTalk CLI",
      footerDisclaimer: "Kakao Corp.とは無関係の独立したオープンソースです。",
    },
  },
  cn: {
    id: "cn",
    lang: "zh-CN",
    hrefLang: "zh-CN",
    prefix: "cn",
    label: "CN",
    name: "简体中文",
    dateLocale: "zh-CN",
    ogLocale: "zh_CN",
    ui: {
      navigation: "主导航",
      usage: "使用指南",
      architecture: "架构",
      skip: "跳到正文",
      toc: "本页内容",
      source: "查看Markdown原文",
      sourceAction: "source ↗",
      lightTheme: "切换到浅色主题",
      darkTheme: "切换到深色主题",
      language: "选择语言",
      copy: "复制",
      copied: "已复制",
      copyFailed: "复制失败",
      table: "可横向滚动的表格",
      updated: "更新于",
      edit: "在GitHub编辑 ↗",
      pipeline: "简体中文文档",
      footerTagline: "面向macOS的KakaoTalk CLI",
      footerDisclaimer: "独立开源项目，与Kakao Corp.无隶属关系。",
    },
  },
};

const pageDefinitions = [
  {
    key: "home",
    slug: "",
    type: "home",
    sources: {
      ko: "README.md",
      en: "README.en.md",
      jp: "site/content/jp/home.md",
      cn: "site/content/cn/home.md",
    },
    translations: {
      ko: {
        title: "kmsg — macOS용 카카오톡 CLI 및 MCP 서버",
        description:
          "macOS용 비공식 카카오톡 CLI 및 네이티브 MCP 서버입니다. 손쉬운 사용 자동화로 메시지를 읽고, 감시하고, 전송합니다.",
        eyebrow: "카카오톡 자동화 · macOS 13 이상",
        heroTitle: "카카오톡을<br><em>AI Native 하게 활용하기.</em>",
        primaryAction: "kmsg 설치하기",
        docsAction: "문서 읽기",
        sourceLabel: "README.md에서 자동 생성",
        installAnchor: "설치",
        faqHeading: "자주 묻는 질문",
        previewLabel: "kmsg 터미널 미리보기",
        highlightsLabel: "프로젝트 주요 정보",
        chatName: "AI 프로젝트",
        firstSender: "지나",
        firstMessage: "새 메시지를 요약해줘.",
        secondSender: "kmsg",
        secondMessage: "MCP 도구로 전달했어요.",
      },
      en: {
        title: "kmsg — KakaoTalk CLI & MCP server for macOS",
        description:
          "Unofficial KakaoTalk CLI and native MCP server for macOS. Read, watch, and send messages through Accessibility automation for scripts and AI agents.",
        eyebrow: "KakaoTalk automation · macOS 13+",
        heroTitle: "Use KakaoTalk.<br><em>The AI-native way.</em>",
        primaryAction: "Install kmsg",
        docsAction: "Read the docs",
        sourceLabel: "Generated from README.en.md",
        installAnchor: "installation",
        faqHeading: "Frequently asked questions",
        previewLabel: "kmsg terminal preview",
        highlightsLabel: "Project highlights",
        chatName: "AI Project",
        firstSender: "Jina",
        firstMessage: "Summarize the new messages.",
        secondSender: "kmsg",
        secondMessage: "Passed them to the MCP tool.",
      },
      jp: {
        title: "kmsg — macOS向けKakaoTalk CLI / MCPサーバー",
        description:
          "KakaoTalkをmacOSのアクセシビリティAPIで読み取り、監視、送信できる非公式CLI兼ネイティブMCPサーバーです。",
        eyebrow: "KakaoTalk自動化 · macOS 13以降",
        heroTitle: "KakaoTalkを<br><em>AIネイティブに活用。</em>",
        primaryAction: "kmsgをインストール",
        docsAction: "ドキュメントを読む",
        sourceLabel: "日本語ドキュメント",
        installAnchor: "インストール",
        faqHeading: "よくある質問",
        previewLabel: "kmsgターミナルプレビュー",
        highlightsLabel: "プロジェクトの概要",
        chatName: "AIプロジェクト",
        firstSender: "ジナ",
        firstMessage: "新着メッセージを要約して。",
        secondSender: "kmsg",
        secondMessage: "MCPツールへ渡しました。",
      },
      cn: {
        title: "kmsg — 面向macOS的KakaoTalk CLI与MCP服务器",
        description:
          "通过macOS辅助功能API读取、监控和发送KakaoTalk消息的非官方CLI与原生MCP服务器。",
        eyebrow: "KakaoTalk自动化 · macOS 13+",
        heroTitle: "让KakaoTalk<br><em>以AI原生方式工作。</em>",
        primaryAction: "安装kmsg",
        docsAction: "阅读文档",
        sourceLabel: "简体中文文档",
        installAnchor: "安装",
        faqHeading: "常见问题",
        previewLabel: "kmsg终端预览",
        highlightsLabel: "项目概览",
        chatName: "AI项目",
        firstSender: "Jina",
        firstMessage: "请总结新消息。",
        secondSender: "kmsg",
        secondMessage: "已传给MCP工具。",
      },
    },
  },
  {
    key: "usage",
    slug: "usage",
    type: "docs",
    sources: {
      ko: "site/content/ko/usage.md",
      en: "USAGE.md",
      jp: "site/content/jp/usage.md",
      cn: "site/content/cn/usage.md",
    },
    translations: {
      ko: {
        title: "kmsg 사용법 — macOS에서 KakaoTalk 자동화하기",
        description:
          "kmsg 설치, 전체 명령, JSON 출력, 안전한 읽기, KakaoTalk 자동화 문제 해결 방법을 안내합니다.",
        eyebrow: "문서 · 사용법",
      },
      en: {
        title: "kmsg Usage — install and automate KakaoTalk on macOS",
        description:
          "Install kmsg, learn every command, configure JSON output, and troubleshoot KakaoTalk Accessibility automation on macOS.",
        eyebrow: "Documentation · Usage",
      },
      jp: {
        title: "kmsgの使い方 — macOSでKakaoTalkを自動化",
        description:
          "インストール、主要コマンド、安全な読み取り、JSON、MCP、トラブルシューティングを説明します。",
        eyebrow: "ドキュメント · 使い方",
      },
      cn: {
        title: "kmsg使用指南 — 在macOS上自动化KakaoTalk",
        description:
          "介绍安装、主要命令、安全读取、JSON、MCP和故障排除。",
        eyebrow: "文档 · 使用指南",
      },
    },
  },
  {
    key: "architecture",
    slug: "architecture",
    type: "docs",
    sources: {
      ko: "site/content/ko/architecture.md",
      en: "ARCHITECTURE.md",
      jp: "site/content/jp/architecture.md",
      cn: "site/content/cn/architecture.md",
    },
    translations: {
      ko: {
        title: "kmsg 아키텍처 — macOS 손쉬운 사용 자동화",
        description:
          "Swift와 macOS 손쉬운 사용 API로 KakaoTalk을 자동화하는 구조와 설계 결정을 설명합니다.",
        eyebrow: "문서 · 아키텍처",
      },
      en: {
        title: "kmsg Architecture — macOS Accessibility automation",
        description:
          "How kmsg uses Swift and the macOS Accessibility API to read, watch, and send KakaoTalk messages without implementing the private LOCO protocol.",
        eyebrow: "Documentation · Architecture",
      },
      jp: {
        title: "kmsgアーキテクチャ — macOSアクセシビリティ自動化",
        description:
          "SwiftとmacOSアクセシビリティAPIを使う構造、データフロー、設計判断を説明します。",
        eyebrow: "ドキュメント · アーキテクチャ",
      },
      cn: {
        title: "kmsg架构 — macOS辅助功能自动化",
        description:
          "介绍基于Swift和macOS辅助功能API的组件、数据流与设计决策。",
        eyebrow: "文档 · 架构",
      },
    },
  },
  {
    key: "openclaw",
    slug: "openclaw",
    type: "docs",
    sources: {
      ko: "site/content/ko/openclaw.md",
      en: "docs/openclaw.md",
      jp: "site/content/jp/openclaw.md",
      cn: "site/content/cn/openclaw.md",
    },
    translations: {
      ko: {
        title: "kmsg와 OpenClaw·MCP 클라이언트 연결하기",
        description:
          "네이티브 kmsg MCP 서버, 실시간 감시, 승인 중심 전송 흐름을 구성합니다.",
        eyebrow: "문서 · MCP & OpenClaw",
      },
      en: {
        title: "Connect kmsg to OpenClaw and MCP clients",
        description:
          "Configure the native kmsg MCP server and real-time watch mode for OpenClaw and other AI agent clients.",
        eyebrow: "Documentation · MCP & OpenClaw",
      },
      jp: {
        title: "kmsgをOpenClawとMCPクライアントへ接続",
        description:
          "ネイティブMCPサーバー、リアルタイム監視、承認付き送信フローを構成します。",
        eyebrow: "ドキュメント · MCP & OpenClaw",
      },
      cn: {
        title: "将kmsg接入OpenClaw与MCP客户端",
        description:
          "配置原生MCP服务器、实时监控和带审批的发送流程。",
        eyebrow: "文档 · MCP & OpenClaw",
      },
    },
  },
  {
    key: "versioning",
    slug: "versioning",
    type: "docs",
    sources: {
      ko: "site/content/ko/versioning.md",
      en: "VERSIONING.md",
      jp: "site/content/jp/versioning.md",
      cn: "site/content/cn/versioning.md",
    },
    translations: {
      ko: {
        title: "kmsg 버전 관리와 릴리스 자동화",
        description:
          "날짜 기반 버전 형식, 기준 파일, 릴리스 명령, 호환성 규칙을 설명합니다.",
        eyebrow: "문서 · 버전 관리",
      },
      en: {
        title: "kmsg Versioning and release automation",
        description:
          "Understand the date-based kmsg version format, source of truth, release commands, and compatibility rules.",
        eyebrow: "Documentation · Versioning",
      },
      jp: {
        title: "kmsgのバージョン管理とリリース自動化",
        description:
          "日付ベースの形式、正式な値、リリースコマンド、互換性を説明します。",
        eyebrow: "ドキュメント · バージョン管理",
      },
      cn: {
        title: "kmsg版本管理与发布自动化",
        description:
          "介绍日期版本格式、唯一来源、发布命令和兼容性规则。",
        eyebrow: "文档 · 版本管理",
      },
    },
  },
];

const routePathFor = (localeId, slug) => {
  const parts = [locales[localeId].prefix, slug].filter(Boolean);
  return parts.length > 0 ? `${parts.join("/")}/` : "";
};

const pages = pageDefinitions.flatMap((definition) =>
  localeOrder.map((localeId) => {
    const locale = locales[localeId];
    const path = routePathFor(localeId, definition.slug);
    return {
      ...definition.translations[localeId],
      pageKey: definition.key,
      source: definition.sources[localeId],
      canonicalSource: definition.sources.en,
      output: path ? `${path}index.html` : "index.html",
      path,
      lang: locale.lang,
      locale: localeId,
      localeConfig: locale,
      type: definition.type,
    };
  }),
);

const pageByLocaleAndKey = new Map(
  pages.map((page) => [`${page.locale}:${page.pageKey}`, page]),
);

const localizedPage = (localeId, pageKey) =>
  pageByLocaleAndKey.get(`${localeId}:${pageKey}`);

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

const gitLastModified = (...sources) => {
  for (const source of sources) {
    try {
      const modified = execFileSync(
        "git",
        ["log", "-1", "--format=%cI", "--", source],
        { cwd: repoDir, encoding: "utf8" },
      ).trim();
      if (modified) return modified;
    } catch {
      // Try the canonical source before falling back to the Unix epoch.
    }
  }
  return new Date(0).toISOString();
};

const markdownPageKey = (rawPath) => {
  const normalized = rawPath.replaceAll("\\", "/").replace(/^(\.\.\/)+/, "");
  const basename = posix.basename(normalized).toLowerCase();
  if (["readme.md", "readme.en.md", "home.md"].includes(basename)) {
    return "home";
  }
  if (["usage.md", "usage"].includes(basename)) return "usage";
  if (["architecture.md", "architecture"].includes(basename)) {
    return "architecture";
  }
  if (["openclaw.md", "openclaw"].includes(basename)) return "openclaw";
  if (["versioning.md", "versioning"].includes(basename)) return "versioning";
  return null;
};

const localizedAnchor = (anchor, localeId) => {
  const anchors = {
    installation: {
      ko: "설치",
      en: "installation",
      jp: "インストール",
      cn: "安装",
    },
    "accessibility-instead-of-a-private-protocol": {
      ko: "비공개-프로토콜-대신-손쉬운-사용-api",
      en: "accessibility-instead-of-a-private-protocol",
      jp: "非公開プロトコルを使わない",
      cn: "不使用私有协议",
    },
  };
  return anchors[anchor]?.[localeId] ?? anchor;
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
  const targetPageKey = markdownPageKey(rawPath);
  const targetPage = targetPageKey
    ? localizedPage(page.locale, targetPageKey)
    : null;
  const suffix = anchor
    ? `#${localizedAnchor(anchor, page.locale)}`
    : "";

  if (targetPage) {
    return `${relativeAsset(page.output, targetPage.output)}${suffix}`;
  }

  const sourceRelativePath = posix.normalize(
    posix.join(posix.dirname(page.source), rawPath),
  );

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
    `<div class="media-frame"><video src="${relativeAsset(page.output, "assets/demo1.mp4")}" controls preload="metadata" playsinline aria-label="${escapeHtml(page.previewLabel ?? "kmsg command line demo")}"><track kind="captions" srclang="en" label="English" src="${relativeAsset(page.output, "assets/demo-captions.vtt")}" default></video></div>`,
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

  const tableLabel = page.localeConfig.ui.table;
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

const extractIntro = (markdown) => {
  const paragraphs = markdown
    .replace(/^# .+$/m, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const candidate = paragraphs.find((paragraph) =>
    /^`kmsg`(?:는|은| is|は|是一)/.test(paragraph),
  );

  return candidate ? stripMarkdown(candidate) : "";
};

const extractFaqs = (markdown, page) => {
  if (!page.faqHeading) return [];
  const sectionTitle = `## ${page.faqHeading ?? ""}`;
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

  const { ui } = page.localeConfig;
  const label = ui.toc;
  return `
    <aside class="toc" aria-label="${label}">
      <p class="toc-label">${label}</p>
      <ol>${items}</ol>
      <a class="toc-source" href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">
        ${ui.source}
        <span aria-hidden="true">↗</span>
      </a>
    </aside>`;
};

const renderHeader = (page) => {
  const { ui } = page.localeConfig;
  const rootLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "home").output,
  );
  const usageLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );
  const architectureLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "architecture").output,
  );
  const openClawLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "openclaw").output,
  );
  const llmLink = relativeAsset(page.output, "llm.txt");
  const languageOptions = localeOrder
    .map((localeId) => {
      const locale = locales[localeId];
      const target = localizedPage(localeId, page.pageKey);
      return `<option value="${relativeAsset(page.output, target.output)}" data-locale="${localeId}"${localeId === page.locale ? " selected" : ""}>${locale.label} · ${locale.name}</option>`;
    })
    .join("");

  return `
    <header class="site-header" data-header>
      <div class="header-inner">
        <a class="brand" href="${rootLink}" aria-label="kmsg home">
          <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="36" height="36">
          <span>kmsg</span>
          <span class="brand-status" aria-label="project status: online"></span>
        </a>
        <nav class="primary-nav" aria-label="${ui.navigation}">
          <a href="${usageLink}">${ui.usage}</a>
          <a href="${architectureLink}">${ui.architecture}</a>
          <a href="${openClawLink}">MCP</a>
          <a href="${site.repositoryUrl}" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </nav>
        <div class="header-tools">
          <a class="llm-link" href="${llmLink}" type="text/plain">LLM.txt <span aria-hidden="true">↗</span></a>
          <label class="language-control">
            <span class="sr-only">${ui.language}</span>
            <select aria-label="${ui.language}" data-language-select>
              ${languageOptions}
            </select>
            <span class="language-chevron" aria-hidden="true">⌄</span>
          </label>
          <button class="theme-toggle" type="button" aria-label="${ui.lightTheme}" data-theme-toggle data-light-label="${ui.lightTheme}" data-dark-label="${ui.darkTheme}">
            <span class="theme-toggle-track"><span class="theme-toggle-thumb"></span></span>
          </button>
        </div>
      </div>
    </header>`;
};

const renderHomeHero = (page, intro, version) => {
  const installationId = slugify(page.installAnchor);
  const docsLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );
  const copiedLabel = page.localeConfig.ui.copied;

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
        <button class="install-command copy-control" type="button" data-copy="brew install channprj/tap/kmsg" data-copied-label="${copiedLabel}" data-copy-failed-label="${page.localeConfig.ui.copyFailed}">
          <span class="prompt" aria-hidden="true">$</span>
          <code>brew install channprj/tap/kmsg</code>
          <span class="copy-icon" aria-hidden="true">⧉</span>
        </button>
      </div>

      <div class="hero-visual" role="img" aria-label="${escapeHtml(page.previewLabel)}">
        <div class="terminal-window">
          <div class="terminal-bar">
            <div class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></div>
            <span>kmsg · zsh</span>
            <span class="terminal-version">v${escapeHtml(version)}</span>
          </div>
          <div class="terminal-body" aria-hidden="true">
            <p><span class="terminal-prompt">~</span> <span class="terminal-command">kmsg read "${escapeHtml(page.chatName)}" --limit 2</span></p>
            <div class="json-output">
              <p><span class="syntax-brace">{</span></p>
              <p><span class="syntax-key">"chat"</span>: <span class="syntax-string">"${escapeHtml(page.chatName)}"</span>,</p>
              <p><span class="syntax-key">"messages"</span>: <span class="syntax-brace">[</span></p>
              <p class="indent"><span class="syntax-brace">{</span> <span class="syntax-key">"sender"</span>: <span class="syntax-string">"${escapeHtml(page.firstSender)}"</span>,</p>
              <p class="indent-2"><span class="syntax-key">"text"</span>: <span class="syntax-string">"${escapeHtml(page.firstMessage)}"</span> <span class="syntax-brace">}</span>,</p>
              <p class="indent"><span class="syntax-brace">{</span> <span class="syntax-key">"sender"</span>: <span class="syntax-string">"${escapeHtml(page.secondSender)}"</span>,</p>
              <p class="indent-2"><span class="syntax-key">"text"</span>: <span class="syntax-string">"${escapeHtml(page.secondMessage)}"</span> <span class="syntax-brace">}</span></p>
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

      <ul class="hero-signals" aria-label="${escapeHtml(page.highlightsLabel)}">
        <li><span>Swift</span><strong>6</strong></li>
        <li><span>MCP</span><strong>3 tools</strong></li>
        <li><span>Output</span><strong>JSON</strong></li>
        <li><span>Runtime</span><strong>Local AX API</strong></li>
      </ul>
    </section>`;
};

const renderDocsHero = (page, markdown, lastModified) => {
  const sourceTitle = markdown.match(/^#\s+(.+)$/m)?.[1] ?? page.title;
  const dateLabel = new Intl.DateTimeFormat(page.localeConfig.dateLocale, {
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
        <span>${page.localeConfig.ui.pipeline}</span>
        <span>${page.localeConfig.ui.updated} ${escapeHtml(dateLabel)}</span>
        <a href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">${page.localeConfig.ui.edit}</a>
      </div>
    </section>`;
};

const renderFooter = (page, version) => {
  const architectureLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "architecture").output,
  );
  const versioningLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "versioning").output,
  );

  return `
    <footer class="site-footer">
      <div class="footer-brand">
        <img src="${relativeAsset(page.output, site.imagePath)}" alt="" width="56" height="56">
        <div><strong>kmsg</strong><span>${page.localeConfig.ui.footerTagline}</span></div>
      </div>
      <div class="footer-links">
        <a href="${architectureLink}">${page.localeConfig.ui.architecture}</a>
        <a href="${versioningLink}">v${escapeHtml(version)}</a>
        <a href="${site.licenseUrl}" target="_blank" rel="noopener noreferrer">MIT License</a>
      </div>
      <p>${page.localeConfig.ui.footerDisclaimer}</p>
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
      inLanguage: localeOrder.map((localeId) => locales[localeId].lang),
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
  const alternateLinks = localeOrder
    .map((localeId) => {
      const locale = locales[localeId];
      const target = localizedPage(localeId, page.pageKey);
      return `<link rel="alternate" hreflang="${locale.hrefLang}" href="${pageUrl(target.path)}">`;
    })
    .join("\n    ");
  const xDefault = pageUrl(localizedPage("ko", page.pageKey).path);
  const localeTargets = Object.fromEntries(
    localeOrder.map((localeId) => [
      localeId,
      pageUrl(localizedPage(localeId, page.pageKey).path),
    ]),
  );
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
<html lang="${page.lang}" data-locale="${page.locale}" data-page-key="${page.pageKey}" data-theme="dark">
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
    ${alternateLinks}
    <link rel="alternate" hreflang="x-default" href="${xDefault}">
    <link rel="alternate" type="text/markdown" href="${site.repositoryUrl}/raw/main/${page.source}" title="${escapeHtml(page.source)}">
    <link rel="alternate" type="text/plain" href="${pageUrl("llm.txt")}" title="LLM-readable site index">
    <link rel="manifest" href="${rootAsset("site.webmanifest")}">
    <link rel="icon" href="${rootAsset("assets/favicon.svg")}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&family=Ubuntu+Mono:wght@400;700&family=Ubuntu+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${rootAsset("assets/styles.css")}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="kmsg">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${pageUrl(site.imagePath)}">
    <meta property="og:image:alt" content="kmsg KakaoTalk CLI logo">
    <meta property="og:locale" content="${page.localeConfig.ogLocale}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${pageUrl(site.imagePath)}">

    <script type="application/ld+json">${structuredData}</script>
    <script>
      try {
        const savedTheme = localStorage.getItem("kmsg-theme");
        if (savedTheme) document.documentElement.dataset.theme = savedTheme;
        const currentLocale = ${JSON.stringify(page.locale)};
        const savedLocale = localStorage.getItem("kmsg-locale");
        const localeTargets = ${JSON.stringify(localeTargets).replaceAll("<", "\\u003c")};
        if (
          currentLocale === "ko" &&
          savedLocale &&
          savedLocale !== "ko" &&
          localeTargets[savedLocale]
        ) {
          location.replace(localeTargets[savedLocale] + location.hash);
        } else {
          localStorage.setItem("kmsg-locale", currentLocale);
        }
      } catch {}
    </script>
  </head>
  <body data-source="${escapeHtml(page.source)}" data-locale="${page.locale}" data-copy-label="${page.localeConfig.ui.copy}" data-copied-label="${page.localeConfig.ui.copied}" data-copy-failed-label="${page.localeConfig.ui.copyFailed}">
    <a class="skip-link" href="#content">${page.localeConfig.ui.skip}</a>
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
              <a href="${site.repositoryUrl}/blob/main/${page.source}" target="_blank" rel="noopener noreferrer">${page.localeConfig.ui.sourceAction}</a>
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
- [Japanese documentation](${pageUrl("jp/")}): 日本語の概要、インストール、コマンド、MCPガイド
- [Simplified Chinese documentation](${pageUrl("cn/")}): 简体中文概览、安装、命令和MCP指南
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
        intro: extractIntro(markdown),
        faqs: extractFaqs(markdown, page),
        lastModified: gitLastModified(page.source, page.canonicalSource),
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
  for (const pageKey of ["usage", "architecture", "openclaw", "versioning"]) {
    const koreanPage = localizedPage("ko", pageKey);
    const legacyOutput = join(outputDir, "ko", koreanPage.output);
    await mkdir(dirname(legacyOutput), { recursive: true });
    await writeFile(
      legacyOutput,
      buildRedirect(pageUrl(koreanPage.path)),
      "utf8",
    );
  }

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
