import type { Config } from "@react-router/dev/config"
import { CANONICAL_ROUTES } from "./app/content/routes"

export default {
  basename: "/kmsg/",
  prerender: CANONICAL_ROUTES.map(({ path }) => path),
  ssr: false,
} satisfies Config
