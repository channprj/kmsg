# LIVE WORKFLOW Terminal Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fictional homepage workflow dashboard with a locale-safe, progressively enhanced replay of the real `kmsg chats → kmsg read → kmsg send` terminal experience.

**Architecture:** The static site generator emits a complete localized transcript as the no-JavaScript and reduced-motion fallback. A dependency-free controller in `site/src/app.js` progressively types command text, reveals real CLI output, manages internal scrolling, and cancels cleanly when the terminal leaves the viewport or the page is hidden. CSS owns fixed terminal geometry, CJK-safe wrapping, responsive presentation, and enhanced-state visibility without changing the generated content.

**Tech Stack:** Node.js 22, ES modules, built-in `node:test`, generated HTML, vanilla JavaScript, CSS, `agent-browser`.

---

## Scope and file responsibilities

- `site/build.mjs`
  - Owns locale-specific chat titles, send/read content, accessible summary text,
    and complete static transcript markup.
- `site/src/app.js`
  - Owns replay lifecycle, Unicode-safe typing, output reveal, internal scroll,
    cancellation, visibility handling, intersection handling, and reduced-motion
    changes.
- `site/src/styles.css`
  - Owns stable terminal dimensions, transcript layout, wrapping, responsive
    typography, enhanced replay states, cursor motion, and reduced-motion
    fallback.
- `site/test/build.test.mjs`
  - Owns generated-content contracts for all four locales and source-level
    contracts for progressive enhancement and locale-safe layout.
- `docs/superpowers/specs/2026-07-27-live-workflow-terminal-replay-design.md`
  - Remains the authoritative design and acceptance specification.

No runtime dependency, framework, asset, Swift source, release file, route, or
deployment workflow is added or changed.

The repository's `AGENTS.md` maps subagent dispatch to sequential work in the
main thread. Execute this plan inline with `executing-plans`; do not dispatch
implementation tasks to subagents.

### Task 1: Lock the real localized transcript contract

**Files:**
- Modify: `site/test/build.test.mjs:217-249`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Replace the old watch-to-MCP test with a failing transcript test**

Replace the test beginning
`home hero presents an animated AI-native watch-to-MCP workflow` with:

```js
test("home hero renders the real localized chats-read-send transcript", async () => {
  const scenarios = {
    ko: {
      label:
        "kmsg로 채팅 목록을 확인하고 메시지를 읽은 뒤 답장을 보내는 터미널 미리보기",
      primaryChat: "AI 프로젝트",
      secondaryChat: "출시 준비",
      sender: "지나",
      incoming: "새 메시지를 확인해줘.",
      outgoing: "지금 확인할게요.",
      reply: "확인했어요.",
    },
    en: {
      label:
        "Terminal replay showing kmsg listing chats, reading messages, and sending a reply",
      primaryChat: "AI Project",
      secondaryChat: "Release Prep",
      sender: "Jina",
      incoming: "Please check the latest messages.",
      outgoing: "I will check them now.",
      reply: "I've checked them.",
    },
    jp: {
      label:
        "kmsgでチャット一覧を確認し、メッセージを読んで返信するターミナル",
      primaryChat: "AIプロジェクト",
      secondaryChat: "リリース準備",
      sender: "ジナ",
      incoming: "新着メッセージを確認して。",
      outgoing: "今確認します。",
      reply: "確認しました。",
    },
    cn: {
      label: "使用kmsg查看聊天列表、读取消息并发送回复的终端演示",
      primaryChat: "AI项目",
      secondaryChat: "发布准备",
      sender: "Jina",
      incoming: "请确认最新消息。",
      outgoing: "我现在确认。",
      reply: "已经确认。",
    },
  };

  for (const [localeId, scenario] of Object.entries(scenarios)) {
    const html = await readOutput(localizedPath(localeId, "home"));
    const encodedReply = scenario.reply.replaceAll("'", "&#39;");
    const commands = [
      "kmsg chats --limit 2",
      `kmsg read &quot;${scenario.primaryChat}&quot; --limit 2 --keep-window`,
      `kmsg send &quot;${scenario.primaryChat}&quot; &quot;${encodedReply}&quot;`,
    ];
    const commandPositions = commands.map((command) => html.indexOf(command));

    assert.match(html, /data-terminal-replay/);
    assert.match(html, /data-replay-progress>03 \\/ 03/);
    assert.ok(html.includes(`aria-label="${scenario.label}"`));
    assert.ok(commandPositions.every((position) => position >= 0));
    assert.ok(
      commandPositions[0] < commandPositions[1] &&
        commandPositions[1] < commandPositions[2],
    );
    assert.match(html, new RegExp(scenario.secondaryChat));
    assert.match(html, new RegExp(scenario.sender));
    assert.match(html, new RegExp(scenario.incoming.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(scenario.outgoing.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok(html.includes(encodedReply));
    assert.match(html, /Looking for chat with/);
    assert.match(html, /Found existing chat window\\./);
    assert.match(html, /✓ Message sent to/);
    assert.match(html, /✓ Chat window closed\\./);
    assert.doesNotMatch(html, /kmsg watch|class="tui-|MCP · kmsg_read/);
  }
});
```

