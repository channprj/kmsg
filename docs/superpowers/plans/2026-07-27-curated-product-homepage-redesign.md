# Curated Product Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the README-shaped KMSG homepage with a concise, localized product landing page modeled on Markdowner's information rhythm and verified on desktop and mobile.

**Architecture:** Keep the Node static-site generator and shared assets. Add explicit localized product-page data and a dedicated home renderer in `site/build.mjs`, while documentation routes continue through the existing Markdown renderer and table-of-contents layout. Rebuild the home visual system in the shared stylesheet, retain progressive theme/locale/copy/terminal behavior, and enforce the separation with generated-HTML tests.

**Tech Stack:** Node.js 22, ECMAScript modules, Marked, sanitize-html, semantic HTML, modern CSS, vanilla JavaScript, Node test runner, agent-browser, GitHub Pages.

---

## Execution constraints

- Work directly on synchronized `main` because the user explicitly requested
  realtime verified commits on the current branch.
- Follow `git-commit-push-realtime`: explicit staging, Conventional Commits,
  ordinary pushes only, and `0 0` upstream parity after every checkpoint.
- Execute sequentially in the main thread because this repository's
  `AGENTS.md` maps subagent dispatch to main-thread execution.
- Preserve all CLI, MCP, documentation, release, and README behavior.

## File map

- `site/build.mjs` — localized product-page content, compact home header
  variant, curated home sections, shared terminal transcript, and home/docs
  render branching.
- `site/src/styles.css` — readable font stacks, capsule home header, centered
  hero, product workflow, principle cards, alternating capability sections,
  story cards, install close, themes, and responsive behavior.
- `site/src/app.js` — existing theme, locale, copy, and terminal replay
  enhancement; only selectors or replay timing change if required by the new
  markup.
- `site/test/build.test.mjs` — generated-home contract, removal of README
  layout from home routes, preserved documentation contract, responsive CSS
  safeguards, and existing discovery/metadata coverage.
- `docs/superpowers/specs/2026-07-27-curated-product-homepage-redesign-design.md`
  — approved requirements; read-only implementation authority.

### Task 1: Lock the curated homepage contract with failing tests

**Files:**
- Modify: `site/test/build.test.mjs`

- [ ] **Step 1: Replace old hero-copy expectations with factual localized headlines**

Update the canonical and locale tests to use these exact headlines:

```js
const homeHeadlines = {
  ko: "카카오톡을 터미널에서 읽고, 감시하고, 보냅니다.",
  en: "Read, watch, and send KakaoTalk messages from your terminal.",
  jp: "KakaoTalkをターミナルから読み取り、監視、送信。",
  cn: "在终端中读取、监控和发送KakaoTalk消息。",
};
```

The Korean canonical test must match `homeHeadlines.ko` instead of
`AI Native 하게 활용하기.`. The four-locale test must match the corresponding
headline and continue asserting one `h1`.

- [ ] **Step 2: Add a generated-HTML test for the dedicated product structure**

Add this test after the locale rendering test:

```js
test("home routes render the curated product page instead of README layout", async () => {
  const sectionIds = [
    "workflow",
    "principles",
    "capabilities",
    "stories",
    "install",
  ];

  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(html, /<body class="is-home"/);
    assert.match(html, /<div class="product-home" data-product-home>/);
    for (const id of sectionIds) {
      assert.match(html, new RegExp(`<section[^>]+id="${id}"`));
    }
    assert.doesNotMatch(html, /class="content-layout"/);
    assert.doesNotMatch(html, /class="toc"/);
    assert.doesNotMatch(html, /data-markdown-content/);
    assert.doesNotMatch(
      html,
      /AI Native|AI-native way|AIネイティブ|AI原生方式/,
    );
  }
});
```

- [ ] **Step 3: Add content, header, and installation assertions**

Add a second contract test:

```js
test("curated home keeps product proof, stories, and install actions", async () => {
  for (const localeId of Object.keys(locales)) {
    const html = await readOutput(localizedPath(localeId, "home"));

    assert.match(html, /data-home-header/);
    assert.match(html, /kmsg chats --limit 2/);
    assert.match(html, /kmsg read &quot;/);
    assert.match(html, /kmsg send &quot;/);
    assert.match(html, /kmsg watch --json/);
    assert.equal(
      (html.match(/<article class="principle-card">/g) || []).length,
      3,
    );
    assert.equal(
      (html.match(/<article class="capability-row/g) || []).length,
      3,
    );
    assert.equal(
      (html.match(/<article class="story-card">/g) || []).length,
      2,
    );
    assert.match(html, /brew install channprj\/tap\/kmsg/);
    assert.match(html, /github\.com\/channprj\/kmsg\/releases/);
  }
});
```

