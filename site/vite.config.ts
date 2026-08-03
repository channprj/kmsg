import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  base: "/kmsg/",
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), reactRouter()],
})