- [ ] **Step 2: Run the site test to prove the old implementation fails**

Run:

```bash
cd site
npm test
```

Expected: FAIL in
`home hero renders the real localized chats-read-send transcript` because
`data-terminal-replay` and `kmsg chats --limit 2` do not exist yet.

### Task 2: Generate the complete locale-safe static transcript

**Files:**
- Modify: `site/build.mjs:164-233`
- Modify: `site/build.mjs:758-906`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Expand each homepage locale scenario**

Retain every existing title, navigation, and hero property. Replace the current
`chatName`, `firstSender`, and `firstMessage` tail in each locale with the
following complete fields:

```js
// ko
previewLabel:
  "kmsg로 채팅 목록을 확인하고 메시지를 읽은 뒤 답장을 보내는 터미널 미리보기",
highlightsLabel: "프로젝트 주요 정보",
chatName: "AI 프로젝트",
secondaryChat: "출시 준비",
firstSender: "지나",
firstMessage: "새 메시지를 확인해줘.",
secondMessage: "지금 확인할게요.",
replyMessage: "확인했어요.",
firstTime: "오후 1:41",
secondTime: "오후 1:42",

// en
previewLabel:
  "Terminal replay showing kmsg listing chats, reading messages, and sending a reply",
highlightsLabel: "Project highlights",
chatName: "AI Project",
secondaryChat: "Release Prep",
firstSender: "Jina",
firstMessage: "Please check the latest messages.",
secondMessage: "I will check them now.",
replyMessage: "I've checked them.",
firstTime: "1:41 PM",
secondTime: "1:42 PM",

// jp
previewLabel:
  "kmsgでチャット一覧を確認し、メッセージを読んで返信するターミナル",
highlightsLabel: "プロジェクトの概要",
chatName: "AIプロジェクト",
secondaryChat: "リリース準備",
firstSender: "ジナ",
firstMessage: "新着メッセージを確認して。",
secondMessage: "今確認します。",
replyMessage: "確認しました。",
firstTime: "午後1:41",
secondTime: "午後1:42",

// cn
previewLabel:
  "使用kmsg查看聊天列表、读取消息并发送回复的终端演示",
highlightsLabel: "项目概览",
chatName: "AI项目",
secondaryChat: "发布准备",
firstSender: "Jina",
firstMessage: "请确认最新消息。",
secondMessage: "我现在确认。",
replyMessage: "已经确认。",
firstTime: "下午1:41",
secondTime: "下午1:42",
```

- [ ] **Step 2: Add focused transcript line renderers above `renderHomeHero`**

Insert:

