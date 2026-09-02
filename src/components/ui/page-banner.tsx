"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pageBannerVariants = cva("flex items-start gap-3 rounded-lg border px-6 py-4", {
  variants: {
    variant: {
      info: "border-primary/20 bg-primary/10 text-accent-ink",
      warning: "border-warning/20 bg-warning/10 text-warning-foreground",
      destructive: "border-destructive/20 bg-destructive/10 text-destructive",
      success: "border-success/20 bg-success/10 text-success-foreground",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

const VARIANT_ICON: Record<NonNullable<VariantProps<typeof pageBannerVariants>["variant"]>, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  destructive: AlertTriangle,
  success: CheckCircle2,
}

function storageId(storageKey: string) {
  return `atlas:page-banner:${storageKey}`
}

export function PageBanner({
  title,
  description,
  variant = "info",
  storageKey,
  className,
  ...props
}: {
  title: string
  description: string
  variant?: VariantProps<typeof pageBannerVariants>["variant"]
  /** Persiste o fechamento em localStorage — sem ela o banner volta a cada recarga. */
  storageKey?: string
} & React.ComponentProps<"div">) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!storageKey) return
    try {
      if (localStorage.getItem(storageId(storageKey)) === "1") setDismissed(true)
    } catch {}
  }, [storageKey])

  if (dismissed) return null

  const Icon = VARIANT_ICON[variant ?? "info"]

  function dismiss() {
    setDismissed(true)
    if (storageKey) {
      try {
        localStorage.setItem(storageId(storageKey), "1")
      } catch {}
    }
  }

  return (
    <div role="status" className={cn(pageBannerVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm opacity-80">{description}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-md p-1 opacity-60 transition-colors hover:bg-current/10 hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