- [ ] **Step 4: Preserve the documentation-layout contract explicitly**

Add:

```js
test("documentation routes retain Markdown content and table of contents", async () => {
  for (const localeId of Object.keys(locales)) {
    for (const pageKey of ["usage", "architecture", "openclaw", "versioning"]) {
      const html = await readOutput(localizedPath(localeId, pageKey));
      assert.match(html, /<body class="is-docs"/);
      assert.match(html, /class="content-layout"/);
      assert.match(html, /class="toc"/);
      assert.match(html, /data-markdown-content/);
    }
  }
});
```

- [ ] **Step 5: Replace superseded visual assertions**

Update the existing font test to assert the new readable stacks:

```js
test("IBM Plex and locale fonts keep prose readable and code distinct", async () => {
  const [root, styles] = await Promise.all([
    readOutput("index.html"),
    readOutput("assets/styles.css"),
  ]);
  assert.match(root, /family=IBM\+Plex\+Sans/);
  assert.match(root, /family=IBM\+Plex\+Sans\+KR/);
  assert.match(root, /family=IBM\+Plex\+Mono/);
  assert.match(styles, /--body:\s*"IBM Plex Sans"/);
  assert.match(styles, /--mono:\s*"IBM Plex Mono"/);
  assert.match(
    styles,
    /html\[lang="ko"\]\s*{[\s\S]*--body:\s*"IBM Plex Sans KR"/,
  );
  assert.match(styles, /body\s*{[\s\S]*word-break:\s*keep-all/);
});
```

In the terminal CSS test, replace the old `.hero > *` assertion with:

```js
assert.match(
  styles,
  /\.workflow-frame\s*{[\s\S]*min-width:\s*0/,
);
```

Update the shared-shell test so machine-readable navigation remains explicit
without forcing it into the compact home header:

```js
const isHome = /<body class="is-home"/.test(html);
if (isHome) {
  assert.match(
    html,
    /class="footer-llm-link"[^>]+href="[^"]*llm\.txt"/,
  );
} else {
  assert.match(html, /class="llm-link"[^>]+href="[^"]*llm\.txt"/);
}
```

Rename the Korean story test and replace its obsolete demo/anchor assertions:

```js
test("Korean homepage retains both real-world stories and install target", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /실사용 후기/);
  assert.match(html, /_Pd1G33_R48\/maxresdefault\.jpg/);
  assert.match(html, /xz5fA7OyvQ0\/maxresdefault\.jpg/);
  assert.equal((html.match(/<article class="story-card">/g) || []).length, 2);
  assert.match(html, /href="#install"/);
  assert.match(html, /id="install"/);
  assert.doesNotMatch(html, /<track kind="captions"/);
});
```

- [ ] **Step 6: Run the site tests and confirm the contract fails**

Run:

```bash
cd site && npm test
```

Expected: FAIL on the new factual headline, `is-home`, `data-product-home`, and
section assertions because the current build still emits the old hero plus
README layout.

### Task 2: Build the dedicated localized product homepage

**Files:**
- Modify: `site/build.mjs`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Add explicit locale copy with a shared content shape**

Add a `homeContent` map near the existing locale metadata. Every locale must
define the same keys:

