import { Check, Copy, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "~/components/ui/button"

interface CopyButtonProps {
  text: string
  idleLabel: string
  copiedLabel: string
  failedLabel: string
  className?: string
}

function copyWithTextarea(text: string) {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

export function CopyButton({
  text,
  idleLabel,
  copiedLabel,
  failedLabel,
  className,
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  const label =
    status === "copied"
      ? copiedLabel
      : status === "failed"
        ? failedLabel
        : idleLabel

  const copyText = async () => {
    let copied = false
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      copied = copyWithTextarea(text)
    }

    setStatus(copied ? "copied" : "failed")
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setStatus("idle"), 1600)
  }

  return (
    <Button
      aria-label={label}
      className={className}
      onClick={copyText}
      size="icon"
      type="button"
      variant="secondary"
    >
      {status === "copied" ? (
        <Check aria-hidden="true" />
      ) : status === "failed" ? (
        <X aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
      <span aria-live="polite" className="sr-only">
        {label}
      </span>
    </Button>
  )
}
