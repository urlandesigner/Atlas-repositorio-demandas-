# Atlas — Direção visual "Instrumento" — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a identidade visual genérica do Atlas por uma direção "Instrumento" — escuro por padrão, acento ouro, dados em monoespaçada — com a trilha de carreira como componente-assinatura recorrente.

**Architecture:** O app é token-based (apenas 30 usos de `dark:` em 158 arquivos `.tsx`), então a troca de tokens em `globals.css` retema as 37 páginas automaticamente. O trabalho manual se concentra em: (a) um script de auditoria de contraste que serve de gate objetivo, (b) os componentes cujas variantes assumem fundo claro, e (c) o novo componente `Trilha`, que evolui o `LadderStepper` existente.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, `class-variance-authority`, `@base-ui/react`, `next-themes` (a adicionar), `next/font/google`.

## Global Constraints

Todo requisito abaixo vale implicitamente para **todas** as tasks.

- **Todos os tokens de cor devem ser escritos em hexadecimal.** Nada de `oklch()` — o script de auditoria da Task 1 faz o parse do `globals.css` e só entende hex.
- **O acento ouro `#E8B44A` nunca é cor de texto sobre fundo claro.** No tema claro, texto e links com cor de acento usam `--accent-ink` (`#8A6212`). Ouro vivo só em preenchimento.
- **`warning` nunca é âmbar.** Escuro `#FB923C`, claro `#C2410C`. O âmbar antigo (`#f59e0b`) colide com o acento ouro.
- **Estados semânticos nunca dependem só de cor** — sempre acompanhados de rótulo ou ícone.
- **Todo número exibido usa JetBrains Mono com `tabular-nums`** (classe utilitária `.figure`, criada na Task 3).
- **Contraste WCAG AA:** 4.5:1 para texto corrido, 3:1 para elementos de interface e texto grande, nos dois temas.
- **Nenhuma cor pode ser definida exclusivamente dentro de um bloco de tema.** Todo token existe no `:root`; `.light` apenas redefine.
- **Não alterar modelo de dados, stores, ou arquitetura de informação.** Ver seção "Fora de escopo" da spec.
- **Gates de cada task:** `npx tsc --noEmit` e `npm run build` devem passar limpos antes do commit. `npm run lint` **já falha na linha de base** com 13 erros pré-existentes, em arquivos fora do escopo deste redesign (`quick-capture.tsx`, `use-evolution-data.ts`, `auth-provider.tsx`, `hero-geometric.tsx`, `page-banner.tsx`, `use-mobile.ts`, entre outros). O gate real é: **nenhum erro novo nos arquivos que a task tocou**. Verifique com `npm run lint 2>&1 | grep <arquivo-tocado>`.
- Diretório de trabalho: `/Users/urlandipre/ProjetosYbera/Atlas (registros)/atlas-profissional`.

---

## Estrutura de arquivos

**Criar:**
- `scripts/check-contrast.mjs` — auditoria de contraste; lê `globals.css`, valida pares de tokens nos dois temas.
- `src/components/theme-provider.tsx` — wrapper de `next-themes`.
- `src/components/ui/theme-toggle.tsx` — controle de troca de tema.
- `src/components/career/trilha.tsx` — componente-assinatura, três variantes.
- `src/components/career/trilha-gauge.tsx` — medidor de prontidão em barras discretas.

**Modificar:**
- `src/app/globals.css` — paleta, tipografia, utilitários. Reescrita dos blocos `:root` (102-183), `.dark` (184-262) e `@theme inline` (7-101).
- `src/app/layout.tsx` — fonte Archivo, `ThemeProvider`, `suppressHydrationWarning`.
- `src/components/ui/badge.tsx` — variantes `*-soft` e `outline`.
- `src/components/ui/button.tsx` — variantes `default`, `outline`, `secondary`.
- `src/components/ui/metric-card.tsx` — figura em mono.
- `src/components/ui/progress.tsx` — tom `brand` → ouro.
- `src/components/ui/segmented-progress.tsx` — `bg-brand` → `bg-primary`.
- `src/components/profile/career-goal-card.tsx`, `src/components/profile/evolution-panel.tsx`, `src/components/evolution/career-context-bar.tsx` — migram de `LadderStepper` para `Trilha`.

**Remover:**
- `src/components/profile/ladder-stepper.tsx` — substituído por `Trilha`.
- `src/components/shell/app-sidebar.tsx` — hospeda `Trilha` variante `mini` e o `ThemeToggle`.
- `src/app/(app)/dashboard/page.tsx` — `CareerProgressCard` passa a usar `Trilha` variante `hero`.
- `src/components/auth/login-hero-panel.tsx` — cores do shader.
- `package.json` — dependência `next-themes`, script `check:contrast`.

---

### Task 1: Gate de contraste automatizado

Sem isso, todo o resto do plano é "achei que ficou bom". Esta task cria o teste que torna as Tasks 2-12 verificáveis.

**Files:**
- Create: `scripts/check-contrast.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: nada.
- Produces: comando `npm run check:contrast`. Sai com código 0 se todos os pares passam, 1 se algum falha. Usado como gate em todas as tasks seguintes.

- [ ] **Step 1: Escrever o script de auditoria**

Criar `scripts/check-contrast.mjs`:

```js
#!/usr/bin/env node
/**
 * Auditoria de contraste WCAG dos tokens de cor.
 * Faz o parse de src/app/globals.css, extrai os custom properties dos blocos
 * :root (tema escuro, padrão) e .light (tema claro), e valida os pares que
 * precisam ser legíveis. Falha com código 1 se algum par ficar abaixo do mínimo.
 *
 * Só entende cores em hexadecimal — ver Global Constraints do plano.
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS_PATH = resolve(HERE, "../src/app/globals.css")

/** Pares [textoToken, fundoToken, razãoMínima, descrição]. */
const PAIRS = [
  ["--foreground", "--background", 4.5, "texto principal sobre o fundo"],
  ["--foreground", "--card", 4.5, "texto principal sobre card"],
  ["--muted-foreground", "--background", 4.5, "texto secundário sobre o fundo"],
  ["--muted-foreground", "--card", 4.5, "texto secundário sobre card"],
  ["--card-foreground", "--card", 4.5, "texto do card"],
  ["--popover-foreground", "--popover", 4.5, "texto do popover"],
  ["--primary-foreground", "--primary", 4.5, "texto sobre o acento"],
  ["--secondary-foreground", "--secondary", 4.5, "texto sobre secundário"],
  ["--accent-ink", "--card", 4.5, "texto de acento sobre card"],
  ["--accent-ink", "--background", 4.5, "texto de acento sobre o fundo"],
  ["--success-foreground", "--card", 4.5, "texto de sucesso"],
  ["--warning-foreground", "--card", 4.5, "texto de alerta"],
  ["--danger-foreground", "--card", 4.5, "texto de erro"],
  ["--info-foreground", "--card", 4.5, "texto informativo"],
  ["--impact-foreground", "--card", 4.5, "texto de impacto"],
  ["--sidebar-foreground", "--sidebar", 4.5, "texto da sidebar"],
  ["--sidebar-primary-foreground", "--sidebar-primary", 4.5, "texto do item ativo da sidebar"],
  ["--hairline-strong", "--card", 3, "borda de controle sobre card"],
  ["--ring", "--background", 3, "anel de foco"],
]
// Nota: `--primary` contra `--background` NÃO é verificado de propósito.
// O ouro é cor de preenchimento, não de contorno: sua legibilidade é governada
// pelo par --primary-foreground/--primary (verificado acima) e sua perceptibilidade
// como controle vem da borda e do anel de foco. Exigir 3:1 de um preenchimento
// ouro contra fundo claro obrigaria a abandonar o ouro no tema claro.