```js
const homeContent = {
  ko: {
    kicker: "macOS용 KakaoTalk CLI · MCP 서버",
    headline: "카카오톡을 터미널에서 읽고, 감시하고, 보냅니다.",
    description:
      "macOS 손쉬운 사용 API로 동작하는 비공식 CLI입니다. 로컬 자동화와 MCP 클라이언트에서 같은 명령을 사용합니다.",
    installAction: "설치하기",
    docsAction: "사용법",
    currentVersion: "현재 버전",
    workflowLabel: "실제 CLI 흐름",
    principlesLabel: "왜 kmsg인가",
    principlesTitle: "로컬 자동화에 필요한 것만 담았습니다.",
    capabilitiesLabel: "주요 기능",
    capabilitiesTitle: "읽기부터 전송까지 하나의 명령 체계로.",
    storiesLabel: "실사용 후기",
    storiesTitle: "실제 자동화 워크플로에서 사용되고 있습니다.",
    storiesDescription:
      "KMSG를 에이전트와 로컬 자동화에 연결한 사용 사례입니다.",
    installLabel: "설치",
    installTitle: "Homebrew로 바로 시작하세요.",
    installDescription:
      "macOS 13 이상, macOS용 KakaoTalk, 손쉬운 사용 권한이 필요합니다.",
    releaseAction: "최신 릴리즈",
    disclaimer:
      "Kakao Corp.와 무관한 독립 오픈소스 프로젝트입니다.",
  },
  en: {
    kicker: "KakaoTalk CLI · MCP server for macOS",
    headline: "Read, watch, and send KakaoTalk messages from your terminal.",
    description:
      "An unofficial CLI built on the macOS Accessibility API. Use the same commands in local automation and MCP clients.",
    installAction: "Install",
    docsAction: "Usage",
    currentVersion: "Current version",
    workflowLabel: "Real CLI workflow",
    principlesLabel: "Why kmsg",
    principlesTitle: "Only what local automation needs.",
    capabilitiesLabel: "Core capabilities",
    capabilitiesTitle: "One command model from reading to sending.",
    storiesLabel: "In use",
    storiesTitle: "Used in real automation workflows.",
    storiesDescription:
      "Examples of KMSG connected to agents and local automation.",
    installLabel: "Install",
    installTitle: "Start with Homebrew.",
    installDescription:
      "Requires macOS 13+, KakaoTalk for macOS, and Accessibility permission.",
    releaseAction: "Latest release",
    disclaimer:
      "Independent open source. Not affiliated with Kakao Corp.",
  },
  jp: {
    kicker: "macOS向けKakaoTalk CLI · MCPサーバー",
    headline: "KakaoTalkをターミナルから読み取り、監視、送信。",
    description:
      "macOSアクセシビリティAPIで動作する非公式CLIです。ローカル自動化とMCPクライアントで同じコマンドを利用できます。",
    installAction: "インストール",
    docsAction: "使い方",
    currentVersion: "現在のバージョン",
    workflowLabel: "実際のCLIフロー",
    principlesLabel: "kmsgを選ぶ理由",
    principlesTitle: "ローカル自動化に必要な機能だけ。",
    capabilitiesLabel: "主な機能",
    capabilitiesTitle: "読み取りから送信まで一つのコマンド体系で。",
    storiesLabel: "活用事例",
    storiesTitle: "実際の自動化ワークフローで使われています。",
    storiesDescription:
      "KMSGをエージェントとローカル自動化に接続した事例です。",
    installLabel: "インストール",
    installTitle: "Homebrewですぐに開始。",
    installDescription:
      "macOS 13以降、macOS版KakaoTalk、アクセシビリティ権限が必要です。",
    releaseAction: "最新リリース",
    disclaimer:
      "Kakao Corp.とは無関係の独立したオープンソースです。",
  },
  cn: {
    kicker: "面向macOS的KakaoTalk CLI · MCP服务器",
    headline: "在终端中读取、监控和发送KakaoTalk消息。",
    description:
      "基于macOS辅助功能API的非官方CLI。在本地自动化和MCP客户端中使用同一套命令。",
    installAction: "安装",
    docsAction: "使用指南",
    currentVersion: "当前版本",
    workflowLabel: "真实CLI流程",
    principlesLabel: "为什么选择kmsg",
    principlesTitle: "只保留本地自动化所需的功能。",
    capabilitiesLabel: "核心功能",
    capabilitiesTitle: "从读取到发送，使用同一套命令体系。",
    storiesLabel: "实际案例",
    storiesTitle: "已用于真实的自动化工作流。",
    storiesDescription:
      "KMSG连接智能体与本地自动化的实际案例。",
    installLabel: "安装",
    installTitle: "使用Homebrew立即开始。",
    installDescription:
      "需要macOS 13或更高版本、macOS版KakaoTalk和辅助功能权限。",
    releaseAction: "最新版本",
    disclaimer:
      "独立开源项目，与Kakao Corp.无隶属关系。",
  },
};
```

Add these localized principle and capability arrays. The three-item order is a
rendering contract:

