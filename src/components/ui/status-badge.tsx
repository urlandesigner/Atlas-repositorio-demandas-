import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Tom semântico de status — o ÚNICO lugar do app que mapeia significado → cor.
 * Nunca usar classes de paleta crua (emerald-500, amber-500...) para status em páginas.
 */
export type StatusTone = "success" | "warning" | "info" | "neutral" | "danger" | "impact"

const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/12 text-success-foreground",
  warning: "border-warning/30 bg-warning/12 text-warning-foreground",
  info: "border-info/30 bg-info/12 text-info-foreground",
  danger: "border-destructive/30 bg-destructive/12 text-danger-foreground",
  neutral: "border-hairline-strong bg-muted text-muted-foreground",
  impact: "border-impact/30 bg-impact/12 text-impact-foreground",
}

export function StatusBadge({
  tone = "neutral",
  className,
  ...props
}: { tone?: StatusTone } & Omit<React.ComponentProps<typeof Badge>, "variant">) {
  return (
    <Badge
      variant="outline"
      data-tone={tone}
      className={cn(STATUS_TONE_CLASS[tone], className)}
      {...props}
    />
  )
}

export { STATUS_TONE_CLASS }