function extractBlock(css, selector) {
  // Localiza `selector {` no início de uma linha e captura até a chave que fecha.
  const start = css.indexOf(`\n${selector} {`)
  if (start === -1) throw new Error(`Bloco "${selector}" não encontrado em globals.css`)
  const open = css.indexOf("{", start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}") {
      depth--
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  throw new Error(`Bloco "${selector}" não fecha`)
}

function parseTokens(block) {
  const tokens = {}
  for (const line of block.split("\n")) {
    const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i)
    if (m) tokens[m[1]] = m[2].trim()
  }
  return tokens
}

/** Resolve `var(--x)` encadeado, com limite para não travar em ciclo. */
function resolve_(tokens, name, depth = 0) {
  if (depth > 10) return null
  const raw = tokens[name]
  if (!raw) return null
  const varMatch = raw.match(/^var\((--[a-z0-9-]+)\)$/i)
  if (varMatch) return resolve_(tokens, varMatch[1], depth + 1)
  return raw
}

function hexToRgb(hex) {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function luminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function ratio(fg, bg) {
  const a = luminance(fg)
  const b = luminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const css = readFileSync(CSS_PATH, "utf8")
const themes = {
  escuro: parseTokens(extractBlock(css, ":root")),
  claro: parseTokens(extractBlock(css, ".light")),
}

let failures = 0
let skipped = 0

for (const [themeName, tokens] of Object.entries(themes)) {
  console.log(`\n── tema ${themeName} ──`)
  for (const [fgName, bgName, min, label] of PAIRS) {
    const fgRaw = resolve_(tokens, fgName)
    const bgRaw = resolve_(tokens, bgName)
    if (!fgRaw || !bgRaw) {
      console.log(`  SKIP  ${label} — token ausente (${!fgRaw ? fgName : bgName})`)
      skipped++
      continue
    }
    const fg = hexToRgb(fgRaw)
    const bg = hexToRgb(bgRaw)
    if (!fg || !bg) {
      console.log(`  SKIP  ${label} — cor não-hex (${!fg ? fgRaw : bgRaw})`)
      skipped++
      continue
    }
    const r = ratio(fg, bg)
    const ok = r >= min
    if (!ok) failures++
    console.log(
      `  ${ok ? "OK  " : "FALHA"}  ${r.toFixed(2)}:1 (mín ${min}) — ${label}`
    )
  }
}

console.log(`\n${failures} falha(s), ${skipped} pulado(s).`)
if (skipped > 0) {
  console.log("Pulados contam como falha: todo token deve existir e ser hex.")
}
process.exit(failures > 0 || skipped > 0 ? 1 : 0)
```

- [ ] **Step 2: Registrar o script no package.json**

Em `package.json`, dentro de `"scripts"`, adicionar a linha após `"lint": "eslint"`:

```json
    "lint": "eslint",
    "check:contrast": "node scripts/check-contrast.mjs"
```

- [ ] **Step 3: Rodar e confirmar que FALHA**

```bash
npm run check:contrast
```

Esperado: **exit 1**. O bloco `.light` ainda não existe, então o script deve lançar `Error: Bloco ".light" não encontrado em globals.css`. Essa falha é o vermelho do ciclo — confirma que o gate está lendo o arquivo real e não passando de graça.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-contrast.mjs package.json
git commit -m "Adiciona gate de auditoria de contraste WCAG dos tokens"
```

---

### Task 2: Paleta e arquitetura de tema

**Files:**
- Modify: `src/app/globals.css` (blocos `:root` linhas 102-183 e `.dark` linhas 184-262)
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/ui/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `npm run check:contrast` da Task 1.
- Produces: `<ThemeProvider>` (default export nomeado `ThemeProvider`), `<ThemeToggle />`, e o conjunto completo de tokens em hex nos blocos `:root` (escuro) e `.light` (claro). Todas as tasks seguintes assumem esses nomes de token.

- [ ] **Step 1: Instalar next-themes**

```bash
npm install next-themes
```

- [ ] **Step 2: Substituir o bloco `:root` pela paleta escura**

Em `src/app/globals.css`, substituir **todo** o bloco `:root { ... }` (linhas 102-183) por:

```css
:root {
  /* Superfícies — elevação no escuro é superfície mais clara, não sombra. */
  --background: #0B0C0E;
  --card: #121519;
  --card-foreground: #E7E9ED;
  --popover: #171B20;
  --popover-foreground: #E7E9ED;
  --muted: #1A1F25;
  --muted-foreground: #8B94A2;
  --accent: #1A1F25;
  --accent-foreground: #E8B44A;

  /* Tinta */
  --foreground: #E7E9ED;

  /* Acento ouro — único. */
  --primary: #E8B44A;
  --primary-hover: #F5CE7E;
  --primary-foreground: #0B0C0E;
  --accent-ink: #E8B44A;
  --brand: #E8B44A;
  --brand-foreground: #0B0C0E;
  --brand-muted: #2A2314;
  --brand-muted-foreground: #F0CE8C;

  --secondary: #E7E9ED;
  --secondary-hover: #C9CED6;
  --secondary-foreground: #0B0C0E;

  /* Linhas — `--border` é hairline decorativo; `--hairline-strong` é contorno
     de controle interativo e por isso precisa passar 3:1 contra o card. */
  --border: #1F242A;
  --hairline-strong: #61666B;
  --input: #61666B;
  --ring: #E8B44A;

  /* Semânticas — warning é laranja para não colidir com o ouro. */
  --success: #4ADE80;
  --success-foreground: #4ADE80;
  --warning: #FB923C;
  --warning-foreground: #FB923C;
  --destructive: #F87171;
  --destructive-foreground: #0B0C0E;
  --danger-foreground: #F87171;
  --info: #60A5FA;
  --info-foreground: #60A5FA;
  --impact: #A78BFA;
  --impact-foreground: #A78BFA;

  /* Charts — retunados para fundo escuro. */
  --chart-1: #E8B44A;
  --chart-2: #60A5FA;
  --chart-3: #4ADE80;
  --chart-4: #A78BFA;
  --chart-5: #F87171;

  /* Sidebar */
  --sidebar: #0F1113;
  --sidebar-foreground: #E7E9ED;
  --sidebar-primary: #E8B44A;
  --sidebar-primary-foreground: #0B0C0E;
  --sidebar-accent: #1A1F25;
  --sidebar-accent-foreground: #E8B44A;
  --sidebar-border: #1F242A;
  --sidebar-ring: #E8B44A;

  /* Timeline */
  --timeline-thinking: #DFA88F;
  --timeline-grep: #9FC9A2;
  --timeline-read: #9FBBE0;
  --timeline-edit: #C0A8DD;
  --timeline-done: #E8B44A;

  /* Sombras — no escuro só a elevação nível 2 projeta sombra. */
  --shadow-card: none;
  --shadow-card-hover: none;
  --shadow-brand: 0 6px 18px rgba(232, 180, 74, 0.18);
  --shadow-2xs: 0 1px 1px rgba(0, 0, 0, 0.30);
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.34);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.36), 0 2px 4px rgba(0, 0, 0, 0.28);
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.38), 0 4px 10px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.40), 0 8px 18px rgba(0, 0, 0, 0.32);
  --shadow-lg: 0 6px 12px rgba(0, 0, 0, 0.44), 0 16px 32px rgba(0, 0, 0, 0.36);
  --shadow-xl: 0 10px 20px rgba(0, 0, 0, 0.48), 0 24px 48px rgba(0, 0, 0, 0.40);
  --shadow-2xl: 0 18px 36px rgba(0, 0, 0, 0.54);

  /* Métrica */
  --radius: 0.75rem;
  --spacing: 0.25rem;
  --letter-spacing: 0em;
  --tracking-normal: 0em;
}
```

- [ ] **Step 3: Substituir o bloco `.dark` pelo bloco `.light`**

Substituir **todo** o bloco `.dark { ... }` (linhas 184-262) por — note que o seletor muda de `.dark` para `.light`:

```css
.light {
  --background: #EDEEF0;
  --card: #FFFFFF;
  --card-foreground: #14171C;
  --popover: #FFFFFF;
  --popover-foreground: #14171C;
  --muted: #F3F4F6;
  --muted-foreground: #5A626F;
  --accent: #F6F1E4;
  --accent-foreground: #8A6212;

  --foreground: #14171C;

  --primary: #E8B44A;
  --primary-hover: #D9A233;
  --primary-foreground: #1A1407;
  /* Ouro não tem contraste sobre fundo claro — texto de acento usa este token. */
  --accent-ink: #8A6212;
  --brand: #E8B44A;
  --brand-foreground: #1A1407;
  --brand-muted: #FAF3E2;
  --brand-muted-foreground: #8A6212;

  --secondary: #14171C;
  --secondary-hover: #2A2F38;
  --secondary-foreground: #FFFFFF;

  --border: #DFE2E7;
  --hairline-strong: #8E9197;
  --input: #8E9197;
  --ring: #A87D1B;

  --success: #16A34A;
  --success-foreground: #15803D;
  --warning: #FB923C;
  --warning-foreground: #C2410C;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --danger-foreground: #B91C1C;
  --info: #3B82F6;
  --info-foreground: #1D4ED8;
  --impact: #8B5CF6;
  --impact-foreground: #6D28D9;

  --chart-1: #A87D1B;
  --chart-2: #1D4ED8;
  --chart-3: #15803D;
  --chart-4: #6D28D9;
  --chart-5: #B91C1C;

  --sidebar: #F6F7F8;
  --sidebar-foreground: #14171C;
  --sidebar-primary: #8A6212;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #F6F1E4;
  --sidebar-accent-foreground: #8A6212;
  --sidebar-border: #DFE2E7;
  --sidebar-ring: #A87D1B;

  --timeline-thinking: #B96A45;
  --timeline-grep: #3F7A45;
  --timeline-read: #2C5E96;
  --timeline-edit: #6B4A9B;
  --timeline-done: #8A6212;

  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.05);
  --shadow-card-hover: 0 1px 2px rgba(15, 23, 42, 0.05), 0 14px 28px rgba(15, 23, 42, 0.075);
  --shadow-brand: 0 6px 18px rgba(185, 138, 30, 0.20);
  --shadow-2xs: 0 1px 1px rgba(15, 23, 42, 0.04);
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow: 0 2px 4px rgba(15, 23, 42, 0.06), 0 4px 10px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 3px 6px rgba(15, 23, 42, 0.07), 0 8px 18px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 6px 12px rgba(15, 23, 42, 0.08), 0 16px 32px rgba(15, 23, 42, 0.07);
  --shadow-xl: 0 10px 20px rgba(15, 23, 42, 0.09), 0 24px 48px rgba(15, 23, 42, 0.08);
  --shadow-2xl: 0 18px 36px rgba(15, 23, 42, 0.12);
}
```

- [ ] **Step 4: Registrar o token novo no `@theme inline`**

Em `src/app/globals.css`, dentro do bloco `@theme inline { ... }`, adicionar após a linha `--color-accent-foreground: var(--accent-foreground);`:

```css
  --color-accent-ink: var(--accent-ink);
```

- [ ] **Step 5: Rodar o gate de contraste**

```bash
npm run check:contrast
```

Esperado: **exit 0**, sem FALHA nem SKIP nos dois temas. Se algum par falhar, ajustar o token do tema correspondente até passar — não seguir adiante com falha.

- [ ] **Step 6: Criar o ThemeProvider**

Criar `src/components/theme-provider.tsx`:

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Escuro é o padrão do Atlas; claro é opcional. `next-themes` injeta o script
 * inline que evita o flash de tema errado na primeira pintura do SSR.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      themes={["dark", "light"]}
    >
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 7: Criar o ThemeToggle**

Criar `src/components/ui/theme-toggle.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme !== "light"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
    >
      {/* Antes de montar, o tema real é desconhecido — renderiza o ícone escuro
          para manter o markup do servidor e do cliente idênticos. */}
      {mounted && !isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
```

- [ ] **Step 8: Ligar o provider no layout**

Em `src/app/layout.tsx`, substituir o bloco `return (...)` inteiro da função `RootLayout` por:

```tsx
  return (
    <html
      lang="pt-BR"
      className={`${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
```

E adicionar o import, após a linha `import { TooltipProvider } from "@/components/ui/tooltip"`:

```tsx
import { ThemeProvider } from "@/components/theme-provider"
```

- [ ] **Step 9: Rodar todos os gates**

```bash
npm run check:contrast && npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os quatro passam. `check:contrast` imprime `0 falha(s), 0 pulado(s).`

- [ ] **Step 10: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/theme-provider.tsx src/components/ui/theme-toggle.tsx package.json package-lock.json
git commit -m "Inverte a paleta para escuro por padrão e liga o provider de tema"
```

---

### Task 3: Tipografia

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (bloco `@theme inline` e `@layer utilities`)

**Interfaces:**
- Consumes: tokens da Task 2.
- Produces: variável CSS `--font-archivo`; classes utilitárias `.figure`, `.figure-lg` e `.label-mono`, usadas nas Tasks 7, 8, 10 e 12.

- [ ] **Step 1: Carregar Archivo**

Em `src/app/layout.tsx`, substituir a linha de import da fonte e a constante por:

```tsx
import { Archivo, JetBrains_Mono } from "next/font/google"

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})
```

E incluir a variável no `<html>`:

```tsx
      className={`${archivo.variable} ${jetBrainsMono.variable} h-full antialiased`}
```

- [ ] **Step 2: Apontar os tokens de fonte para as fontes carregadas**

Em `src/app/globals.css`, no bloco `@theme inline`, substituir as duas linhas de fonte:

```css
  --font-sans: var(--font-archivo), system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, Menlo, monospace;
```

E remover as três ocorrências de `--font-sans: Open Sans, sans-serif;` que restam nos blocos `:root` e `.light` — a fonte agora vem só do `@theme inline`. Confirmar com:

```bash
grep -n "Open Sans" src/app/globals.css
```

Esperado: nenhuma saída.

- [ ] **Step 3: Criar os utilitários de figura e label**

Em `src/app/globals.css`, dentro do bloco `@layer utilities { ... }` existente, adicionar:

```css
  /* Números do produto: mono, tabular, tracking apertado. */
  .figure {
    font-family: var(--font-mono);
    font-size: 40px;
    line-height: 1;
    font-weight: 500;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  }

  .figure-lg {
    font-family: var(--font-mono);
    font-size: 56px;
    line-height: 1;
    font-weight: 500;
    letter-spacing: -0.035em;
    font-variant-numeric: tabular-nums;
  }

  /* Rótulo de instrumento: mono, caixa alta, muito espaçado. */
  .label-mono {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
```

- [ ] **Step 4: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam.

- [ ] **Step 5: Verificar que a fonte realmente carregou**

Iniciar o preview e conferir no navegador que `font-family` do `body` resolve para Archivo — não para um fallback de sistema. Usar a ferramenta de preview do harness (`preview_start` com o nome `atlas`) e executar no console da página:

```js
getComputedStyle(document.body).fontFamily
```

Esperado: a string começa com o nome gerado pelo `next/font` para Archivo (algo como `__Archivo_xxxxxx`). Se aparecer `Open Sans` ou `system-ui` na primeira posição, a fonte não carregou — revisar os Steps 1 e 2 antes de commitar.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "Troca Open Sans por Archivo e cria utilitários de figura em mono"
```

---

### Task 4: Badge, StatusBadge e legibilidade do acento

Dois problemas juntos, porque têm a mesma causa. Primeiro: as variantes `*-soft`
e os tons de `StatusBadge` assumem fundo claro — sobre `#0B0C0E` uma tinta a 10%
some. Segundo, e mais grave: **o app usa `text-primary` em 24 lugares**, e no tema
claro isso renderiza ouro `#E8B44A` sobre `#EDEEF0` — ilegível, e violação direta
da constraint global. Verificado visualmente no navegador após a Task 2: o badge
"Novo" fica praticamente invisível no tema claro.

**Files:**
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/status-badge.tsx`
- Modify (varredura `text-primary` → `text-accent-ink`): `src/app/(app)/professional/presentations/page.tsx`, `src/app/(app)/projects/page.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/app/design-system/page.tsx`, `src/components/ui/page-banner.tsx`, `src/components/ui/button.tsx`, `src/components/records/quick-capture.tsx`, `src/components/ui/empty-state-card.tsx`

**Interfaces:**
- Consumes: tokens da Task 2, em especial `--accent-ink` (ouro no escuro, `#8A6212` no claro).
- Produces: nomes de variante inalterados (`default`, `secondary`, `primary-soft`, `secondary-soft`, `destructive`, `outline`, `ghost`, `link`) e `StatusTone` inalterado (`success | warning | info | neutral | danger | impact`). Nenhum consumidor precisa mudar de API.

- [ ] **Step 1: Ajustar as variantes soft do Badge**

Em `src/components/ui/badge.tsx`, dentro de `badgeVariants`, substituir as variantes `primary-soft`, `secondary-soft` e `outline` por:

```tsx
        "primary-soft":
          "border-primary/25 bg-primary/15 text-accent-ink [a]:hover:bg-primary/25",
        "secondary-soft":
          "border-hairline-strong bg-muted text-foreground [a]:hover:bg-muted/70",
        destructive:
          "border-destructive/25 bg-destructive/15 text-danger-foreground focus-visible:ring-destructive/20 [a]:hover:bg-destructive/25",
        outline:
          "border-hairline-strong text-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
```

Racional: `secondary-soft` usava `text-secondary`, que no escuro é branco puro sobre fundo quase branco — ilegível. Passa a ser um chip neutro.

- [ ] **Step 2: Ajustar os tons do StatusBadge**

Em `src/components/ui/status-badge.tsx`, substituir `STATUS_TONE_CLASS` por:

```tsx
const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/12 text-success-foreground",
  warning: "border-warning/30 bg-warning/12 text-warning-foreground",
  info: "border-info/30 bg-info/12 text-info-foreground",
  danger: "border-destructive/30 bg-destructive/12 text-danger-foreground",
  neutral: "border-hairline-strong bg-muted text-muted-foreground",
  impact: "border-impact/30 bg-impact/12 text-impact-foreground",
}
```

- [ ] **Step 3: Varrer `text-primary` → `text-accent-ink`**

`text-primary` renderiza ouro. No tema escuro isso é legível; no claro, não.
`text-accent-ink` resolve para ouro no escuro e `#8A6212` no claro, então a troca
preserva a aparência escura e conserta a clara.

Substituir em todos os arquivos, **sem tocar em `text-primary-foreground`**
(que é outro token — a tinta escura *sobre* o ouro):

```bash
grep -rl 'text-primary\([^-]\|$\)' src --include="*.tsx" \
  | xargs sed -i '' 's/text-primary\([^-]\)/text-accent-ink\1/g; s/text-primary$/text-accent-ink/'
```

Depois conferir que nada de `text-primary` sobrou e que `text-primary-foreground` ficou intacto:

```bash
grep -rn 'text-primary\([^-]\|$\)' src --include="*.tsx"
grep -roh 'text-primary-foreground' src --include="*.tsx" | wc -l
```

Esperado: o primeiro comando não retorna nada; o segundo retorna um número maior que zero.

Atenção a `hover:text-primary` e `group-hover:text-primary` — a varredura também
os converte, o que é correto: a cor de destaque no hover tem o mesmo problema.

- [ ] **Step 4: Rodar os gates**

```bash
npx tsc --noEmit && npm run build
```

Esperado: ambos passam. Para o lint, confirmar que nenhum arquivo tocado ganhou erro novo:

```bash
npm run lint 2>&1 | grep -E "badge|status-badge|page-banner|empty-state-card|quick-capture|dashboard|projects|presentations|design-system" || echo "nenhum erro novo nos arquivos tocados"
```

- [ ] **Step 5: Verificar os dois temas no navegador**

Abrir `/dashboard` e `/professional/objectives` no preview, **nos dois temas**.
Alternar o tema com `localStorage.setItem('theme','light')` / `'dark'` seguido de reload
(o `ThemeToggle` só chega à sidebar na Task 9).

Confirmar especificamente: o badge `Novo` está legível no tema claro (era o caso
que falhava), e os badges `Em andamento`, `Definido pelo gestor` e `Influência`
estão legíveis nos dois temas. Nenhum badge pode sumir no fundo.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "Corrige badges para fundo escuro e usa accent-ink como texto de acento"
```

---

### Task 5: Button

**Files:**
- Modify: `src/components/ui/button.tsx`

**Interfaces:**
- Consumes: tokens da Task 2.
- Produces: nomes de variante e tamanho inalterados. Nenhum consumidor muda.

- [ ] **Step 1: Ajustar as variantes**

Em `src/components/ui/button.tsx`, dentro de `buttonVariants`, substituir as variantes `secondary`, `ghost` e `destructive` por:

```tsx
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:border-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/15 text-danger-foreground hover:bg-destructive/25 focus-visible:border-destructive/50 focus-visible:ring-destructive/20",
```

Racional: `secondary` usava `border-foreground bg-foreground text-background`, que no escuro produz um botão branco de alta saliência competindo com o acento ouro. Passa a usar os tokens `--secondary*`, que já são invertidos por tema.

A variante `default` não muda: ela já usa `bg-primary text-primary-foreground`, e os tokens da Task 2 a tornam ouro com tinta escura automaticamente.

- [ ] **Step 2: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam.

- [ ] **Step 3: Verificar no navegador**

Abrir `/dashboard`. Confirmar que o botão `Registrar progresso` está ouro com texto escuro, e que `Ver registros` (outline) tem borda visível. Trocar de tema e repetir.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "Ajusta variantes de botão para o acento ouro e fundo escuro"
```

---

### Task 6: Elevação de Card e CardList

**Files:**
- Modify: `src/components/ui/card.tsx`

**Interfaces:**
- Consumes: tokens da Task 2.
- Produces: API de `Card` inalterada. `CardList` herda a mudança automaticamente (é um `Card` com `gap-0 py-0`).

- [ ] **Step 1: Trocar sombra por hairline no CardFooter**

Em `src/components/ui/card.tsx`, na função `CardFooter`, substituir a string de classes por:

```tsx
        "flex items-center rounded-b-[12px] border-t border-border bg-muted/40 p-4 group-data-[size=sm]/card:p-3",
```

Racional: `bg-[color:var(--color-background)]/55` no escuro deixa o rodapé mais escuro que o card, invertendo a leitura de elevação. `bg-muted/40` mantém o rodapé um degrau acima em ambos os temas.

- [ ] **Step 2: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "Ajusta elevação do rodapé de card para leitura correta no escuro"
```

---

### Task 7: Medidores e figuras

**Files:**
- Modify: `src/components/ui/segmented-progress.tsx`
- Modify: `src/components/ui/progress.tsx`
- Modify: `src/components/ui/metric-card.tsx`

**Interfaces:**
- Consumes: `.figure` e `.label-mono` da Task 3.
- Produces: `SegmentedProgress` ganha a prop opcional `tone?: "primary" | "muted"` (padrão `"primary"`); `StepConnector` mantém a assinatura `{ filled?: boolean }`. `MetricCard` mantém sua API pública.

- [ ] **Step 1: Trocar `bg-brand` por `bg-primary` no SegmentedProgress**

Em `src/components/ui/segmented-progress.tsx`, substituir o corpo de `SegmentedProgress` e `StepConnector` por:

```tsx
function SegmentedProgress({
  segments,
  tone = "primary",
  className,
  ...props
}: { segments: boolean[]; tone?: "primary" | "muted" } & React.ComponentProps<"div">) {
  const completed = segments.filter(Boolean).length
  return (
    <div
      data-slot="segmented-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={segments.length}
      aria-valuenow={completed}
      className={cn("flex flex-1 gap-1", className)}
      {...props}
    >
      {segments.map((done, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            done
              ? tone === "primary"
                ? "bg-primary"
                : "bg-muted-foreground"
              : "bg-border"
          )}
        />
      ))}
    </div>
  )
}

