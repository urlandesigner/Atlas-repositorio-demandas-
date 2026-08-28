# Atlas — Direção visual "Instrumento"

**Data:** 2026-08-28
**Status:** Aprovado para planejamento
**Objetivo:** Tirar o portal do genérico e dar a ele uma identidade própria, com impacto suficiente para uma apresentação ao corpo diretivo.

---

## 1. Problema

O Atlas hoje é *correto e invisível*. O diagnóstico concreto:

- **Cor:** azul/índigo `#3a4adf` — o accent mais comum de SaaS que existe.
- **Hierarquia plana:** todo conteúdo é retângulo branco arredondado com sombra suave e mesmo peso visual. Um KPI de carreira tem a mesma presença que um aviso do RH.
- **O dado mais valioso não tem drama:** prontidão no PDI e progressão na trilha — o coração do produto — aparecem como números pequenos dentro de caixinhas iguais às outras.
- **Zero assinatura:** não existe nenhum elemento que só o Atlas tem.

### Achados no código que definem o escopo

1. **`Open Sans` nunca foi carregado.** `--font-sans: Open Sans` está declarado em `globals.css`, mas apenas `JetBrains_Mono` é importado via `next/font` em `src/app/layout.tsx`. O app inteiro renderiza num fallback de sistema. A tipografia atual não é uma escolha — é um acidente. Substituí-la não quebra intenção nenhuma.
2. **O tema escuro existe e nunca foi ligado.** Há um bloco `.dark` completo em `globals.css`, mas não há theme provider e nada jamais adiciona a classe ao `<html>`. É código morto com estrutura de tokens aproveitável.
3. **Os componentes são token-based.** Apenas 30 ocorrências de `dark:` em 158 arquivos `.tsx`. Trocar os tokens retema o app inteiro automaticamente — é isso que torna o redesign viável sem reescrever 37 páginas.
4. **Tokens de sombra quebrados.** `--shadow-sm: -50px 2px 0px -50px hsl(... / 0.00)` e similares: deslocamento de -50px com opacidade zero. Lixo de um export do tweakcn; devem ser reescritos.
5. **Não existe header no desktop.** `AppHeader` é `md:hidden` por decisão explícita — no desktop as notificações vivem na sidebar e o conteúdo ocupa a altura toda.
6. **Já existe `LadderStepper`** (`src/components/profile/ladder-stepper.tsx`) operando sobre `LevelDef[]` com estados `done | current | future`, e `levelIndex()` em `src/lib/profile/store.ts`. O componente-assinatura evolui esse, não nasce do zero.

---

## 2. Direção escolhida: Instrumento

A carreira como **painel de precisão**. Fundo quase preto, dados que emitem luz, ouro de terminal financeiro no lugar do azul de SaaS.

Duas decisões tomadas junto ao usuário:

- **Escuro é o padrão, claro continua disponível.** Ambos os temas devem ser completos e legíveis.
- **Instrumento + assinatura.** O mundo escuro sozinho corre o risco de virar "mais um clone do Linear". A trilha de carreira vira elemento-assinatura recorrente para garantir a distinção.

**Princípio de contenção:** a ousadia é gasta em **um lugar só** — a Trilha e o herói de carreira. Cards, listas e formulários permanecem quietos e rigorosos. Colorido em tudo envelhece; colorido em um lugar vira assinatura.

---

## 3. Fundação: tokens e arquitetura de tema

### 3.1 Arquitetura

- Adicionar `next-themes` como dependência. Justificativa: não existe provider hoje, e o script inline anti-flash no SSR é a parte difícil de acertar à mão.
- Inverter a estrutura de `globals.css`: **`:root` passa a conter a paleta escura**; o tema claro vira o override (`.light`), consistente com "escuro é o padrão".
- `defaultTheme="dark"`, com `attribute="class"`.
- Reescrever os tokens de sombra quebrados.