```js
const homeDetails = {
  ko: {
    principles: [
      {
        token: "AX",
        title: "macOS에서 로컬로",
        description:
          "화면에 표시되는 KakaoTalk을 손쉬운 사용 API로 제어합니다.",
      },
      {
        token: "MCP",
        title: "CLI와 네이티브 MCP",
        description:
          "터미널, 스크립트, MCP 클라이언트에서 같은 기능을 사용합니다.",
      },
      {
        token: "{}",
        title: "구조화된 출력",
        description:
          "JSON과 텍스트 출력은 stdout으로, AX 진단은 stderr로 분리합니다.",
      },
    ],
    capabilities: [
      {
        title: "메시지 읽기",
        description:
          "채팅을 찾고 재사용 가능한 chat_id와 최근 메시지를 가져옵니다.",
        points: ["채팅 목록 조회", "최근 메시지", "background-safe 읽기"],
        command: 'kmsg read "AI 프로젝트" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "새 메시지 감시",
        description:
          "KakaoTalk 창을 방해하지 않으면서 새 메시지를 연속으로 확인합니다.",
        points: ["실시간 이벤트", "JSON 스트림", "복구 모드"],
        command: "kmsg watch --json --background-safe",
        output: '{"event":"message","author":"지나","body":"확인해줘."}',
      },
      {
        title: "안전하게 전송",
        description:
          "실제 UI를 통해 텍스트와 이미지를 보내며 dry-run으로 먼저 검증합니다.",
        points: ["텍스트 전송", "이미지 전송", "dry-run 확인"],
        command: 'kmsg send "AI 프로젝트" "확인했어요." --dry-run',
        output: 'Would send to "AI 프로젝트": 확인했어요.',
      },
    ],
  },
  en: {
    principles: [
      {
        token: "AX",
        title: "Local on macOS",
        description:
          "Controls the visible KakaoTalk app through the Accessibility API.",
      },
      {
        token: "MCP",
        title: "CLI and native MCP",
        description:
          "Use the same capabilities from terminals, scripts, and MCP clients.",
      },
      {
        token: "{}",
        title: "Structured output",
        description:
          "JSON and text go to stdout while AX diagnostics stay on stderr.",
      },
    ],
    capabilities: [
      {
        title: "Read messages",
        description:
          "Find chats and return stable chat IDs with recent messages.",
        points: ["Chat discovery", "Recent messages", "Background-safe reads"],
        command: 'kmsg read "AI Project" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "Watch new messages",
        description:
          "Stream new messages without taking over the active KakaoTalk window.",
        points: ["Live events", "JSON stream", "Recovery mode"],
        command: "kmsg watch --json --background-safe",
        output: '{"event":"message","author":"Jina","body":"Please check."}',
      },
      {
        title: "Send safely",
        description:
          "Send text and images through the visible UI, with dry-run first.",
        points: ["Text", "Images", "Dry-run confirmation"],
        command: 'kmsg send "AI Project" "Checked." --dry-run',
        output: 'Would send to "AI Project": Checked.',
      },
    ],
  },
  jp: {
    principles: [
      {
        token: "AX",
        title: "macOS上でローカル動作",
        description:
          "表示中のKakaoTalkをアクセシビリティAPIで操作します。",
      },
      {
        token: "MCP",
        title: "CLIとネイティブMCP",
        description:
          "ターミナル、スクリプト、MCPクライアントで同じ機能を使えます。",
      },
      {
        token: "{}",
        title: "構造化出力",
        description:
          "JSONとテキストはstdoutへ、AX診断はstderrへ分離します。",
      },
    ],
    capabilities: [
      {
        title: "メッセージを読む",
        description:
          "チャットを検索し、再利用可能なchat_idと最近のメッセージを取得します。",
        points: ["チャット検索", "最近のメッセージ", "安全なバックグラウンド読み取り"],
        command: 'kmsg read "AIプロジェクト" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "新着を監視",
        description:
          "使用中のKakaoTalkウィンドウを妨げず、新着を継続的に確認します。",
        points: ["リアルタイムイベント", "JSONストリーム", "復旧モード"],
        command: "kmsg watch --json --background-safe",
        output: '{"event":"message","author":"ジナ","body":"確認して。"}',
      },
      {
        title: "安全に送信",
        description:
          "表示中のUIからテキストと画像を送り、dry-runで事前確認できます。",
        points: ["テキスト", "画像", "dry-run確認"],
        command: 'kmsg send "AIプロジェクト" "確認しました。" --dry-run',
        output: 'Would send to "AIプロジェクト": 確認しました。',
      },
    ],
  },
  cn: {
    principles: [
      {
        token: "AX",
        title: "在macOS本地运行",
        description:
          "通过辅助功能API控制屏幕上可见的KakaoTalk应用。",
      },
      {
        token: "MCP",
        title: "CLI与原生MCP",
        description:
          "在终端、脚本和MCP客户端中使用相同功能。",
      },
      {
        token: "{}",
        title: "结构化输出",
        description:
          "JSON和文本写入stdout，AX诊断信息保留在stderr。",
      },
    ],
    capabilities: [
      {
        title: "读取消息",
        description:
          "查找聊天并返回可复用的chat_id与最近消息。",
        points: ["聊天查找", "最近消息", "安全后台读取"],
        command: 'kmsg read "AI项目" --limit 20 --json',
        output: '{"chat_id":"chat_7f42c5e1d9ab","messages":[...]}',
      },
      {
        title: "监控新消息",
        description:
          "不干扰正在使用的KakaoTalk窗口，持续获取新消息。",
        points: ["实时事件", "JSON流", "恢复模式"],
        command: "kmsg watch --json --background-safe",
        output: '{"event":"message","author":"Jina","body":"请确认。"}',
      },
      {
        title: "安全发送",
        description:
          "通过可见界面发送文本和图片，并先用dry-run确认。",
        points: ["文本", "图片", "dry-run确认"],
        command: 'kmsg send "AI项目" "已确认。" --dry-run',
        output: 'Would send to "AI项目": 已确认。',
      },
    ],
  },
};

const homeStories = [
  {
    publisher: "Builder Josh",
    title:
      "헤르메스 에이전트 5개로 뉴스 큐레이션부터 주식 매매까지 자동화한 방법",
    href: "https://www.youtube.com/watch?v=_Pd1G33_R48&t=1020s",
    image:
      "https://i.ytimg.com/vi/_Pd1G33_R48/maxresdefault.jpg",
  },
  {
    publisher: "Sam Hottman",
    title: "나만의 Hermes 시스템 구축 방법",
    href: "https://www.youtube.com/watch?v=xz5fA7OyvQ0",
    image:
      "https://i.ytimg.com/vi/xz5fA7OyvQ0/maxresdefault.jpg",
  },
];
```

