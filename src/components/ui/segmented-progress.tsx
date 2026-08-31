import { cn } from "@/lib/utils"

/**
 * Progresso em etapas discretas — um segmento por item, preenchido conforme o
 * estado daquele item (não precisa ser sequencial). Para progresso contínuo use Progress.
 */
function SegmentedProgress({
  segments,
  tone = "primary",
  className,
  ...props
}: { segments: boolean[]; tone?: "primary" | "muted" } & React.ComponentProps<"div">) {
  const completed = segments.filter(Boolean).length
  return (
    <div
      data-slot="segmented-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={segments.length}
      aria-valuenow={completed}
      className={cn("flex flex-1 gap-1", className)}
      {...props}
    >
      {segments.map((done, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            done
              ? tone === "primary"
                ? "bg-primary"
                : "bg-muted-foreground"
              : "bg-border"
          )}
        />
      ))}
    </div>
  )
}

/** Conector entre passos de um stepper — preenchido quando o passo já foi vencido. */
function StepConnector({
  filled = false,
  className,
  ...props
}: { filled?: boolean } & React.ComponentProps<"span">) {
  return (
    <span
      data-slot="step-connector"
      aria-hidden="true"
      className={cn("h-0.5 flex-1", filled ? "bg-primary" : "bg-border", className)}
      {...props}
    />
  )
}

export { SegmentedProgress, StepConnector }
