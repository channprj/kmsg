import type { Config } from "@react-router/dev/config"

export default {
  basename: "/kmsg/",
  prerender: ["/"],
  ssr: false,
} satisfies Config