Merge these arrays into the locale copy before rendering:

```js
const copy = {
  ...homeContent[page.locale],
  ...homeDetails[page.locale],
};
```

- [ ] **Step 2: Create focused render helpers**

Extract the complete terminal markup currently returned inside
`renderHomeHero` into `renderWorkflowTerminal(page, version)`. Preserve every
`data-replay-*` attribute, localized chat value, `terminalCopy` value, command,
output line, and final cursor. The extracted function returns the
`<div class="terminal-window" data-terminal-replay>…</div>` root; the new
`renderHomeWorkflow` owns the surrounding section and frame.

Keep the existing terminal line helpers and add:

```js
const renderSectionHeading = (label, title, description = "") => `
  <header class="section-heading">
    <p class="section-label">${escapeHtml(label)}</p>
    <h2>${escapeHtml(title)}</h2>
    ${description ? `<p>${escapeHtml(description)}</p>` : ""}
  </header>`;

const renderCommandPanel = (command, output) => `
  <div class="command-panel" tabindex="0" aria-label="${escapeHtml(command)}">
    <div class="command-panel-bar" aria-hidden="true">
      <i></i><i></i><i></i>
    </div>
    <pre><code><span class="command-prompt">$</span> ${escapeHtml(command)}

${escapeHtml(output)}</code></pre>
  </div>`;

const renderMarkdownArticle = (page, rendered) => `
  <article class="markdown-body" data-markdown-content>
    <div class="source-stamp">
      <span class="source-dot"></span>
      ${escapeHtml(page.sourceLabel ?? page.source)}
      <a href="${site.repositoryUrl}/blob/main/${page.source}"
        target="_blank" rel="noopener noreferrer">
        ${page.localeConfig.ui.sourceAction}
      </a>
    </div>
    ${rendered.html}
  </article>`;

const renderHomeWorkflow = (page, version) => {
  const terminal = renderWorkflowTerminal(page, version);
  return `
    <section class="product-workflow" id="workflow"
      aria-labelledby="workflow-title">
      <div class="workflow-label" id="workflow-title">
        ${escapeHtml(homeContent[page.locale].workflowLabel)}
      </div>
      <div class="workflow-frame">${terminal}</div>
    </section>`;
};

const renderPrinciples = (page, copy) => `
  <section class="product-section principles-section" id="principles">
    ${renderSectionHeading(copy.principlesLabel, copy.principlesTitle)}
    <div class="principle-grid">
      ${copy.principles.map((item) => `
        <article class="principle-card">
          <span class="principle-token" aria-hidden="true">${escapeHtml(item.token)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`).join("")}
    </div>
  </section>`;

const renderCapabilities = (page, copy) => `
  <section class="product-section capabilities-section" id="capabilities">
    ${renderSectionHeading(copy.capabilitiesLabel, copy.capabilitiesTitle)}
    <div class="capability-list">
      ${copy.capabilities.map((item, index) => `
        <article class="capability-row${index % 2 ? " is-reversed" : ""}">
          <div class="capability-copy">
            <span class="capability-index">0${index + 1}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
          </div>
          ${renderCommandPanel(item.command, item.output)}
        </article>`).join("")}
    </div>
  </section>`;

const renderHomeStories = (copy) => `
  <section class="product-section stories-section" id="stories">
    ${renderSectionHeading(
      copy.storiesLabel,
      copy.storiesTitle,
      copy.storiesDescription,
    )}
    <div class="story-grid">
      ${homeStories.map((story) => `
        <article class="story-card">
          <a class="story-media" href="${story.href}" target="_blank"
            rel="noopener noreferrer">
            <img src="${story.image}" alt="${escapeHtml(story.title)}"
              width="640" height="360" loading="lazy" decoding="async">
          </a>
          <div class="story-copy">
            <span>${escapeHtml(story.publisher)}</span>
            <h3><a href="${story.href}" target="_blank"
              rel="noopener noreferrer">${escapeHtml(story.title)}</a></h3>
            <span class="story-arrow" aria-hidden="true">↗</span>
          </div>
        </article>`).join("")}
    </div>
  </section>`;

const renderHomeInstall = (page, copy) => {
  const usageLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );
  return `
    <section class="product-section install-section" id="install">
      <div class="install-panel">
        <p class="section-label">${escapeHtml(copy.installLabel)}</p>
        <h2>${escapeHtml(copy.installTitle)}</h2>
        <p>${escapeHtml(copy.installDescription)}</p>
        <button class="install-command copy-control" type="button"
          data-copy="brew install channprj/tap/kmsg"
          data-copied-label="${page.localeConfig.ui.copied}"
          data-copy-failed-label="${page.localeConfig.ui.copyFailed}">
          <span class="prompt" aria-hidden="true">$</span>
          <code>brew install channprj/tap/kmsg</code>
          <span class="copy-icon" aria-hidden="true">⧉</span>
        </button>
        <div class="requirement-list" aria-label="${escapeHtml(copy.installDescription)}">
          <span>macOS 13+</span>
          <span>KakaoTalk for macOS</span>
          <span>Accessibility</span>
        </div>
        <div class="install-links">
          <a href="${usageLink}">${escapeHtml(copy.docsAction)} →</a>
          <a href="${site.releasesUrl}" target="_blank"
            rel="noopener noreferrer">${escapeHtml(copy.releaseAction)} ↗</a>
        </div>
        <small>${escapeHtml(copy.disclaimer)}</small>
      </div>
    </section>`;
};

const renderProductHome = (page, version) => {
  const copy = {
    ...homeContent[page.locale],
    ...homeDetails[page.locale],
  };
  const docsLink = relativeAsset(
    page.output,
    localizedPage(page.locale, "usage").output,
  );

  return `
    <section class="product-hero" aria-labelledby="hero-title">
      <div class="product-mark">
        <img src="${relativeAsset(page.output, site.imagePath)}" alt=""
          width="112" height="112">
      </div>
      <p class="hero-kicker">${escapeHtml(copy.kicker)}</p>
      <h1 id="hero-title">${escapeHtml(copy.headline)}</h1>
      <p class="hero-lead">${escapeHtml(copy.description)}</p>
      <div class="hero-actions">
        <a class="button button-primary" href="#install">
          ${escapeHtml(copy.installAction)}
        </a>
        <a class="hero-docs-link" href="${docsLink}">
          ${escapeHtml(copy.docsAction)} →
        </a>
      </div>
      <p class="hero-version">
        ${escapeHtml(copy.currentVersion)} <strong>v${escapeHtml(version)}</strong>
      </p>
    </section>
    ${renderHomeWorkflow(page, version)}
    ${renderPrinciples(page, copy)}
    ${renderCapabilities(page, copy)}
    ${renderHomeStories(copy)}
    ${renderHomeInstall(page, copy)}`;
};
```