```js
const renderReplayCommand = (stage, command) => `
  <div class="terminal-line terminal-command-line" data-replay-line data-replay-stage="${stage}" data-replay-kind="command">
    <span class="terminal-prompt">❯</span>
    <span class="terminal-command" data-replay-command>${escapeHtml(command)}</span>
    <span class="cursor-block" aria-hidden="true"></span>
  </div>`;

const renderReplayOutput = (stage, output, tone = "") => `
  <div class="terminal-line terminal-output-line${tone ? ` ${tone}` : ""}" data-replay-line data-replay-stage="${stage}">
    ${escapeHtml(output)}
  </div>`;

const renderReplayGap = (stage) => `
  <div class="terminal-line terminal-output-gap" data-replay-line data-replay-stage="${stage}" aria-hidden="true"></div>`;
```

These helpers escape every localized value before it reaches generated HTML.

- [ ] **Step 3: Replace the fictional terminal copy and TUI markup**

Use this localized footer copy inside `renderHomeHero`:

```js
const terminalCopy = {
  ko: { connected: "AX 연결됨", output: "텍스트 · 표준 출력" },
  en: { connected: "AX connected", output: "text · stdout" },
  jp: { connected: "AX接続済み", output: "テキスト · 標準出力" },
  cn: { connected: "AX已连接", output: "文本 · 标准输出" },
}[page.locale];

const chatID = "chat_7f42c5e1d9ab";
const secondaryChatID = "chat_81e0c8b9a214";
```

Replace the current `.hero-visual` block with:

```js
<div class="hero-visual" role="img" aria-label="${escapeHtml(page.previewLabel)}">
  <div class="terminal-caption" aria-hidden="true">
    <span>LIVE WORKFLOW</span>
    <span data-replay-progress>03 / 03</span>
  </div>
  <div class="terminal-window" data-terminal-replay>
    <div class="terminal-bar">
      <div class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></div>
      <span>kmsg · zsh</span>
      <span class="terminal-version">v${escapeHtml(version)}</span>
    </div>
    <div class="terminal-body" aria-hidden="true" data-replay-viewport>
      <div class="terminal-transcript" data-replay-transcript>
        ${renderReplayCommand(1, "kmsg chats --limit 2")}
        ${renderReplayOutput(1, "Searching for chat list in KakaoTalk...", "terminal-muted")}
        ${renderReplayGap(1)}
        ${renderReplayOutput(1, "Found 2 chat(s):")}
        ${renderReplayGap(1)}
        ${renderReplayOutput(1, `[1] ${page.chatName}`, "terminal-highlight")}
        ${renderReplayOutput(1, `    chat_id: ${chatID}`, "terminal-muted")}
        ${renderReplayOutput(1, `[2] ${page.secondaryChat}`)}
        ${renderReplayOutput(1, `    chat_id: ${secondaryChatID}`, "terminal-muted")}
        ${renderReplayCommand(
          2,
          `kmsg read "${page.chatName}" --limit 2 --keep-window`,
        )}
        ${renderReplayOutput(2, `Reading messages from: ${page.chatName}`)}
        ${renderReplayGap(2)}
        ${renderReplayOutput(2, "Recent messages (2):")}
        ${renderReplayGap(2)}
        ${renderReplayOutput(2, `[1] author: ${page.firstSender}`, "terminal-highlight")}
        ${renderReplayOutput(2, `    time: ${page.firstTime}`, "terminal-muted")}
        ${renderReplayOutput(2, `    body: ${page.firstMessage}`)}
        ${renderReplayGap(2)}
        ${renderReplayOutput(2, "[2] author: (me)")}
        ${renderReplayOutput(2, `    time: ${page.secondTime}`, "terminal-muted")}
        ${renderReplayOutput(2, `    body: ${page.secondMessage}`)}
        ${renderReplayCommand(
          3,
          `kmsg send "${page.chatName}" "${page.replyMessage}"`,
        )}
        ${renderReplayOutput(3, `Looking for chat with '${page.chatName}'...`)}
        ${renderReplayOutput(3, "Found existing chat window.")}
        ${renderReplayOutput(3, `✓ Message sent to '${page.chatName}'`, "terminal-success")}
        ${renderReplayOutput(3, "✓ Chat window closed.", "terminal-success")}
        <div class="terminal-line terminal-command-line terminal-return-line" data-replay-line data-replay-stage="3">
          <span class="terminal-prompt">❯</span>
          <span class="cursor-block" aria-hidden="true"></span>
        </div>
      </div>
    </div>
    <div class="terminal-footer">
      <span><i></i> ${escapeHtml(terminalCopy.connected)}</span>
      <span>${escapeHtml(terminalCopy.output)}</span>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Build and run the transcript test**

Run:

```bash
cd site
npm test
```

Expected: PASS for
`home hero renders the real localized chats-read-send transcript`; existing
tests remain green.

### Task 3: Lock replay lifecycle and locale-safe layout contracts

**Files:**
- Modify: `site/test/build.test.mjs:250`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Add a failing progressive-enhancement contract test**

Insert immediately after the transcript test:

```js
test("terminal replay is cancellable, motion-aware, and locale-safe", async () => {
  const [app, styles] = await Promise.all([
    readOutput("assets/app.js"),
    readOutput("assets/styles.css"),
  ]);

  assert.match(app, /class TerminalReplay/);
  assert.match(app, /Array\\.from\\(fullText\\)/);
  assert.match(app, /new AbortController\\(\\)/);
  assert.match(app, /IntersectionObserver/);
  assert.match(app, /visibilitychange/);
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(app, /scrollTo\\(/);
  assert.match(app, /showComplete\\(\\)/);

  assert.match(
    styles,
    /\\.terminal-transcript\\s*{[\\s\\S]*overflow-y:\\s*auto/,
  );
  assert.match(
    styles,
    /\\.terminal-line\\s*{[\\s\\S]*min-width:\\s*0;[\\s\\S]*overflow-wrap:\\s*anywhere;[\\s\\S]*white-space:\\s*pre-wrap/,
  );
  assert.match(
    styles,
    /\\.terminal-command\\s*{[\\s\\S]*min-width:\\s*0/,
  );
  assert.match(
    styles,
    /\\.terminal-window\\.is-replaying[\\s\\S]*\\.terminal-line\\.is-visible/,
  );
  assert.match(
    styles,
    /@media \\(prefers-reduced-motion: reduce\\)[\\s\\S]*animation-duration:\\s*0\\.01ms !important/,
  );
  assert.doesNotMatch(styles, /\\.tui-(?:workspace|rail|stream|event|tool-call|ready)/);
});
```

- [ ] **Step 2: Run the test to prove lifecycle and wrapping are absent**

Run:

```bash
cd site
npm test
```

Expected: FAIL in
`terminal replay is cancellable, motion-aware, and locale-safe` because the
controller and new transcript CSS do not exist.

### Task 4: Implement the replay controller

**Files:**
- Modify: `site/src/app.js:after the table-of-contents observer`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Add an abortable sleep helper**

Insert:

```js
const replaySleep = (duration, signal) =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const timeout = window.setTimeout(done, duration);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(signal.reason);
    };

    function done() {
      signal.removeEventListener("abort", abort);
      resolve();
    }

    signal.addEventListener("abort", abort, { once: true });
  });
```

- [ ] **Step 2: Add the focused replay controller**

Insert after `replaySleep`:

```js
class TerminalReplay {
  constructor(element, motionPreference) {
    this.element = element;
    this.motionPreference = motionPreference;
    this.viewport = element.querySelector("[data-replay-viewport]");
    this.progress = element
      .closest(".hero-visual")
      ?.querySelector("[data-replay-progress]");
    this.lines = [...element.querySelectorAll("[data-replay-line]")];
    this.abortController = null;
    this.isIntersecting = false;

    if (!this.viewport || !this.progress || this.lines.length === 0) {
      throw new Error("Incomplete terminal replay markup");
    }

    for (const command of element.querySelectorAll("[data-replay-command]")) {
      command.dataset.replayText = command.textContent || "";
    }
  }

  showComplete() {
    this.element.classList.remove("is-replaying", "is-resetting");
    for (const line of this.lines) {
      line.classList.remove("is-visible", "is-current");
      const command = line.querySelector("[data-replay-command]");
      if (command) command.textContent = command.dataset.replayText || "";
    }
    this.progress.textContent = "03 / 03";
    this.viewport.scrollTop = this.viewport.scrollHeight;
  }

  reset() {
    this.element.classList.add("is-replaying");
    this.element.classList.remove("is-resetting");
    for (const line of this.lines) {
      line.classList.remove("is-visible", "is-current");
      const command = line.querySelector("[data-replay-command]");
      if (command) command.textContent = "";
    }
    this.progress.textContent = "01 / 03";
    this.viewport.scrollTop = 0;
  }

  scrollToLatest() {
    this.viewport.scrollTo({
      top: this.viewport.scrollHeight,
      behavior: this.motionPreference.matches ? "auto" : "smooth",
    });
  }

  async reveal(line, signal) {
    line.classList.add("is-visible");
    const command = line.querySelector("[data-replay-command]");

    if (command) {
      line.classList.add("is-current");
      const fullText = command.dataset.replayText || "";
      for (const character of Array.from(fullText)) {
        command.textContent += character;
        await replaySleep(40, signal);
      }
      line.classList.remove("is-current");
    }

    this.scrollToLatest();
    await replaySleep(command ? 360 : 170, signal);
  }

  async play(signal) {
    while (!signal.aborted) {
      this.reset();
      await replaySleep(550, signal);

      for (const stage of ["1", "2", "3"]) {
        this.progress.textContent = `0${stage} / 03`;
        const stageLines = this.lines.filter(
          (line) => line.dataset.replayStage === stage,
        );
        for (const line of stageLines) {
          await this.reveal(line, signal);
        }
        await replaySleep(250, signal);
      }

      await replaySleep(2200, signal);
      this.element.classList.add("is-resetting");
      await replaySleep(450, signal);
    }
  }

  start() {
    if (
      this.abortController ||
      this.motionPreference.matches ||
      !this.isIntersecting ||
      document.hidden
    ) {
      return;
    }

    const controller = new AbortController();
    this.abortController = controller;
    this.play(controller.signal)
      .catch(() => {
        if (!controller.signal.aborted) this.showComplete();
      })
      .finally(() => {
        if (this.abortController === controller) {
          this.abortController = null;
        }
      });
  }

  pause() {
    this.abortController?.abort();
    this.abortController = null;
    this.showComplete();
  }
}
```

- [ ] **Step 3: Wire viewport, visibility, and runtime motion changes**

Insert after the class:

```js
const terminalElements = [
  ...document.querySelectorAll("[data-terminal-replay]"),
];
const replayMotionPreference = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

if ("IntersectionObserver" in window && terminalElements.length > 0) {
  const terminalReplays = terminalElements.flatMap((element) => {
    try {
      const replay = new TerminalReplay(element, replayMotionPreference);
      replay.showComplete();
      return [replay];
    } catch {
      return [];
    }
  });

  const terminalObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const replay = terminalReplays.find(
          (candidate) => candidate.element === entry.target,
        );
        if (!replay) continue;
        replay.isIntersecting = entry.isIntersecting;
        if (entry.isIntersecting) replay.start();
        else replay.pause();
      }
    },
    { rootMargin: "12% 0px", threshold: 0.2 },
  );

  for (const replay of terminalReplays) {
    terminalObserver.observe(replay.element);
  }

  document.addEventListener("visibilitychange", () => {
    for (const replay of terminalReplays) {
      if (document.hidden) replay.pause();
      else replay.start();
    }
  });

  replayMotionPreference.addEventListener("change", () => {
    for (const replay of terminalReplays) {
      replay.pause();
      if (!replayMotionPreference.matches) replay.start();
    }
  });
}
```

- [ ] **Step 4: Run the contract test and record the expected CSS failure**

Run:

```bash
cd site
npm test
```

Expected: the JavaScript assertions pass; the CSS assertions still fail.

### Task 5: Replace the TUI styling with a stable transcript viewport

**Files:**
- Modify: `site/src/styles.css:712-1087`
- Modify: `site/src/styles.css:1774-1809`
- Modify: `site/src/styles.css:1908-1922`
- Test: `site/test/build.test.mjs`

- [ ] **Step 1: Replace terminal body, command, and TUI rules**

Delete the selectors beginning with `.terminal-command-row`, `.tui-workspace`,
`.tui-rail`, `.tui-stream`, `.tui-event`, `.tui-tool-call`, `.tui-ready`,
`.syntax-`, and their associated `terminal-type`, `tui-reveal`, and
`ready-pulse` keyframes. Insert:

```css
.terminal-body {
  height: 356px;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(rgba(255, 255, 255, 0.017) 1px, transparent 1px),
    #0b0b0b;
  background-size: 100% 24px;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.42;
}