### 3.2 Paleta — escuro (padrão)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#0B0C0E` | Fundo da aplicação |
| `--card` | `#121519` | Superfície nível 1 |
| `--popover` | `#171B20` | Superfície nível 2 (sheets, dropdowns) |
| `--muted` | `#1A1F25` | Preenchimento sutil |
| `--border` | `#1F242A` | Hairline padrão |
| `--hairline-strong` | `#2A3138` | Hairline visível (bordas de controle) |
| `--foreground` | `#E7E9ED` | Texto principal |
| `--muted-foreground` | `#8B94A2` | Texto secundário |
| `--primary` | `#E8B44A` | Ouro — acento único |
| `--primary-hover` | `#F5CE7E` | Ouro claro |
| `--primary-foreground` | `#0B0C0E` | Texto sobre ouro |

### 3.3 Paleta — claro

Não é uma inversão ingênua. É o mesmo instrumento sob luz do dia.

| Token | Valor |
|---|---|
| `--background` | `#EDEEF0` |
| `--card` | `#FFFFFF` |
| `--muted` | `#F3F4F6` |
| `--border` | `#DFE2E7` |
| `--hairline-strong` | `#C6CBD3` |
| `--foreground` | `#14171C` |
| `--muted-foreground` | `#5A626F` |
| `--primary` | `#E8B44A` (preenchimento) |
| `--primary-foreground` | `#1A1407` |
| `--accent-ink` | `#8A6212` (**novo token**) |

**Restrição crítica:** ouro tem contraste insuficiente sobre fundo claro. Texto e links com cor de acento no tema claro **devem** usar `--accent-ink`, nunca `--primary`. Sem esse token separado o tema claro sai ilegível.

### 3.4 Cores semânticas

**Restrição crítica:** o `warning` âmbar atual (`#f59e0b`) colide com o acento ouro — no tema escuro os dois ficam indistinguíveis. O `warning` deve migrar para laranja.

| Papel | Escuro | Claro |
|---|---|---|
| `success` | `#4ADE80` | `#15803D` |
| `warning` | `#FB923C` | `#C2410C` |
| `destructive` | `#F87171` | `#B91C1C` |
| `info` | `#60A5FA` | `#1D4ED8` |
| `impact` | `#A78BFA` | `#6D28D9` |

Estados semânticos nunca devem depender só de cor — sempre acompanhados de rótulo ou ícone.

### 3.5 Linguagem de elevação

No escuro, sombra não existe. Elevação é **superfície mais clara + hairline**:

- **Nível 0** — `--background`, sem borda.
- **Nível 1** (cards) — `--card` + 1px `--border`. Sem sombra no escuro; no claro mantém sombra suave.
- **Nível 2** (popover, sheet, dropdown) — `--popover` + 1px `--hairline-strong` + sombra real em ambos os temas, para separar do conteúdo abaixo.

---

## 4. Tipografia

A jogada mais forte da direção. É o mono nos dados que faz o produto ler como instrumento em vez de site.

- **Interface:** `Archivo` via `next/font/google` — grotesca industrial, pesos 400/500/600/700. Substitui o `Open Sans` que nunca carregou.
- **Dados:** `JetBrains Mono` — **já carregado hoje**, custo zero. Passa a ser obrigatório em todo número, label de caixa alta e timestamp, sempre com `font-variant-numeric: tabular-nums`.

### Escala

| Papel | Tamanho / entrelinha | Tracking | Peso | Família |
|---|---|---|---|---|
| Título de página | 34px / 1.06 | -0.025em | 600 | Archivo |
| Título de seção | 20px / 1.2 | -0.02em | 600 | Archivo |
| Título de card | 15px / 1.35 | -0.01em | 600 | Archivo |
| Corpo | 14px / 1.55 | 0 | 400 | Archivo |
| Meta | 12px / 1.45 | 0 | 400 | Archivo |
| Label | 10px / 1.2 | 0.14em, caixa alta | 500 | JetBrains Mono |
| Figura | 40px / 1 | -0.03em | 500 | JetBrains Mono |
| Figura grande | 56px / 1 | -0.035em | 500 | JetBrains Mono |

