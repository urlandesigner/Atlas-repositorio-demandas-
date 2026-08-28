import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Tom semântico de status — o ÚNICO lugar do app que mapeia significado → cor.
 * Nunca usar classes de paleta crua (emerald-500, amber-500...) para status em páginas.
 */
export type StatusTone = "success" | "warning" | "info" | "neutral" | "danger" | "impact"

const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: "border-success/20 bg-success/10 text-success-foreground",
  warning: "border-warning/20 bg-warning/10 text-warning-foreground",
  info: "border-info/20 bg-info/10 text-info-foreground",
  danger: "border-destructive/20 bg-destructive/10 text-danger-foreground",
  neutral: "border-muted-foreground/20 bg-muted text-muted-foreground",
  impact: "border-impact/20 bg-impact/10 text-impact-foreground",
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
