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
Task 2: completa (commit 28a65f6, review limpa)
  Desvios aceitos: preservou --font-editorial-sans (consumido por @layer base);
  removeu 6 entradas mortas de @theme inline; ThemeToggle usa useSyncExternalStore
  em vez de useState+useEffect (o padrão do brief dispara react-hooks/set-state-in-effect).
  Verificação visual do controlador: escuro e claro OK; tokens corretos no navegador
  após limpar .next (o dev server estava servindo CSS obsoleto).
  Achou defeito NO PLANO: text-primary (24 ocorrências, 9 arquivos) fica ilegível
  no tema claro. Task 4 ampliada para varrer text-primary -> text-accent-ink.
  Minor: @custom-variant dark segue vivo e é necessário (next-themes usa class="dark").
