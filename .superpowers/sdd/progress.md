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
Task 3: completa (commits 6697be6..c116aca, review limpa)
  Primeiro commit passou em todos os gates mas não mudou nenhum pixel: @layer base
  apontava body/h1-h4 para --font-editorial-sans = "CursorGothic", fonte que não
  existe no repo. Segunda fonte fantasma, além do Open Sans. Corrigido em c116aca.
  Controlador verificou no navegador: body e headings agora em Archivo.
  font-weight 400 do @layer base é inerte (todo h1-h4 real traz peso via Tailwind) —
  verificado independentemente pelo revisor.
Task 4: completa (commit 953c690, review limpa, sem achados)
  Varredura verificada: 0 text-primary residual, 8 text-primary-foreground preservados,
  nenhum falso positivo ouro-sobre-ouro. Controlador mediu no navegador: badge "Novo"
  no tema claro agora rgb(138,98,18) = #8A6212, contraste 5.47:1 (passa 4.5:1).

## RETOMAR AQUI
Próxima: Task 5 (Button). Depois: 6 (Card), 7 (medidores/figuras), 8 (Trilha),
9 (Trilha na sidebar), 10 (herói na Início), 11 (login), 12 (varredura final).

Como retomar:
  1. cd para o repo, confirmar branch: git branch --show-current  -> redesign/instrumento
  2. Invocar a skill superpowers:subagent-driven-development
  3. Ela lê este ledger e reinicia na primeira task não marcada como completa.
  4. Gerar o brief: scripts/task-brief docs/superpowers/plans/2026-08-28-atlas-instrumento.md 5

ARMADILHA RECORRENTE: o Turbopack serve CSS obsoleto com frequência neste projeto.
Se uma mudança de CSS não aparecer no navegador, pare o servidor, rm -rf .next e
reinicie ANTES de concluir que a implementação está errada. Isso já causou dois
diagnósticos falsos nesta sessão.

Estado dos gates no ponto de parada: tsc limpo, build limpo, check:contrast 0 falhas
nos dois temas, lint com os mesmos 13 erros pré-existentes (fora de escopo).
Task 5: completa (commit 32ebc55, review limpa, sem achados)
Task 6: completa (commit 842d04a, review limpa)
  Nota: no tema claro bg-muted/40 fica levemente mais ESCURO que o card (invertido
  em relação ao escuro). Aceito: é a convenção correta de rodapé em UI clara.
Task 7: completa (commit 27385e0, review limpa)
  Desvio aceito e confirmado empiricamente pelo revisor (offsets no CSS compilado):
  .figure (@layer utilities, font-size 40px) VENCE text-[28px] na cascata do
  Tailwind v4, porque ambas caem na mesma layer e .figure vem depois. Override de
  tamanho exige o modificador "!" -> text-[28px]!. A nota do plano dizia o contrário.
  Minor arquitetural (para triagem final): .figure/.figure-lg declaram font-size, o
  que obriga todo consumidor a usar "!" para mudar tamanho. Mais limpo seria separar
  "mono tabular" de "tamanho". Afeta Task 3; hoje só metric-card.tsx consome.
