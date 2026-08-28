import { cn } from "@/lib/utils"

/** Escala visual de impacto 1–5 usada nos registros. */
function ImpactDots({
  level,
  max = 5,
  className,
  ...props
}: { level: number; max?: number } & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="impact-dots"
      role="img"
      aria-label={`Impacto ${level} de ${max}`}
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((dot) => (
        <div
          key={dot}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            dot <= level ? "bg-impact" : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

export { ImpactDots }
