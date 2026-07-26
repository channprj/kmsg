const root = document.documentElement;
const header = document.querySelector("[data-header]");
const themeToggle = document.querySelector("[data-theme-toggle]");

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

const markCopied = (button, fallbackLabel = "Copied") => {
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
      button.setAttribute("aria-label", "Copy failed");
    }
  });
});

document.querySelectorAll(".markdown-body pre").forEach((pre) => {
  const code = pre.querySelector("code");
  if (!code) return;

  const button = document.createElement("button");
  button.className = "code-copy";
  button.type = "button";
  button.textContent = "COPY";
  button.setAttribute("aria-label", "Copy code");
  button.addEventListener("click", async () => {
    try {
      await copyText(code.textContent || "");
      button.textContent = "COPIED";
      window.setTimeout(() => {
        button.textContent = "COPY";
      }, 1400);
    } catch {
      button.textContent = "FAILED";
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
