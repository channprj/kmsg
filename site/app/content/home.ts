import legacyContent from "./legacy-content.json"
import type { LocaleId } from "./routes"

export interface HomePrinciple {
  token: string
  title: string
  description: string
}

export interface HomeCapability {
  title: string
  description: string
  points: string[]
  command: string
  output: string
}

export interface HomeContent {
  kicker: string
  headline: string
  headlineHighlight?: string
  description: string
  heroImageAlt: string
  workflowTitle: string
  workflowDescription: string
  workflowStepsLabel: string
  workflowSteps: Array<{ label: string; title: string; description: string }>
  installAction: string
  docsAction: string
  heroProof: string[]
  agentSkillLabel: string
  agentSkillTitle: string
  agentSkillDescription: string
  agentCompatibilityLabel: string
  agentSkillInstallTitle: string
  agentSkillInstallDescription: string
  agentSkillUseTitle: string
  agentSkillUseDescription: string
  agentSkillPrompt: string
  principlesLabel: string
  principlesTitle: string
  capabilitiesLabel: string
  capabilitiesTitle: string
  tagline: string
  storiesLabel: string
  storiesTitle: string
  storiesDescription: string
  moreStoriesAction: string
  faqLabel: string
  faqTitle: string
  faqDescription: string
  installLabel: string
  installTitle: string
  installDescription: string
  installSteps: string[]
  updateDescription: string
  releaseAction: string
  disclaimer: string
  principles: HomePrinciple[]
  capabilities: HomeCapability[]
}

export interface HomeStory {
  publisher: string
  title: Record<LocaleId, string>
  href: string
  image: string
}

export const HOME_CONTENT = legacyContent.homeContent as unknown as Record<
  LocaleId,
  HomeContent
>

export const MORE_STORIES_URL =
  "https://www.google.com/search?q=kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1+OR+kmsg+%EC%B9%B4%ED%86%A1+OR+kmsg+%EC%B9%B4%EC%B9%B4%EC%98%A4"

export const HOME_STORIES = legacyContent.homeStories as unknown as HomeStory[]
