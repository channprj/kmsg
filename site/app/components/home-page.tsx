import { ArrowRight, Check, ExternalLink, Terminal } from "lucide-react"

import { AnimatedTagline } from "~/components/animated-tagline"
import { CopyButton } from "~/components/copy-button"
import { SiteFooter } from "~/components/site-footer"
import { SiteHeader } from "~/components/site-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion"
import { Badge } from "~/components/ui/badge"
import { Button, buttonVariants } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { FAQ_CONTENT } from "~/content/faq"
import { HOME_CONTENT, HOME_STORIES } from "~/content/home"
import { LOCALES } from "~/content/locales"
import { pageCopyFor } from "~/content/pages"
import { publicRouteFor, type LocaleId } from "~/content/routes"
import { cn } from "~/lib/utils"

const agentNames = ["OpenClaw", "Hermes Agent", "Claude Code", "Codex"]

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="text-sm font-semibold text-primary-readable">{label}</p>
      <h2 className="mt-3 whitespace-pre-line text-3xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

function TerminalPreview({ locale }: { locale: LocaleId }) {
  const page = pageCopyFor(locale, "home")
  const chatName = page.chatName ?? "AI Project"
  const reply = page.replyMessage ?? "Checked."

  return (
    <div
      aria-label={page.previewLabel}
      className="terminal-preview overflow-hidden rounded-2xl border bg-(--terminal) text-[#d7dae0] shadow-2xl"
      role="img"
    >
      <div className="flex h-9 items-center gap-2 border-b border-white/8 px-4">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-auto font-mono text-[11px] text-white/60">kmsg — zsh</span>
      </div>
      <div className="space-y-4 overflow-x-auto p-5 font-mono text-[13px] leading-[1.65] sm:p-6">
        <div>
          <p><span className="text-primary">❯</span> <span>kmsg chats --json</span></p>
          <p className="text-white/62">{`[{"title":"${chatName}","chat_id":"chat_7f42c5e1d9ab"}]`}</p>
        </div>
        <div>
          <p><span className="text-primary">❯</span> <span>{`kmsg read "${chatName}" --limit 20 --json`}</span></p>
          <p className="text-white/62">{`{"author":"${page.firstSender}","body":"${page.firstMessage}"}`}</p>
        </div>
        <div>
          <p><span className="text-primary">❯</span> <span>{`kmsg send "${chatName}" "${reply}" --dry-run`}</span></p>
          <p className="text-[#98c379]">{`Would send to "${chatName}": ${reply}`}</p>
        </div>
      </div>
    </div>
  )
}