- [ ] **Step 3: Render home and documentation through separate paths**

Change `renderDocument` to build the main content explicitly:

```js
const mainContent =
  page.type === "home"
    ? `<div class="product-home" data-product-home>
        ${renderProductHome(page, version)}
      </div>`
    : `${renderDocsHero(page, markdown, lastModified)}
      <div class="content-layout">
        ${renderToc(rendered.headings, page)}
        ${renderMarkdownArticle(page, rendered)}
      </div>`;
```

Set the body class without disturbing its existing data attributes:

```html
<body class="${page.type === "home" ? "is-home" : "is-docs"}"
  data-source="..." data-locale="..." ...>
```

`renderHeader(page)` must add `data-home-header` for home pages, show only Usage
and MCP in the home nav, move GitHub into the home tool group, and keep the
existing full documentation navigation on non-home pages. Extend
`renderFooter(page, version)` with a localized relative `llm.txt` link using
`class="footer-llm-link"` so the home header can stay compact without removing
the machine-readable resource.

- [ ] **Step 4: Run the focused build tests**

Run:

```bash
cd site && npm test
```

Expected: homepage structure and content tests advance to CSS-related failures
or pass; all existing locale, terminal, metadata, discovery, and docs tests
remain green.

### Task 3: Implement the restrained responsive visual system