/** Conector entre passos de um stepper — preenchido quando o passo já foi vencido. */
function StepConnector({
  filled = false,
  className,
  ...props
}: { filled?: boolean } & React.ComponentProps<"span">) {
  return (
    <span
      data-slot="step-connector"
      aria-hidden="true"
      className={cn("h-0.5 flex-1", filled ? "bg-primary" : "bg-border", className)}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Apontar o tom `brand` do Progress para o acento**

Em `src/components/ui/progress.tsx`, dentro de `TONE_CLASS`, substituir a linha do `brand`:

```tsx
  brand: "bg-primary",
```

- [ ] **Step 3: Passar a figura do MetricCard para mono**

Em `src/components/ui/metric-card.tsx`, substituir o parágrafo do valor e o do label por:

```tsx
        <p className="label-mono text-muted-foreground">{label}</p>
```

```tsx
      <p className="figure mt-2.5 text-[28px] text-foreground">
        {value}
        {suffix ? (
          <span className="ml-0.5 text-sm font-medium text-muted-foreground">{suffix}</span>
        ) : null}
      </p>
```

Nota: `.figure` traz família mono, `tabular-nums` e tracking; o `text-[28px]` sobrescreve o tamanho para caber no card de métrica, reservando 40px e 56px para o herói de carreira da Task 10.

- [ ] **Step 4: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam.

- [ ] **Step 5: Verificar no navegador**

Abrir `/dashboard`. Confirmar que os números dos cards de métrica estão em monoespaçada e que os dígitos alinham em colunas. Confirmar que nenhum medidor ficou azul.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/segmented-progress.tsx src/components/ui/progress.tsx src/components/ui/metric-card.tsx
git commit -m "Converte medidores para o acento ouro e figuras para monoespaçada"
```

---

### Task 8: Componente Trilha

O elemento-assinatura. Evolui `LadderStepper` sem alterar o modelo de dados.

**Files:**
- Create: `src/components/career/trilha-gauge.tsx`
- Create: `src/components/career/trilha.tsx`
- Delete: `src/components/profile/ladder-stepper.tsx`
- Modify: `src/components/profile/career-goal-card.tsx`
- Modify: `src/components/profile/evolution-panel.tsx`
- Modify: `src/components/evolution/career-context-bar.tsx`

**Interfaces:**
- Consumes: `LevelDef` de `@/lib/profile/types`, `levelIndex` de `@/lib/profile/store`, `SegmentedProgress` e `StepConnector` da Task 7, `.figure` e `.label-mono` da Task 3.
- Produces:
  - `TrilhaGauge({ value, segments?, className? }: { value: number; segments?: number; className?: string })` — medidor de barras discretas; `value` é 0-100, `segments` padrão 12.
  - `Trilha({ ladder, currentLevelId, targetLevelId?, readiness?, variant?, size?, showCurrentHint?, className? })` com `variant?: "hero" | "detail" | "mini"` (padrão `"detail"`), `size?: "sm" | "lg"` (padrão `"sm"`, só afeta `detail`) e `showCurrentHint?: boolean` (padrão `false`).
  - `LadderStepper` deixa de existir; seus três consumidores passam a usar `Trilha` diretamente.

- [ ] **Step 1: Criar o medidor**

Criar `src/components/career/trilha-gauge.tsx`:

```tsx
import { cn } from "@/lib/utils"

/**
 * Medidor de prontidão em barras discretas — leitura de instrumento, não barra
 * de progresso lisa. Cada barra acesa representa uma fatia da prontidão, de
 * modo que registrar evidência acende um segmento visível.
 */
export function TrilhaGauge({
  value,
  segments = 12,
  className,
}: {
  value: number
  segments?: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const lit = Math.round((clamped / 100) * segments)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label="Prontidão para o próximo nível"
      className={cn("flex items-end gap-[3px]", className)}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < lit
        // Altura crescente: o medidor sobe da esquerda para a direita.
        const height = 42 + Math.round((i / Math.max(1, segments - 1)) * 58)
        return (
          <span
            key={i}
            className={cn(
              "w-full rounded-[1px] transition-colors",
              on ? "bg-primary" : "bg-border"
            )}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Criar o componente Trilha**

Criar `src/components/career/trilha.tsx`:

```tsx
import { Check } from "lucide-react"

import { TrilhaGauge } from "@/components/career/trilha-gauge"
import { StepConnector } from "@/components/ui/segmented-progress"
import { levelIndex } from "@/lib/profile/store"
import type { LevelDef } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

type LevelState = "done" | "current" | "future"
export type TrilhaVariant = "hero" | "detail" | "mini"

function stateFor(index: number, currentIndex: number): LevelState {
  if (index < currentIndex) return "done"
  if (index === currentIndex) return "current"
  return "future"
}

const NODE_SIZE = {
  sm: "size-6",
  lg: "size-8",
} as const

function TrilhaNode({
  level,
  state,
  variant,
  size,
  showCurrentHint,
}: {
  level: LevelDef
  state: LevelState
  variant: TrilhaVariant
  size: "sm" | "lg"
  showCurrentHint: boolean
}) {
  const nodeSize =
    variant === "mini" ? "size-2" : variant === "hero" ? "size-7" : NODE_SIZE[size]

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          nodeSize,
          state === "done" && "bg-primary text-primary-foreground",
          state === "current" &&
            "bg-primary text-primary-foreground ring-2 ring-primary/35 ring-offset-2 ring-offset-card motion-safe:animate-pulse",
          state === "future" && "border border-hairline-strong bg-muted"
        )}
      >
        {variant !== "mini" && state === "done" ? (
          <Check className={size === "lg" ? "size-4" : "size-3.5"} />
        ) : null}
        {variant !== "mini" && state === "current" ? (
          <span className={cn("rounded-full bg-primary-foreground", size === "lg" ? "size-2.5" : "size-2")} />
        ) : null}
      </div>
      {variant !== "mini" ? (
        <span
          className={cn(
            "label-mono whitespace-nowrap",
            state === "current" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {level.name}
        </span>
      ) : null}
      {showCurrentHint && state === "current" && variant !== "mini" ? (
        <span className="text-[10px] font-medium text-primary">você está aqui</span>
      ) : null}
    </div>
  )
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
  ladder: LevelDef[]
  currentLevelId: string
  targetLevelId?: string
  readiness?: number
  variant?: TrilhaVariant
  size?: "sm" | "lg"
  showCurrentHint?: boolean
  className?: string
}) {
  if (!ladder.length) return null

  const currentIndex = levelIndex(ladder, currentLevelId)
  const currentLevel = ladder[currentIndex]
  const targetLevel = targetLevelId
    ? ladder[levelIndex(ladder, targetLevelId)]
    : undefined

  const track = (
    <div className="flex items-start">
      {ladder.map((level, index) => (
        <div key={level.id} className="flex flex-1 items-start last:flex-none">
          <TrilhaNode
            level={level}
            state={stateFor(index, currentIndex)}
            variant={variant}
            size={size}
            showCurrentHint={showCurrentHint}
          />
          {index < ladder.length - 1 ? (
            <StepConnector
              filled={index < currentIndex}
              className={
                variant === "mini" ? "mt-1" : variant === "hero" ? "mt-3.5" : size === "lg" ? "mt-4" : "mt-3"
              }
            />
          ) : null}
        </div>
      ))}
    </div>
  )

  if (variant === "mini") {
    const label = targetLevel
      ? `${currentLevel?.name ?? ""} → ${targetLevel.name}`
      : (currentLevel?.name ?? "")
    return (
      <div className={cn("flex flex-col gap-1.5", className)} title={label}>
        <span className="label-mono text-muted-foreground">Trilha</span>
        {track}
        <span className="truncate text-[11px] text-muted-foreground">{label}</span>
      </div>
    )
  }

  if (variant === "hero") {
    return (
      <div className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
        <div className="min-w-0 flex-1">
          <span className="label-mono text-muted-foreground">Trilha de carreira</span>
          <p className="mt-1.5 text-lg font-semibold tracking-tight">
            {currentLevel?.name ?? "Seu nível atual"}
            {targetLevel ? (
              <span className="text-muted-foreground"> → {targetLevel.name}</span>
            ) : null}
          </p>
          <div className="mt-4">{track}</div>
        </div>
        {typeof readiness === "number" ? (
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="label-mono text-muted-foreground">Prontidão</span>
            <p className="figure text-foreground">
              {Math.round(readiness)}
              <span className="ml-0.5 text-lg text-muted-foreground">%</span>
            </p>
            <TrilhaGauge value={readiness} className="h-10 w-36" />
          </div>
        ) : null}
      </div>
    )
  }

  return <div className={className}>{track}</div>
}
```

- [ ] **Step 3: Migrar os consumidores e remover o LadderStepper**

Três call sites passam props que a `Trilha` precisa honrar — uma fachada que as
aceitasse e ignorasse seria regressão silenciosa. Migrar cada um e apagar o arquivo.

Em `src/components/profile/career-goal-card.tsx`, trocar o import de
`LadderStepper` por `import { Trilha } from "@/components/career/trilha"` e a
chamada por:

```tsx
        <Trilha ladder={ladder} currentLevelId={currentLevelId} />
```

Em `src/components/profile/evolution-panel.tsx`, mesmo import, e a chamada por:

```tsx
          <Trilha
            ladder={ladder}
            currentLevelId={currentLevelId}
            size="lg"
            showCurrentHint
          />
```

Em `src/components/evolution/career-context-bar.tsx`, mesmo import, e a chamada por:

```tsx
        <Trilha ladder={ladder} currentLevelId={currentLevelId} size="sm" />
```

Depois remover o arquivo antigo:

```bash
git rm src/components/profile/ladder-stepper.tsx
```

Confirmar que não sobrou referência:

```bash
grep -rn "LadderStepper" src
```

Esperado: nenhuma saída.

- [ ] **Step 4: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam. Se o `tsc` acusar props não usadas em `LadderStepper`, elas são intencionais — mantêm a compatibilidade da assinatura; renomear para `_size`/`_showCurrentHint` só se o lint exigir.

- [ ] **Step 5: Verificar no navegador**

Abrir `/professional/profile` e confirmar que a trilha renderiza com nós ouro, rótulos em mono e o nó atual pulsando. Confirmar que o pulso some com movimento reduzido ativado no sistema.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/career src/components/profile src/components/evolution
git commit -m "Cria o componente Trilha com variantes hero, detail e mini"
```

---

### Task 9: Trilha fixa na sidebar

A onipresença é o que transforma a trilha em assinatura.

**Files:**
- Modify: `src/components/shell/app-sidebar.tsx`

**Interfaces:**
- Consumes: `Trilha` variante `mini` da Task 8, `ThemeToggle` da Task 2, `getProfileSnapshot`/`subscribeProfileStore`/`getProfileServerSnapshot` de `@/lib/profile/store`.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Adicionar os imports**

Em `src/components/shell/app-sidebar.tsx`, adicionar após a linha `import { useEffect } from "react"`:

```tsx
import { useSyncExternalStore } from "react"
```

E junto aos demais imports de componentes:

```tsx
import { Trilha } from "@/components/career/trilha"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeProfileStore,
} from "@/lib/profile/store"
```

- [ ] **Step 2: Criar o bloco da trilha**

Adicionar, antes da função `AppSidebar`:

```tsx
/** Trilha compacta na sidebar — a posição na carreira fica sempre visível. */
function SidebarTrilha() {
  const profile = useSyncExternalStore(
    subscribeProfileStore,
    getProfileSnapshot,
    getProfileServerSnapshot
  )

  if (!profile.ladder.length) return null

  return (
    <div className="px-4 group-data-[collapsible=icon]:hidden">
      <Trilha
        ladder={profile.ladder}
        currentLevelId={profile.identity.levelId}
        targetLevelId={profile.goal.targetLevelId}
        variant="mini"
      />
    </div>
  )
}
```

- [ ] **Step 3: Montar a trilha e o toggle no rodapé**

Em `AppSidebar`, dentro de `<SidebarFooter className="mt-4 gap-4 p-0 pb-4">`, substituir a primeira linha `<SidebarSeparator />` por:

```tsx
        <SidebarSeparator />
        <SidebarTrilha />
        <SidebarSeparator />
```

E, no bloco do card de usuário, adicionar o `ThemeToggle` ao lado do `DropdownMenu` — substituir a abertura `<DropdownMenu>` do card expandido por:

```tsx
              <ThemeToggle className="shrink-0 rounded-[10px] text-sidebar-foreground/62 hover:bg-muted hover:text-sidebar-foreground" />

              <DropdownMenu>
```

- [ ] **Step 4: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam.

- [ ] **Step 5: Verificar no navegador**

Confirmar que a trilha aparece na sidebar em `/dashboard`, `/projects`, `/professional/objectives` e `/people`. Colapsar a sidebar e confirmar que a trilha some sem deixar espaço vazio. Confirmar que o `ThemeToggle` alterna os temas e que a preferência sobrevive a um reload.

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/app-sidebar.tsx
git commit -m "Fixa a Trilha e o seletor de tema na sidebar"
```

---

### Task 10: Herói de carreira na Início

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Trilha` variante `hero` da Task 8.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Passar a trilha e o nível para o CareerProgressCard**

Em `src/app/(app)/dashboard/page.tsx`, adicionar os imports:

```tsx
import { Trilha } from "@/components/career/trilha"
import type { LevelDef } from "@/lib/profile/types"
```

- [ ] **Step 2: Substituir o corpo do CareerProgressCard**

Substituir a assinatura e o `<CardContent>` de `CareerProgressCard` por:

```tsx
function CareerProgressCard({
  ladder,
  currentLevelId,
  targetLevelId,
  targetRole,
  targetYear,
  readiness,
  recordCount,
  strongCount,
}: {
  ladder: LevelDef[]
  currentLevelId: string
  targetLevelId?: string
  targetRole?: string
  targetYear?: number | null
  readiness: number
  recordCount: number
  strongCount: number
}) {
  const evidenceLabel =
    recordCount === 0
      ? "Registre entregas para construir evidência para o próximo nível."
      : `${recordCount} ${recordCount === 1 ? "evidência sustenta" : "evidências sustentam"} sua evolução${
          strongCount ? ` · ${strongCount} ${strongCount === 1 ? "competência forte" : "competências fortes"}` : ""
        }.`

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-5">
        <Trilha
          ladder={ladder}
          currentLevelId={currentLevelId}
          targetLevelId={targetLevelId}
          readiness={readiness}
          variant="hero"
        />
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          {evidenceLabel}
          {targetRole ? ` Meta: ${targetRole}${targetYear ? ` até ${targetYear}` : ""}.` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/professional/evolution/radar" className={buttonVariants({ size: "sm" })}>
            <TrendingUp data-icon="inline-start" />
            Ver evolução
          </Link>
          <Link
            href="/professional/evolution/promotion"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Montar dossiê
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
      </CardContent>
```

- [ ] **Step 3: Atualizar a chamada**

`profile` já está em escopo na página (desestruturado por volta da linha 415 e usado em `profile.goal.targetRole`), então não é preciso adicionar nenhum `useSyncExternalStore`. Substituir a chamada de `<CareerProgressCard ... />` (por volta da linha 585) por:

```tsx
        <CareerProgressCard
          ladder={profile.ladder}
          currentLevelId={profile.identity.levelId}
          targetLevelId={profile.goal.targetLevelId}
          targetRole={profile.goal.targetRole}
          targetYear={profile.goal.targetYear}
          readiness={readiness}
          recordCount={records.length}
          strongCount={strongCount}
        />
```

Nota: a prop `currentLevelName` deixa de existir — a `Trilha` deriva o nível a partir de `ladder` + `currentLevelId`. Se a variável `currentLevel` ficar sem uso no arquivo após a troca, removê-la junto com os imports órfãos de `MetricCard`, `Overline` e `TrendingUp` que porventura sobrem.

- [ ] **Step 4: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam, sem aviso de import não utilizado.

- [ ] **Step 5: Verificar no navegador**

Abrir `/dashboard`. Confirmar que o herói mostra a trilha completa com nós, o percentual de prontidão em mono grande e o medidor de barras. Confirmar que a prontidão não aparece duplicada.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "Usa a Trilha como herói de carreira na Início"
```

---

### Task 11: Tela de login

Primeira coisa que os diretores veem.

**Files:**
- Modify: `src/components/auth/login-hero-panel.tsx`

**Interfaces:**
- Consumes: tokens da Task 2.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Trocar as cores do shader**

Em `src/components/auth/login-hero-panel.tsx`, substituir as props de cor do `HeroGeometric` por:

```tsx
        // tons do acento ouro para o shader (three não lê CSS vars)
        color1="#8A6212"
        color2="#E8B44A"
        speed={0.45}
```

E o fallback de carregamento, na definição do `dynamic`:

```tsx
  loading: () => <div className="absolute inset-0 bg-[#12100B]" />,
```

- [ ] **Step 2: Ajustar a tinta sobre o painel**

No mesmo arquivo, substituir as classes de texto do bloco de headline por:

```tsx
            <h1 className="text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-[#FBF6EA]">
              Evolução profissional, com método.
            </h1>
            <p className="max-w-md text-base leading-7 text-[#FBF6EA]/78">
              PDIs, objetivos e registros em ambiente confidencial.
            </p>
```

Nota: cores literais são aceitáveis aqui porque o painel é um mundo visual fixo sobre o shader, independente do tema — mesma exceção da regra de tokens aplicada a superfícies com imagem de fundo.

- [ ] **Step 3: Rodar os gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os três passam.

- [ ] **Step 4: Verificar no navegador**

Abrir `/login`. Confirmar que o painel está em tons de ouro, que o logo YberaGroup continua legível sobre o novo fundo e que o formulário à direita está no tema escuro.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/login-hero-panel.tsx
git commit -m "Alinha o painel de login ao acento ouro"
```

---

### Task 12: Varredura final e auditoria

**Files:**
- Modify: arquivos identificados pela varredura (a lista sai do Step 1).

**Interfaces:**
- Consumes: tudo das tasks anteriores.
- Produces: nada.

- [ ] **Step 1: Caçar cores cruas remanescentes**

```bash
grep -rn "bg-brand\|text-brand\|border-brand\|#3a4adf\|#2f3fc3\|#6d7ef7" src --include="*.tsx" --include="*.ts" --include="*.css"
```

Cada ocorrência precisa de decisão: usos de `bg-brand`/`text-brand` continuam válidos (o token `--brand` agora é ouro), mas **hexadecimais azuis literais** são resíduo e devem virar tokens. Corrigir cada hex literal encontrado.

- [ ] **Step 2: Caçar classes de paleta crua do Tailwind**

```bash
grep -rnE "(bg|text|border)-(blue|indigo|violet|emerald|amber|slate|gray|zinc)-[0-9]{2,3}" src --include="*.tsx"
```

Substituir cada ocorrência pelo token semântico correspondente (`--success`, `--warning`, `--info`, `--impact`, `--muted-foreground`). Estados semânticos devem usar `StatusBadge` em vez de classes cruas.

- [ ] **Step 3: Confirmar que não restou resíduo do tema antigo**

```bash
grep -rn "Open Sans\|CursorGothic\|-50px 2px 0px" src/app/globals.css
```

Esperado: nenhuma saída.

- [ ] **Step 4: Rodar todos os gates**

```bash
npm run check:contrast && npx tsc --noEmit && npm run lint && npm run build
```

Esperado: os quatro passam; `check:contrast` imprime `0 falha(s), 0 pulado(s).`

- [ ] **Step 5: Percorrer o caminho da demo nos dois temas**

Abrir, no tema escuro e depois no claro: `/login`, `/dashboard`, `/professional/profile`, `/professional/evolution`, `/professional/objectives`, `/professional/timeline`, `/projects`, `/people`.

Em cada tela, confirmar: nenhum texto ilegível, nenhuma borda invisível, nenhum badge sumido, nenhum número fora da monoespaçada, e a Trilha presente na sidebar.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Varre cores cruas remanescentes e fecha a auditoria dos dois temas"
```

---

## Rastreamento spec → tasks

| Requisito da spec | Task |
|---|---|
| §3.1 Arquitetura de tema, `next-themes`, `:root` escuro | 2 |
| §3.1 Tokens de sombra reescritos | 2 |
| §3.2 Paleta escura | 2 |
| §3.3 Paleta clara e `--accent-ink` | 2 |
| §3.4 Cores semânticas, `warning` laranja | 2 |
| §3.5 Linguagem de elevação | 2, 6 |
| §4 Archivo + mono para dados + escala | 3 |
| §5 Componente Trilha, três variantes | 8 |
| §5 Medidor de barras discretas | 8 |
| §5 `mini` persistente | 9 |
| §5 `hero` na Início | 10 |
| §6 Badge / StatusBadge | 4 |
| §6 Button | 5 |
| §6 Progress / SegmentedProgress | 7 |
| §6 MetricCard | 7 |
| §6 Card / CardList | 6 |
| §6 Tokens de chart | 2 |
| §6 Login | 11 |
| §6 Sidebar hospeda a Trilha | 9 |
| §9 Critérios 1 e 7 (contraste, ouro no claro) | 1, 2, 12 |
| §9 Critério 2 (sem cor só dentro de tema) | 2, 12 |
| §9 Critério 3 (Trilha onipresente) | 9 |
| §9 Critério 4 (números em mono) | 3, 7, 12 |
| §9 Critério 5 (`tsc`/`build` limpos) | todas |
| §9 Critério 6 (sem resíduo antigo) | 3, 12 |
