import legacyContent from "./legacy-content.json"
import type { LocaleId } from "./routes"

export interface LegalPageContent {
  title: string
  description: string
  eyebrow: string
  heading: string
  intro: string
  sections: Array<{ title: string; body: string }>
}

export const LEGAL_CONTENT = legacyContent.legalContent as unknown as Record<
  LocaleId,
  Record<"privacy" | "terms", LegalPageContent>
>