.terminal-transcript {
  height: 100%;
  min-width: 0;
  padding: 20px 22px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
  transition: opacity 280ms ease;
}

.terminal-transcript::-webkit-scrollbar {
  display: none;
}

.terminal-line {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: normal;
}

.terminal-command-line {
  display: flex;
  margin-top: 14px;
  align-items: flex-start;
  gap: 9px;
}

.terminal-command-line:first-child {
  margin-top: 0;
}

.terminal-prompt {
  flex: none;
  color: var(--accent);
  font-weight: 700;
}

.terminal-command {
  min-width: 0;
  color: #f6f8fa;
}

.terminal-output-line {
  display: block;
  color: #cbd3db;
}

.terminal-output-gap {
  display: block;
  height: 7px;
}

.terminal-muted {
  color: #78838e;
}

.terminal-highlight {
  color: #8ec5ff;
}

.terminal-success {
  color: #63d58b;
}

.terminal-window.is-replaying .terminal-line {
  display: none;
}

.terminal-window.is-replaying .terminal-line.is-visible {
  display: block;
}

.terminal-window.is-replaying .terminal-command-line.is-visible {
  display: flex;
}

.terminal-window.is-resetting .terminal-transcript {
  opacity: 0;
}

.terminal-command-line .cursor-block {
  display: none;
}

