import type { StatusTone } from "@/components/ui/status-badge"
import type { ObjectiveStatus } from "@/lib/objectives/store"
import type { PresentationStatus } from "@/lib/presentations/store"
import type { ProjectStatus } from "@/types"

/**
 * Mapa único domínio → tom semântico. Estados equivalentes usam o mesmo tom
 * em todas as telas (antes cada página tinha sua própria paleta).
 */

export const OBJECTIVE_STATUS_TONE: Record<ObjectiveStatus, StatusTone> = {
  planned: "info",
  in_progress: "warning",
  done: "success",
  paused: "warning",
}

export const PROJECT_STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  active: "success",
  not_started: "neutral",
  paused: "warning",
  closed: "success",
  inactive: "danger",
}

export const PRESENTATION_STATUS_TONE: Record<PresentationStatus, StatusTone> = {
  done: "success",
  scheduled: "info",
  not_done: "danger",
}
