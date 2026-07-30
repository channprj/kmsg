const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeColor = document.querySelector('meta[name="theme-color"]');
const languageSelect = document.querySelector("[data-language-select]");
const copiedLabel = document.body.dataset.copiedLabel || "Copied";
const copyFailedLabel =
  document.body.dataset.copyFailedLabel || "Copy failed";

const setTheme = (theme) => {
  root.dataset.theme = theme;
  themeColor?.setAttribute("content", theme === "paper" ? "#f2f2ed" : "#0c0d0b");
  const label =
    theme === "dark"
      ? themeToggle?.dataset.lightLabel
      : themeToggle?.dataset.darkLabel;
  themeToggle?.setAttribute(
    "aria-label",
    label ||
      (theme === "dark" ? "Switch to light theme" : "Switch to dark theme"),
  );
  try {
    localStorage.setItem("kmsg-theme", theme);
  } catch {
    // The visual preference remains applied for this page view.
  }
};

setTheme(root.dataset.theme === "paper" ? "paper" : "dark");

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "paper" : "dark");
});

languageSelect?.addEventListener("change", () => {
  const selected = languageSelect.selectedOptions[0];
  const locale = selected?.dataset.locale;
  if (!selected?.value || !locale) return;

  try {
    localStorage.setItem("kmsg-locale", locale);
  } catch {
    // The locale-specific route still preserves the choice for this visit.
  }
  window.location.assign(selected.value);
});

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Some browsers expose Clipboard API without granting write access.
    }
  }

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    area.remove();
  }
  if (!copied) throw new Error("Copy failed");
};

const copyAccessibleLabel = (button, label) => {
  const visibleCommand = button.dataset.copy?.trim();
  return visibleCommand ? `${label}: ${visibleCommand}` : label;
};

const markCopied = (button, fallbackLabel = copiedLabel) => {
  const originalLabel = button.getAttribute("aria-label");
  const visibleLabel = button.querySelector("[data-copy-label]");
  const originalText = visibleLabel?.textContent;
  const nextLabel = button.dataset.copiedLabel || fallbackLabel;

  button.classList.add("is-copied");
  button.setAttribute("aria-label", copyAccessibleLabel(button, nextLabel));
  if (visibleLabel) visibleLabel.textContent = nextLabel;

  window.setTimeout(() => {
    button.classList.remove("is-copied");
    if (originalLabel) button.setAttribute("aria-label", originalLabel);
    else button.removeAttribute("aria-label");
    if (visibleLabel && originalText) visibleLabel.textContent = originalText;
  }, 1600);
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await copyText(button.dataset.copy || "");
      markCopied(button);
    } catch {
      button.setAttribute(
        "aria-label",
        copyAccessibleLabel(
          button,
          button.dataset.copyFailedLabel || copyFailedLabel,
        ),
      );
    }
  });
});

document.querySelectorAll("[data-code-copy]").forEach((button) => {
  const code = button.closest("pre")?.querySelector("code");
  if (!code) return;

  button.addEventListener("click", async () => {
    try {
      await copyText(code.textContent || "");
      markCopied(button);
    } catch {
      button.setAttribute(
        "aria-label",
        copyAccessibleLabel(
          button,
          button.dataset.copyFailedLabel || copyFailedLabel,
        ),
      );
    }
  });
});

const tocLinks = new Map(
  [...document.querySelectorAll("[data-toc-link]")].map((link) => [
    link.getAttribute("href")?.slice(1),
    link,
  ]),
);

if ("IntersectionObserver" in window && tocLinks.size > 0) {
  const headingObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        tocLinks.forEach((link) => link.classList.remove("is-active"));
        tocLinks.get(entry.target.id)?.classList.add("is-active");
      }
    },
    { rootMargin: "-18% 0px -72% 0px" },
  );

  tocLinks.forEach((_, id) => {
    const heading = document.getElementById(id);
    if (heading) headingObserver.observe(heading);
  });
}

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

class TerminalReplay {
  constructor(element, motionPreference) {
    this.element = element;
    this.motionPreference = motionPreference;
    this.viewport = element.querySelector("[data-replay-viewport]");
    this.lines = [...element.querySelectorAll("[data-replay-line]")];
    this.abortController = null;
    this.isIntersecting = false;

    if (!this.viewport || this.lines.length === 0) {
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