**Files:**
- Modify: `site/src/styles.css`
- Modify only if markup requires it: `site/src/app.js`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Replace coding-font body copy and remove home decoration**

Use locale-appropriate sans stacks for UI and prose while retaining mono for
commands:

```css
:root {
  --display: "IBM Plex Sans", "Noto Sans JP", "Noto Sans SC", sans-serif;
  --body: "IBM Plex Sans", "Noto Sans JP", "Noto Sans SC", sans-serif;
  --mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
  --page: min(1120px, calc(100% - 48px));
}

html[lang="ko"] {
  --display: "IBM Plex Sans KR", "IBM Plex Sans", sans-serif;
  --body: "IBM Plex Sans KR", "IBM Plex Sans", sans-serif;
}

.is-home {
  background: var(--canvas);
}

.is-home .site-grid {
  display: none;
}
```

Update the generated Google Fonts URL to request IBM Plex Sans, IBM Plex Sans
KR, and IBM Plex Mono plus the existing Japanese and Chinese fallbacks.

- [ ] **Step 2: Implement the compact home header and centered hero**

Add home-scoped rules:

```css
.is-home .site-shell {
  border-inline: 0;
  background: var(--canvas);
  box-shadow: none;
}

.is-home .site-header {
  width: min(760px, calc(100% - 32px));
  margin: 18px auto 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--canvas-raised) 88%, transparent);
}

.is-home .header-inner {
  width: auto;
  min-height: 54px;
  padding: 0 10px 0 8px;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
}

.product-hero {
  width: var(--page);
  padding: 72px 0 56px;
  text-align: center;
}

.product-hero h1 {
  max-width: 900px;
  margin: 22px auto 0;
  font-size: clamp(44px, 6vw, 72px);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 1.08;
}

.product-hero .hero-lead {
  max-width: 690px;
  margin: 24px auto 0;
  font-size: 18px;
  line-height: 1.65;
}
```

Use a 104–120px product mark, a 48px primary action, a quiet Usage link, and
version metadata. Do not use gradient text, grid lines, scan beams, or viewport
height.

- [ ] **Step 3: Style product workflow, principles, capabilities, stories, and install**

Implement:

```css
.product-workflow,
.product-section {
  width: var(--page);
  margin: 0 auto;
}

.product-workflow {
  padding-bottom: 96px;
}

.workflow-frame {
  min-width: 0;
  max-width: 1040px;
  margin: 0 auto;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--canvas-raised);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.22);
}

.product-section {
  padding: 88px 0;
  border-top: 1px solid var(--line);
}

.principle-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.capability-row {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  align-items: center;
  gap: clamp(40px, 7vw, 96px);
}

.capability-row.is-reversed .capability-copy {
  order: 2;
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.install-panel {
  padding: clamp(32px, 6vw, 64px);
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--canvas-raised);
  text-align: center;
}
```

Keep all product prose between 50 and 72 characters per desktop line, reserve
story aspect ratios, and use Kakao yellow only for the primary action and small
state accents.

- [ ] **Step 4: Add deterministic tablet and mobile layouts**

Add:

```css
@media (max-width: 900px) {
  .is-home .primary-nav {
    display: none;
  }

  .capability-row,
  .capability-row.is-reversed {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .capability-row.is-reversed .capability-copy {
    order: initial;
  }
}

@media (max-width: 759px) {
  :root {
    --page: calc(100% - 32px);
  }

  .is-home .site-header {
    width: calc(100% - 24px);
    margin-top: 12px;
  }

  .product-hero {
    padding: 52px 0 44px;
  }

  .product-hero h1 {
    font-size: clamp(36px, 10.8vw, 48px);
    line-height: 1.14;
  }

  .principle-grid,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .product-section {
    padding: 60px 0;
  }

  .terminal-body {
    height: 310px;
  }
}

@media (max-width: 430px) {
  .is-home .language-control select {
    width: 76px;
  }

  .is-home .brand-status,
  .is-home .github-label {
    display: none;
  }
}
```

At 320px, preserve 44px controls and allow only command panels to scroll
horizontally. The document layout retains its existing responsive rules.

- [ ] **Step 5: Add CSS-contract tests**

Add assertions that styles contain the 1120px page cap, home header capsule,
three-column principle grid, one-column mobile grids, `overflow-x: auto` only
on code surfaces, and the reduced-motion block. Assert the old home grid/scan
animation is not used under `.is-home`.

