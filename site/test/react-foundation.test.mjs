import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const siteDir = resolve(fileURLToPath(new URL("..", import.meta.url)));

const readSource = async (path) => {
  try {
    return await readFile(resolve(siteDir, path), "utf8");
  } catch {
    assert.fail(`expected React foundation file: ${path}`);
  }
};

test("site is configured as a React Router Tailwind Shadcn application", async () => {
  const [packageSource, componentsSource, routerSource, viteSource] =
    await Promise.all([
      readSource("package.json"),
      readSource("components.json"),
      readSource("react-router.config.ts"),
      readSource("vite.config.ts"),
    ]);
  const packageJson = JSON.parse(packageSource);
  const components = JSON.parse(componentsSource);

  assert.equal(packageJson.dependencies.react, "^19.2.7");
  assert.equal(packageJson.dependencies["react-router"], "8.3.0");
  assert.equal(components.style, "radix-nova");
  assert.equal(components.iconLibrary, "lucide");
  assert.match(routerSource, /ssr:\s*false/);
  assert.match(viteSource, /base:\s*["']\/kmsg\/["']/);
  assert.match(viteSource, /reactRouter\(\)/);
  assert.match(viteSource, /tailwindcss\(\)/);
});

test("the generated Shadcn button and KMSG document shell are present", async () => {
  const [button, root, styles] = await Promise.all([
    readSource("app/components/ui/button.tsx"),
    readSource("app/root.tsx"),
    readSource("app/app.css"),
  ]);

  assert.match(button, /data-slot="button"/);
  assert.match(button, /buttonVariants/);
  assert.match(root, /<html\s+lang=/);
  assert.match(root, /readThemeFromDocument\(\)/);
  assert.match(root, /className=\{theme === "dark" \? "dark" : ""\}/);
  assert.match(root, /content=\{themeColorFor\(theme\)\}/);
  assert.doesNotMatch(root, /<html[^>]+className="dark"[^>]+data-theme="dark"/s);
  assert.match(root, /import "\.\/app\.css"/);
  assert.match(styles, /@import "tailwindcss"/);
  assert.match(styles, /--primary:\s*#fee500/);
  assert.match(styles, /--primary-readable:\s*#fee500/);
  assert.match(
    styles,
    /:root\[data-theme="paper"\]\s*\{[^}]*--primary-readable:\s*#756600/s,
  );
  assert.match(styles, /--terminal:\s*#282c34/);
});
