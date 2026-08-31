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
Task 8: completa (commits 364fd4f..f7e84d0, review limpa após 1 rodada de fix)
  Critical corrigido: o hint "você está aqui" usava text-primary (ouro), ~1.9:1 sobre
  card branco no tema claro. Era regressão vs o LadderStepper removido, que usava o
  token escurecido. CULPA DO PLANO: eu escrevi text-primary na emenda da Task 8,
  contradizendo a constraint global do próprio documento. Plano corrigido também.
  Após o fix: 5.47:1 no claro, 9.64:1 no escuro (medido e reconferido pelo revisor).
  Lição: o gate de contraste valida PARES DE TOKEN e nunca pegaria isso — o defeito
  era um componente usando token de preenchimento como cor de texto, num caminho
  (showCurrentHint) que só o EvolutionPanel ativa.
  Minor (triagem final): text-[10px] arbitrário em vez de token tipográfico (herdado
  do componente antigo); sem aria-current="step" no nó atual.
Task 9: completa (commits 86dd56d..528bad2, review + 1 rodada de fix)
  Important corrigido: o ThemeToggle na linha do card de usuário tirou ~34% da
  largura do texto e truncava o nome. Movido para o SidebarHeader, ao lado do
  SidebarTrigger. Verificado: scrollWidth == clientWidth, "Colaborador Demo" inteiro.
  Minor corrigido: separador + Trilha envolvidos em wrapper "contents" +
  group-data-[collapsible=icon]:hidden, somem juntos.
  FALSO POSITIVO da re-revisão: alegou que o 2o separador ficava órfão ao colapsar.
  Medi no navegador: separador em y=823 tem o bloco do avatar colapsado logo abaixo
  (y=840, h=44, display flex). A leitura estática ignorou o segundo bloco
  group-data-[collapsible=icon]:flex. Nenhuma ação necessária.
Task 10: completa (commits a9adb5a..c7f4a80, review limpa)
  Bug de layout encontrado e corrigido NO COMPONENTE (regra do usuário): na variante
  hero os 4 StepConnector tinham largura 0 e a folga entre TODOS os rótulos era 0 —
  ficavam encostados. Mesma classe do bug de badges que o usuário reportou no início
  da sessão. Causa: coluna shrink-0 + rótulo whitespace-nowrap consumindo a linha.
  Correção condicionada a variant==="hero": min-w-0 na coluna, w-full truncate no
  rótulo, min-w-3 no conector. detail e mini intocadas (verificado linha a linha).
  Controlador mediu em 1009px (pior caso, abaixo do range testado pelo agente):
  conectores 12px, nenhum rótulo truncado. Segura.
  Minor (triagem final): rótulo do hero sem title de fallback caso trunque; hoje
  inofensivo (ladder fixo em DEFAULT_LADDER, hero tem 1 consumidor só).
Task 11: completa (commits 714e42b..4ca53fc — 4 rodadas)
  A mais trabalhosa da sessão, e a maioria dos erros foi do plano/controlador:
  1. 714e42b: brief mandava ouro claro no shader -> chapa LARANJA, texto a 1.6-2.6:1.
     O painel azul antigo era ESCURO; trocar por ouro claro inverteu a luminosidade
     da tela e quebrou a própria direção "Instrumento".
  2. a2ced99: eu instruí "escureça até bater 4.5:1" -> agente escureceu tanto que o
     painel SUMIU. Métrica certa, alavanca errada: para texto sobre imagem a solução
     é scrim, não apagar a imagem. Erro meu de método.
  3. f41c030: scrim adicionado (correto), mas color2 #8A6212 + scrim 72%/90% ainda
     deixava o painel sem ouro visível.
  4. 4ca53fc (controlador): descobri que o shader ANIMA o gradiente — o painel oscila
     entre fases, e minhas capturas pegavam fases diferentes, o que explica os
     diagnósticos contraditórios. Faixa final #141005 -> #9C6F1A e scrim 58%/80%.
  Contraste do texto (medido pelo agente, varredura t=0-150s): headline 17.8:1,
  subtítulo 11.6:1 — o scrim resolveu com folga e liberou as cores para a composição.
  Achado estrutural do agente: hero-geometric.tsx tem mix(vec3(1.0), color, fadeMask)
  que puxa o canto inferior-esquerdo para BRANCO, limitando o contraste a 4.07:1 ali
  mesmo com cores pretas. O scrim contorna; a linha do shader segue como dívida.
Task 12: completa (commit ce58d8f)
  1 ocorrência corrigida (bg-emerald-500 -> bg-success no design-system).
  bg-brand/text-brand preservados: --brand hoje É ouro. Literais do login/shader
  preservados: three não lê CSS vars.
  Controlador verificou o "TypeError" que o agente reportou sem localizar: não
  reproduz em servidor limpo — eram resquícios de WebSocket HMR de instâncias mortas.
  Gates finais: check:contrast 0 falhas nos 2 temas, tsc limpo, build limpo,
  lint com os mesmos 13 pré-existentes.

TODAS AS 12 TASKS COMPLETAS. Próximo: revisão final da branch inteira.
