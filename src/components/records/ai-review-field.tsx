"use client"

import { useState } from "react"
import { CheckIcon, PencilIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Overline } from "@/components/ui/overline"
import { Textarea } from "@/components/ui/textarea"

interface AIReviewFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function AIReviewField({ label, value, onChange }: AIReviewFieldProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="group flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <SparklesIcon className="size-3 text-impact shrink-0" />
        <Overline size="sm">
          {label}
        </Overline>
        {!editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
          </Button>
        )}
        {editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-success-foreground hover:text-success-foreground"
            onClick={() => setEditing(false)}
          >
            <CheckIcon />
          </Button>
        )}
      </div>

      {editing ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[60px] resize-none px-3 py-2 text-sm leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false)
          }}
        />
      ) : (
        <p
          className="text-sm leading-relaxed text-foreground cursor-text rounded-lg px-1 py-0.5 -mx-1 hover:bg-muted/50 transition-colors"
          onClick={() => setEditing(true)}
        >
          {value || (
            <span className="text-muted-foreground italic">Não identificado</span>
          )}
        </p>
      )}
    </div>
  )
}