.terminal-command-line.is-current .cursor-block,
.terminal-return-line .cursor-block {
  display: inline-block;
  flex: none;
}

.cursor-block {
  width: 7px;
  height: 14px;
  margin-top: 1px;
  background: var(--accent);
  animation: blink 1.1s steps(1) infinite;
}
```

- [ ] **Step 2: Keep the outer terminal dimensions invariant**

Update:

```css
.terminal-window {
  min-height: 0;
}

.terminal-footer {
  height: 45px;
}
```

The terminal now has one deterministic total height:
48px bar + 356px transcript + 45px footer + borders.

- [ ] **Step 3: Replace mobile TUI overrides with transcript overrides**

At the existing tablet/mobile breakpoint, use:

```css
.terminal-window {
  min-height: 0;
  transform: none;
}

.terminal-body {
  height: 344px;
  min-height: 0;
  font-size: 10px;
}

.terminal-transcript {
  padding: 17px 16px 20px;
}

.terminal-command-line {
  gap: 7px;
}
```

At `max-width: 430px`, use:

```css
.terminal-body {
  font-size: 9px;
}

.terminal-transcript {
  padding-inline: 13px;
}
```

Remove the obsolete `.terminal-command-row`, `.tui-workspace`, `.tui-rail`,
`.tui-stream`, and `.tui-event` breakpoint rules.

- [ ] **Step 4: Make reduced motion show the completed static transcript**

Keep the existing global reduced-motion rule and add inside the same media
query:

```css
.terminal-window,
.terminal-window::after,
.terminal-transcript,
.cursor-block {
  animation: none !important;
  transition: none !important;
}

