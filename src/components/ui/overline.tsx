import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

/**
 * Micro-label de seção (uppercase, tracking largo). Antes havia 6 combinações
 * de tamanho/tracking espalhadas pelo app — este é o padrão único.
 * size="sm" (10px) para dentro de cards densos; default (11px) no resto.
 * Use `render` quando o label também é um heading real: <Overline render={<h2 />}>.
 */
function Overline({
  size = "default",
  className,
  render,
  ...props
}: useRender.ComponentProps<"p"> & { size?: "sm" | "default" }) {
  return useRender({
    defaultTagName: "p",
    props: mergeProps<"p">(
      {
        className: cn(
          "font-medium uppercase text-muted-foreground",
          size === "sm" ? "text-[10px] tracking-[0.14em]" : "text-[11px] tracking-[0.12em]",
          className
        ),
      },
      props
    ),
    render,
    state: { slot: "overline", size },
  })
}

export { Overline }
