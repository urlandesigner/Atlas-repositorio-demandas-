import { Check } from "lucide-react";

import { TrilhaGauge } from "@/components/career/trilha-gauge";
import { StepConnector } from "@/components/ui/segmented-progress";
import { levelIndex } from "@/lib/profile/store";
import type { LevelDef } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type LevelState = "done" | "current" | "future";
export type TrilhaVariant = "hero" | "detail" | "mini";

function stateFor(index: number, currentIndex: number): LevelState {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "future";
}

/** Descrição textual do estado, para o `aria-label` de cada nó da Trilha. */
function stateDescription(state: LevelState, isNext: boolean): string {
  if (state === "done") return "concluído";
  if (state === "current") return "nível atual";
  return isNext ? "próximo nível" : "nível futuro";
}

const NODE_SIZE = {
  sm: "size-6",
  lg: "size-8",
} as const;

function TrilhaNode({
  level,
  state,
  variant,
  size,
  showCurrentHint,
  isNext,
}: {
  level: LevelDef;
  state: LevelState;
  variant: TrilhaVariant;
  size: "sm" | "lg";
  showCurrentHint: boolean;
  isNext: boolean;
}) {
  const isMini = variant === "mini";
  const nodeSize = isMini
    ? "size-2"
    : variant === "hero"
      ? "size-7"
      : NODE_SIZE[size];

  return (
    <div
      role="img"
      aria-label={`${level.name}, ${stateDescription(state, isNext)}`}
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "flex flex-col items-center gap-1.5",
        isMini ? "shrink-0" : "min-w-0",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          nodeSize,
          state === "done" &&
            (isMini ? "bg-gauge-on" : "bg-primary text-primary-foreground"),
          state === "current" &&
            cn(
              isMini ? "bg-gauge-on" : "bg-primary text-primary-foreground",
              "ring-2 ring-primary/35 ring-offset-2 ring-offset-card motion-safe:animate-pulse",
            ),
          state === "future" && "border border-hairline-strong bg-muted",
        )}
      >
        {variant !== "mini" && state === "done" ? (
          <Check className={size === "lg" ? "size-4" : "size-3.5"} />
        ) : null}
        {variant !== "mini" && state === "current" ? (
          <span
            className={cn(
              "rounded-full bg-primary-foreground",
              size === "lg" ? "size-2.5" : "size-2",
            )}
          />
        ) : null}
      </div>
      {variant !== "mini" ? (
        <span
          title={level.name}
          className={cn(
            "label-mono w-full truncate text-center",
            state === "current" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {level.name}
        </span>
      ) : null}
      {showCurrentHint && state === "current" && variant !== "mini" ? (
        <span className="text-3xs font-medium text-accent-ink">
          você está aqui
        </span>
      ) : null}
    </div>
  );
}

/**
 * Trilha de carreira — o elemento-assinatura do Atlas.
 * `hero` abre a Início, `detail` vive no Perfil, `mini` fica fixa na sidebar
 * para que a posição na trilha esteja sempre visível.
 */
export function Trilha({
  ladder,
  currentLevelId,
  targetLevelId,
  readiness,
  variant = "detail",
  size = "sm",
  showCurrentHint = false,
  className,
}: {
  ladder: LevelDef[];
  currentLevelId: string;
  targetLevelId?: string;
  readiness?: number;
  variant?: TrilhaVariant;
  size?: "sm" | "lg";
  showCurrentHint?: boolean;
  className?: string;
}) {
  if (!ladder.length) return null;

  const currentIndex = levelIndex(ladder, currentLevelId);
  const currentLevel = ladder[currentIndex];
  const targetLevel = targetLevelId
    ? ladder[levelIndex(ladder, targetLevelId)]
    : undefined;

  const track = (
    <div className="flex items-start">
      {ladder.map((level, index) => (
        // `min-w-0` no wrapper do segmento, não só no nó: sem ele o mínimo do
        // item flex é o min-content do conteúdo — a palavra "ESPECIALISTA" —, o
        // segmento se recusa a encolher e a fileira transborda o card por cima
        // do medidor em vez de truncar o rótulo.
        <div
          key={level.id}
          className="flex min-w-0 flex-1 items-start last:flex-none"
        >
          <TrilhaNode
            level={level}
            state={stateFor(index, currentIndex)}
            variant={variant}
            size={size}
            showCurrentHint={showCurrentHint}
            isNext={index === currentIndex + 1}
          />
          {index < ladder.length - 1 ? (
            <StepConnector
              filled={index < currentIndex}
              className={
                variant === "mini"
                  ? "mt-1"
                  : variant === "hero"
                    ? "mt-3.5 min-w-3"
                    : size === "lg"
                      ? "mt-4 min-w-3"
                      : "mt-3 min-w-3"
              }
            />
          ) : null}
        </div>
      ))}
    </div>
  );

  if (variant === "mini") {
    const label = targetLevel
      ? `${currentLevel?.name ?? ""} → ${targetLevel.name}`
      : (currentLevel?.name ?? "");
    return (
      <div className={cn("flex flex-col gap-1.5", className)} title={label}>
        <span className="label-mono text-muted-foreground">Trilha</span>
        {track}
        <span className="truncate text-2xs text-muted-foreground">
          {label}
        </span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      // Container query, não breakpoint de viewport. A Trilha hero vive em
      // larguras diferentes conforme a fileira que a hospeda, e `sm:` só sabe o
      // tamanho da janela: em 1024 o card tinha 459px e a linha continuava
      // horizontal, truncando os cinco rótulos para "SENIO…". Agora ela empilha
      // quando ela mesma está estreita, com o medidor abaixo do trilho.
      <div className={cn("@container", className)}>
        <div className="flex flex-col gap-5 @2xl:flex-row @2xl:items-end @2xl:justify-between">
          <div className="min-w-0 flex-1">
            <span className="label-mono text-muted-foreground">
              Trilha de carreira
            </span>
            <p className="mt-1.5 text-lg font-semibold tracking-tight">
              {currentLevel?.name ?? "Seu nível atual"}
              {targetLevel ? (
                <span className="text-muted-foreground">
                  {" "}
                  → {targetLevel.name}
                </span>
              ) : null}
            </p>
            <div className="mt-4">{track}</div>
          </div>
          {typeof readiness === "number" ? (
            <div className="flex shrink-0 flex-col items-start gap-2 @2xl:items-end">
              <span className="label-mono text-muted-foreground">
                Prontidão
              </span>
              <p className="figure text-foreground">
                {Math.round(readiness)}
                <span className="ml-0.5 text-lg text-muted-foreground">%</span>
              </p>
              <TrilhaGauge
                value={readiness}
                className="h-10 w-36"
                hideFromScreenReader
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return <div className={className}>{track}</div>;
}