O salto de 14px (corpo) para 40px (figura) é o contraste que hoje não existe e que dá drama ao dado.

---

## 5. A assinatura: `Trilha`

Evolução de `LadderStepper`. Renderiza a escada de carreira como um trilho de instrumento.

### Dados

Consome o que já existe: `ProfileData.ladder` (`LevelDef[]`), `identity.levelId`, `goal.targetLevelId`, e `levelIndex()`. **Nenhuma mudança no modelo de dados.**

### Variantes

| Variante | Onde | Conteúdo |
|---|---|---|
| `hero` | Início (topo) | Trilho completo + rótulos de nível + medidor de prontidão |
| `detail` | Perfil, Competências | Trilho + detalhamento por competência |
| `mini` | Sidebar (desktop), gaveta (mobile) | Só o trilho, ~96px, tooltip no hover |

### Anatomia

- **Nós** por nível, com estados `done | current | future`. O nó atual ganha um anel pulsante.
- **Segmentos** entre nós: acesos em ouro no percurso já feito, apagados à frente.
- **Medidor de prontidão:** barras discretas acesas, **não** barra de progresso lisa. Cada evidência registrada acende um segmento — o gesto de registrar move um ponteiro. É o que transforma "83%" de número morto em leitura de instrumento.

### Comportamento

- A variante `mini` é persistente em todas as telas autenticadas: você sempre vê onde está. Essa onipresença é a assinatura.
- Animações: pulso do nó atual, acendimento de segmento ao registrar evidência, preenchimento do medidor na montagem.
- Toda animação respeita `prefers-reduced-motion`.
- Estado vazio (sem trilha configurada): a variante `mini` não renderiza; `hero` mostra convite para definir a meta de carreira.

---

## 6. Passe de componentes

A troca de tokens propaga sozinha. Estes precisam de intervenção manual:

| Componente | Motivo |
|---|---|
| `badge`, `status-badge` | As variantes `*-soft` são tintas claras; ficam erradas sobre fundo escuro |
| `button` | Primário passa a ouro com texto escuro; revisar `outline` e `ghost` no escuro |
| `progress`, `segmented-progress` | Viram medidores de instrumento |
| `metric-card` | Figura em mono, escala nova |
| `card`, `card-list` | Nova linguagem de elevação (superfície + hairline, sem sombra no escuro) |
| Tokens `--chart-*` | Retunar para fundo escuro |
| `login-hero-panel`, `login-form` | Gradiente azul atual é a primeira coisa que os diretores veem |
| `app-sidebar` | Passa a hospedar a `Trilha` variante `mini` |

---

## 7. Sequenciamento

1. **Fundação** — tokens, tema, tipografia. Cai nas 37 páginas de graça.
2. **Passe de componentes** — a tabela da seção 6.
3. **Trilha** — as três variantes e a integração na sidebar.
4. **Polimento do caminho da demo** — Login → Início → Perfil → Competências → Objetivos → Registros.
5. **Varredura do restante** — admin, gestão, projetos.

---

## 8. Fora de escopo

- Mudanças no modelo de dados ou nos stores.
- Novas funcionalidades.
- Redesenho da arquitetura de informação ou da navegação.
- Refatoração não relacionada à direção visual.

---

## 9. Critérios de sucesso

Verificáveis, não subjetivos:

1. Ambos os temas passam em WCAG AA: 4.5:1 para texto corrido, 3:1 para elementos de interface e texto grande.
2. Nenhum componente legível num tema e quebrado no outro. Nenhuma cor definida exclusivamente dentro de um bloco de tema.
3. A `Trilha` variante `mini` aparece em todas as telas autenticadas, desktop e mobile.
4. Todo número exibido usa JetBrains Mono com `tabular-nums`.
5. `npx tsc --noEmit` e `npm run build` limpos.
6. Nenhuma referência remanescente a `Open Sans` ou aos tokens de sombra quebrados.
7. O acento ouro nunca é usado como cor de texto sobre fundo claro.
