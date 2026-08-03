import faqContent from "./faq-content.json"
import type { LocaleId } from "./routes"

export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_CONTENT = faqContent as Record<LocaleId, FaqItem[]>