export function HomePage({ locale }: { locale: LocaleId }) {
  const copy = HOME_CONTENT[locale]
  const ui = LOCALES[locale].ui

  return (
    <>
      <SiteHeader locale={locale} pageKey="home" />
      <main id="content">
        <section className="mx-auto grid min-h-[92svh] max-w-6xl items-center gap-14 px-6 pb-20 pt-32 lg:grid-cols-[.92fr_1.08fr]">
          <div>
            <p className="text-sm font-semibold text-primary-readable">{copy.kicker}</p>
            <h1 className="mt-5 whitespace-pre-line text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
                href="#install"
              >
                {copy.installAction}
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </a>
              <a
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "min-h-11")}
                href={publicRouteFor(locale, "usage")}
              >
                {copy.docsAction}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {copy.heroProof.map((proof) => (
                <Badge key={proof} variant="secondary">
                  <Check aria-hidden="true" />
                  {proof}
                </Badge>
              ))}
            </div>
          </div>
          <TerminalPreview locale={locale} />
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            description={copy.workflowDescription}
            label={copy.workflowStepsLabel}
            title={copy.workflowTitle}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {copy.workflowSteps.map((step) => (
              <Card key={step.label}>
                <CardHeader>
                  <Badge className="w-fit" variant="outline">{step.label}</Badge>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading label={copy.principlesLabel} title={copy.principlesTitle} />
          <div className="grid gap-4 md:grid-cols-3">
            {copy.principles.map((principle) => (
              <Card key={principle.token}>
                <CardHeader>
                  <Badge className="w-fit" variant="secondary">{principle.token}</Badge>
                  <CardTitle>{principle.title}</CardTitle>
                  <CardDescription>{principle.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <Card className="overflow-hidden border-primary/25 bg-primary/[.04]">
            <CardHeader>
              <p className="text-sm font-semibold text-primary-readable">{copy.agentSkillLabel}</p>
              <CardTitle className="text-3xl sm:text-4xl">{copy.agentSkillTitle}</CardTitle>
              <CardDescription className="max-w-3xl text-base">{copy.agentSkillDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-background/60 p-5">
                <h3 className="font-semibold">{copy.agentSkillInstallTitle}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy.agentSkillInstallDescription}</p>
                <code className="mt-4 block overflow-x-auto rounded-lg bg-(--terminal) p-3 text-sm text-white">kmsg mcp-server</code>
              </div>
              <div className="rounded-xl border bg-background/60 p-5">
                <h3 className="font-semibold">{copy.agentSkillUseTitle}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy.agentSkillUseDescription}</p>
                <code className="mt-4 block overflow-x-auto rounded-lg bg-(--terminal) p-3 text-sm text-white">{copy.agentSkillPrompt}</code>
              </div>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              {agentNames.map((agent) => <Badge key={agent} variant="outline">{agent}</Badge>)}
            </CardFooter>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading label={copy.capabilitiesLabel} title={copy.capabilitiesTitle} />
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.capabilities.map((capability) => (
              <Card key={capability.title}>
                <CardHeader>
                  <Terminal aria-hidden="true" className="size-5 text-primary" />
                  <CardTitle>{capability.title}</CardTitle>
                  <CardDescription>{capability.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {capability.points.map((point) => <Badge key={point} variant="secondary">{point}</Badge>)}
                  </div>
                  <code className="mt-5 block overflow-x-auto rounded-lg bg-(--terminal) p-3 text-xs text-white">{capability.command}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <Separator />
          <AnimatedTagline text={copy.tagline} />
          <Separator />
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            description={copy.storiesDescription}
            label={copy.storiesLabel}
            title={copy.storiesTitle}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {HOME_STORIES.map((story) => (
              <Card className="overflow-hidden" key={story.href}>
                <img alt="" className="aspect-video w-full object-cover" loading="lazy" src={story.image} />
                <CardHeader>
                  <p className="text-sm text-muted-foreground">{story.publisher}</p>
                  <CardTitle>{story.title[locale]}</CardTitle>
                </CardHeader>
                <CardFooter>
                  <a className={buttonVariants({ variant: "outline" })} href={story.href} rel="noopener noreferrer" target="_blank">
                    {copy.moreStoriesAction}
                    <ExternalLink aria-hidden="true" data-icon="inline-end" />
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-24" id="faq">
          <SectionHeading
            description={copy.faqDescription}
            label={copy.faqLabel}
            title={copy.faqTitle}
          />
          <Accordion collapsible type="single">
            {FAQ_CONTENT[locale].map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-24" id="install">
          <Card className="border-primary/35 bg-primary/[.05]">
            <CardHeader>
              <p className="text-sm font-semibold text-primary-readable">{copy.installLabel}</p>
              <CardTitle className="text-3xl sm:text-5xl">{copy.installTitle}</CardTitle>
              <CardDescription className="text-base">{copy.installDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 sm:grid-cols-3">
                {copy.installSteps.map((step, index) => (
                  <li className="rounded-xl border bg-background/55 p-4 text-sm" key={step}>
                    <Badge className="mb-3" variant="outline">{String(index + 1).padStart(2, "0")}</Badge>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-(--terminal) p-4 text-white">
                <code className="min-w-0 flex-1 overflow-x-auto">brew install channprj/tap/kmsg</code>
                <CopyButton
                  copiedLabel={ui.copied}
                  failedLabel={ui.copyFailed}
                  idleLabel={`${ui.copy}: brew install channprj/tap/kmsg`}
                  text="brew install channprj/tap/kmsg"
                />
              </div>
            </CardContent>
            <CardFooter>
              <a className={buttonVariants({ variant: "outline" })} href="https://github.com/channprj/kmsg/releases">
                {copy.releaseAction}
                <ExternalLink aria-hidden="true" data-icon="inline-end" />
              </a>
            </CardFooter>
          </Card>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}
