import {
  Award,
  Building2,
  Check,
  Compass,
  FileText,
  Flag,
  Layers,
  Network,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Progress } from "@/components/ui/progress"
import type { Achievement } from "@/lib/profile/derive"
import { cn } from "@/lib/utils"
import { Overline } from "@/components/ui/overline"

const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  "first-record": FileText,
  "first-strategic": Compass,
  "first-mentorship": Users,
  "cross-team": Network,
  "org-impact": Building2,
  multidisciplinar: Layers,
  "leadership-10": Flag,
  "volume-50": Award,
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ACHIEVEMENT_ICON[achievement.id] ?? Award
  const { unlocked, progress } = achievement
  const showProgress = !unlocked && progress

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[12px] border p-4 transition-colors",
        unlocked ? "border-border/60 bg-card/[0.98]" : "border-dashed border-border/60 bg-muted/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            unlocked ? "bg-brand-muted text-brand-muted-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </div>
        {unlocked ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Check className="size-3" />
          </span>
        ) : null}
      </div>

      <div>
        <p className={cn("text-sm font-medium", !unlocked && "text-muted-foreground")}>
          {achievement.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{achievement.description}</p>
      </div>

      {showProgress ? (
        <div>
          <Progress
            value={Math.min(100, (progress.current / progress.target) * 100)}
            size="xs"
            tone="brand"
          />
          <p className="mt-1 text-2xs text-muted-foreground tabular-nums">
            {progress.current} / {progress.target}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <Overline render={<h2 />} className="text-muted-foreground/70">
          Conquistas
        </Overline>
        <span className="text-xs text-muted-foreground tabular-nums">
          {unlockedCount} de {achievements.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </section>
  )
}
