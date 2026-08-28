"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control data-slot="slider-control" className="flex w-full touch-none items-center py-2 select-none">
        <SliderPrimitive.Track data-slot="slider-track" className="relative h-1.5 w-full rounded-full bg-muted select-none">
          <SliderPrimitive.Indicator data-slot="slider-indicator" className="rounded-full bg-brand select-none" />
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            className="size-4 rounded-full border border-brand bg-card shadow-sm outline-none transition-shadow select-none focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
