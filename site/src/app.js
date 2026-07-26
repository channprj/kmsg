const root = document.documentElement;
const header = document.querySelector("[data-header]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const languageSelect = document.querySelector("[data-language-select]");
const copyLabel = document.body.dataset.copyLabel || "Copy";
const copiedLabel = document.body.dataset.copiedLabel || "Copied";
const copyFailedLabel =
  document.body.dataset.copyFailedLabel || "Copy failed";

const setTheme = (theme) => {
  root.dataset.theme = theme;
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

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
};

const markCopied = (button, fallbackLabel = copiedLabel) => {
  const originalLabel = button.getAttribute("aria-label");
  const textNode = button.querySelector(".copy-icon");
  const originalText = textNode?.textContent;
  button.classList.add("is-copied");
  button.setAttribute(
    "aria-label",
    button.dataset.copiedLabel || fallbackLabel,
  );
  if (textNode) textNode.textContent = "✓";

  window.setTimeout(() => {
    button.classList.remove("is-copied");
    if (originalLabel) button.setAttribute("aria-label", originalLabel);
    else button.removeAttribute("aria-label");
    if (textNode) textNode.textContent = originalText;
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
        button.dataset.copyFailedLabel || copyFailedLabel,
      );
    }
  });
});

document.querySelectorAll(".markdown-body pre").forEach((pre) => {
  const code = pre.querySelector("code");
  if (!code) return;

  const button = document.createElement("button");
  button.className = "code-copy";
  button.type = "button";
  button.textContent = copyLabel;
  button.setAttribute("aria-label", copyLabel);
  button.addEventListener("click", async () => {
    try {
      await copyText(code.textContent || "");
      button.textContent = copiedLabel;
      window.setTimeout(() => {
        button.textContent = copyLabel;
      }, 1400);
    } catch {
      button.textContent = copyFailedLabel;
    }
  });
  pre.append(button);
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