- [ ] **Step 6: Run the full site suite and inspect the diff**

Run:

```bash
cd site && npm test
git diff --check
git diff --stat
```

Expected: all site tests pass; no whitespace errors; changes remain limited to
the four planned site files.

- [ ] **Step 7: Commit and push the working homepage**

Stage explicit paths:

```bash
git add site/build.mjs site/src/styles.css site/src/app.js site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): rebuild homepage around product workflows"
git push
git rev-list --left-right --count HEAD...@{u}
```

Expected parity: `0 0`.

### Task 4: Verify real desktop and mobile behavior

**Files:**
- Modify only if verification exposes a defect:
  `site/build.mjs`, `site/src/styles.css`, `site/src/app.js`,
  `site/test/build.test.mjs`

- [ ] **Step 1: Build and serve the generated site**

Run:

```bash
cd site && npm test
python3 -m http.server 4173 --directory dist
```

Keep the server in a reusable terminal session.

- [ ] **Step 2: Capture desktop and mobile pages**

Use agent-browser against `http://127.0.0.1:4173/`:

```bash
npx --yes agent-browser --session kmsg-home open http://127.0.0.1:4173/
npx --yes agent-browser --session kmsg-home set viewport 1440 1000
npx --yes agent-browser --session kmsg-home screenshot /tmp/kmsg-home-desktop.png --full
npx --yes agent-browser --session kmsg-home set viewport 390 844
npx --yes agent-browser --session kmsg-home screenshot /tmp/kmsg-home-mobile.png --full
```

Inspect both images at full detail. Repeat for light theme after clicking the
theme control.

- [ ] **Step 3: Verify overflow and section geometry**

At 1440, 390, and 320px, evaluate:

```js
({
  viewport: innerWidth,
  documentWidth: document.documentElement.scrollWidth,
  sections: [...document.querySelectorAll(
    "#workflow, #principles, #capabilities, #stories, #install",
  )].map((section) => ({
    id: section.id,
    left: Math.round(section.getBoundingClientRect().left),
    right: Math.round(section.getBoundingClientRect().right),
  })),
})
```

Expected: `documentWidth === viewport`; all five sections are present and stay
inside the viewport.

- [ ] **Step 4: Verify interactions and accessibility**

Verify:

- locale selector reaches `/en/`, `/jp/`, and `/cn/` equivalents;
- theme choice persists across navigation;
- both Homebrew controls copy the exact command;
- Usage, MCP, GitHub, release, and story links resolve correctly;
- terminal replay completes and reduced motion shows static complete output;
- tab order and visible focus cover every interactive control.

Run:

```bash
npx --yes agent-browser --session kmsg-home a11y --tags wcag2a,wcag2aa
```

Expected: no serious or critical violations.

- [ ] **Step 5: Smoke-check all locales**

Capture the top and workflow at desktop and mobile for `/`, `/en/`, `/jp/`,
and `/cn/`. Confirm translated headings fit without clipped glyphs, accidental
single-character lines, or control wrapping.

- [ ] **Step 6: Fix only observed defects and publish a corrective checkpoint**

If verification exposes a defect, add a regression assertion, implement the
smallest complete correction, run `npm test` and `git diff --check`, then:

```bash
git add site/build.mjs site/src/styles.css site/src/app.js site/test/build.test.mjs
git commit -m "fix(site): polish responsive product homepage"
git push
git rev-list --left-right --count HEAD...@{u}
```

Do not create this commit when no correction is needed.

### Task 5: Audit production deployment and close the realtime workflow

**Files:**
- No source changes unless production contradicts the local verified output.

- [ ] **Step 1: Confirm the Pages workflow for the feature commit succeeds**

Inspect the GitHub Actions run triggered by the pushed commit and wait for a
successful Pages deployment. Do not infer deployment from a successful push.

- [ ] **Step 2: Re-run production checks**

Against `https://channprj.github.io/kmsg/`, verify:

- the factual Korean headline and curated sections are live;
- desktop and 390px screenshots match the local structure;
- `/en/`, `/jp/`, `/cn/`, `/usage/`, `llm.txt`, and `sitemap.xml` return the
  expected content;
- theme, locale, copy, links, and terminal behavior work;
- the production page has no horizontal overflow or serious/critical
  accessibility violations.

- [ ] **Step 3: Run the final completion audit**

Run:

```bash
cd site && npm test
git diff --check
git status --short --branch
git log --oneline 91a938a..HEAD
git rev-list --left-right --count HEAD...@{u}
```

Expected: all tests pass, the worktree is clean, the checkpoint history is
reviewable, and upstream parity is `0 0`.