.terminal-window::after {
  display: none;
}
```

- [ ] **Step 5: Run the full site suite**

Run:

```bash
cd site
npm test
```

Expected: all tests pass, including the localized transcript and
progressive-enhancement contracts.

### Task 6: Verify the real runtime across animation, locales, and viewports

**Files:**
- Verify: `site/dist/index.html`
- Verify: `site/dist/en/index.html`
- Verify: `site/dist/jp/index.html`
- Verify: `site/dist/cn/index.html`
- Verify: `site/dist/assets/app.js`
- Verify: `site/dist/assets/styles.css`

- [ ] **Step 1: Rebuild and serve the generated site**

Run:

```bash
cd site
npm test
python3 -m http.server 4173 -d dist
```

Expected: test suite exits successfully; the server listens on
`http://localhost:4173`.

- [ ] **Step 2: Open an isolated browser session**

Run:

```bash
KMSG_BROWSER_SESSION="$(npx --yes agent-browser session id --scope worktree --prefix kmsg-live-workflow)"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" open http://localhost:4173/
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --load networkidle
```

Expected: the Korean homepage opens without browser errors.

- [ ] **Step 3: Measure one full animation loop**

Run the following with `agent-browser eval --stdin`:

```js
await new Promise((resolve) => {
  const samples = [];
  const startedAt = performance.now();
  const timer = setInterval(() => {
    const terminal = document.querySelector("[data-terminal-replay]");
    const progress = document.querySelector("[data-replay-progress]");
    const rect = terminal.getBoundingClientRect();
    samples.push({
      elapsed: Math.round(performance.now() - startedAt),
      progress: progress.textContent.trim(),
      width: rect.width,
      height: rect.height,
      transcriptScroll: document.querySelector("[data-replay-viewport]").scrollTop,
      pageScrollY: window.scrollY,
      lineCount: document.querySelectorAll("[data-replay-line]").length,
      pageOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    });
  }, 250);

  setTimeout(() => {
    clearInterval(timer);
    resolve(samples);
  }, 15500);
});
```

Expected:

- progress samples contain `01 / 03`, `02 / 03`, and `03 / 03` in order;
- the sequence returns to `01 / 03` after completion;
- terminal width and height do not vary by more than one CSS pixel; and
- `transcriptScroll` increases while `pageScrollY` remains unchanged;
- `lineCount` is constant for the entire loop; and
- every `pageOverflow` value is `0`.

- [ ] **Step 4: Measure every locale and required viewport**

Measure `/`, `/en/`, `/jp/`, and `/cn/` at viewport widths 320, 390, 768,
1024, and 1440 with a height of 900:

```bash
for route in "" "en/" "jp/" "cn/"; do
  for width in 320 390 768 1024 1440; do
    npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" set viewport "$width" 900
    npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" open "http://localhost:4173/$route"
    npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --load networkidle
    npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" eval "(() => { const terminal = document.querySelector('[data-terminal-replay]').getBoundingClientRect(); return { lang: document.documentElement.lang, viewport: document.documentElement.clientWidth, pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, terminalLeft: terminal.left, terminalRight: terminal.right, terminalWidth: terminal.width, insideViewport: terminal.left >= 0 && terminal.right <= document.documentElement.clientWidth }; })()"
  done
done
```

Expected for all 20 combinations:

- `pageOverflow` is `0`;
- `insideViewport` is `true`;
- `lang` matches `ko`, `en`, `ja`, or `zh-CN`; and
- terminal width is positive and no larger than the viewport.

- [ ] **Step 5: Verify runtime reduced motion**

Run:

```bash
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" set media dark reduced-motion
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" open http://localhost:4173/
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --load networkidle
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" eval "(() => { const terminal = document.querySelector('[data-terminal-replay]'); const commands = [...document.querySelectorAll('[data-replay-command]')].map((node) => node.textContent.trim()); return { replaying: terminal.classList.contains('is-replaying'), progress: document.querySelector('[data-replay-progress]').textContent.trim(), commands, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }; })()"
```

