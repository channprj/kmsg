export type SiteTheme = "dark" | "paper"

export const THEME_STORAGE_KEY = "kmsg-theme"

const THEME_COLORS: Record<SiteTheme, string> = {
  dark: "#131209",
  paper: "#f7f5ed",
}

export function readThemeFromDocument(target: Document = document): SiteTheme {
  return target.documentElement.dataset.theme === "paper" ? "paper" : "dark"
}

export function applyThemeToDocument(
  theme: SiteTheme,
  target: Document = document,
) {
  const root = target.documentElement
  root.dataset.theme = theme
  root.classList.toggle("dark", theme === "dark")
  target
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme])
}

export const THEME_BOOTSTRAP = `(() => {
  const apply = (theme) => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "paper" ? "${THEME_COLORS.paper}" : "${THEME_COLORS.dark}",
    );
  };
  try {
    const saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    apply(saved === "paper" ? "paper" : "dark");
  } catch {
    apply("dark");
  }
})();`
