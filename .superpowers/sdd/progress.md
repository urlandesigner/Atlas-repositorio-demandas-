# Atlas — direção "Instrumento" — progresso

Plano: docs/superpowers/plans/2026-08-28-atlas-instrumento.md
Branch: redesign/instrumento
Base: 1a1ddbb

## Emendas ao plano (pre-flight)
- Task 8: o plano transformava LadderStepper numa fachada que aceitava e ignorava
  `size` e `showCurrentHint`, mas evolution-panel.tsx (size="lg" + showCurrentHint)
  e career-context-bar.tsx (size="sm") passam essas props — seria regressão
  silenciosa. Emendado: Trilha ganha `size` e `showCurrentHint`, os 3 call sites
  migram para Trilha, e LadderStepper é removido.

## Tasks
Task 1: completa (commit 6cdc9fc, review limpa)
  Minor (herdados do brief, para triagem final):
  - extractBlock depende de casamento exato "\n<sel> {" — frágil a reformatação do CSS
  - parseTokens exige declaração numa única linha
  - resolve_ não entende var(--x, fallback)