Expected:

- `reduced` is `true`;
- `replaying` is `false`;
- `progress` is `03 / 03`; and
- all three command strings are complete.

- [ ] **Step 6: Verify theme and locale controls during replay**

Run:

```bash
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" set media dark
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" open http://localhost:4173/
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --fn "document.querySelector('[data-terminal-replay]').classList.contains('is-replaying')"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" click "[data-theme-toggle]"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" eval "({ theme: document.documentElement.dataset.theme, replaying: document.querySelector('[data-terminal-replay]').classList.contains('is-replaying') })"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" eval "(() => { const select = document.querySelector('[data-language-select]'); const option = [...select.options].find((candidate) => candidate.dataset.locale === 'en'); select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); return option.value; })()"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --url "**/en/"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --fn "document.querySelector('[data-terminal-replay]').classList.contains('is-replaying')"
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" errors
```

Expected:

- theme becomes `paper` while replay remains active;
- locale navigation reaches `/en/`;
- the English replay starts after navigation; and
- browser errors are empty.

- [ ] **Step 7: Capture and inspect visual evidence**

Capture Korean, English, Japanese, and Chinese at 1440×900 and 390×844:

```bash
for locale in ko en jp cn; do
  case "$locale" in
    ko) route="" ;;
    *) route="$locale/" ;;
  esac
  npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" set viewport 1440 900
  npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" open "http://localhost:4173/$route"
  npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" wait --load networkidle
  npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" screenshot "/tmp/kmsg-live-workflow-$locale-desktop.png"
  npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" set viewport 390 844
  npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" screenshot "/tmp/kmsg-live-workflow-$locale-mobile.png"
done
```

Inspect all eight images for clipped commands, collisions, unreadable type,
unexpected whitespace, terminal overflow, and hero layout movement.

- [ ] **Step 8: Restore normal motion and close the browser**

Run:

```bash
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" set media dark
npx --yes agent-browser --session "$KMSG_BROWSER_SESSION" close
```

Expected: the isolated browser session exits successfully.

### Task 7: Review, commit, push, and prove parity

**Files:**
- Modify: `site/build.mjs`
- Modify: `site/src/app.js`
- Modify: `site/src/styles.css`
- Modify: `site/test/build.test.mjs`

- [ ] **Step 1: Review the complete feature diff**

Run:

```bash
git status --short
git diff -- site/build.mjs site/src/app.js site/src/styles.css site/test/build.test.mjs
git diff --cached
git diff --check
```

Expected: only the four planned site files are modified, no content is staged,
and `git diff --check` prints nothing.

- [ ] **Step 2: Re-run the full site gate**

Run:

```bash
cd site
npm test
```

Expected: all Node tests pass and the build completes.

- [ ] **Step 3: Perform the secret-path review**

Run:

```bash
git status --short | rg '(^|/)(\\.env|credentials\\.|.*_rsa$|.*\\.pem$|.*\\.key$|.*\\.p12$|.*secret)' || true
```

Expected: no output.

- [ ] **Step 4: Create the green feature checkpoint**

Run:

```bash
git add site/build.mjs site/src/app.js site/src/styles.css site/test/build.test.mjs
git diff --cached --check
git commit -m "feat(site): replay real CLI messaging workflow"
git status --short
```

Expected: the commit succeeds without bypassing hooks and the working tree is
clean.

- [ ] **Step 5: Push immediately and prove direct upstream parity**

Run:

```bash
git push
git status --short --branch
git rev-list --left-right --count HEAD...@{u}
```

Expected: push succeeds normally and parity is `0 0`.

- [ ] **Step 6: Run the completion audit**

Verify each requirement from the approved design against current generated
source, passing test output, browser measurements, screenshots, clean-tree
status, pushed commit history, and upstream parity. If a real defect remains,
fix it in a new focused commit, repeat the relevant browser matrix, push
normally, and re-prove `0 0`.
