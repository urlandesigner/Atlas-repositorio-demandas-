#!/usr/bin/env node
/**
 * Gera docs/design-system/tokens.json a partir de src/app/globals.css.
 *
 * globals.css é a ÚNICA fonte de verdade dos tokens do Atlas. Este script não
 * inventa nada: ele lê os blocos `:root` (tema escuro, padrão), `.light`
 * (override do tema claro) e `@theme inline` (a ponte para as utilities do
 * Tailwind v4) e reescreve o arquivo de tokens no formato W3C Design Tokens
 * Community Group (DTCG).
 *
 * O arquivo gerado é documentação/intercâmbio (Figma, Style Dictionary,
 * auditoria) — não é consumido em runtime. Se você editar tokens.json à mão,
 * a próxima execução sobrescreve. Edite globals.css e rode `npm run tokens:build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS_PATH = resolve(HERE, "../src/app/globals.css")
const OUT_DIR = resolve(HERE, "../docs/design-system")
const OUT_PATH = resolve(OUT_DIR, "tokens.json")

/* ───────────────────────── parse do CSS ───────────────────────── */

function extractBlock(css, selector) {
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

/* ───────────────────────── conversores DTCG ───────────────────────── */

function hexToComponents(hex) {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  return [0, 2, 4].map((i) => Number((parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)))
}

function colorToken(hex, description) {
  const components = hexToComponents(hex)
  if (!components) return null
  const token = {
    $type: "color",
    $value: { colorSpace: "srgb", components, alpha: 1, hex: hex.toUpperCase() },
  }
  if (description) token.$description = description
  return token
}

function dimension(raw) {
  const m = String(raw).trim().match(/^(-?[\d.]+)(px|rem|em)$/)
  if (!m) return null
  return { value: Number(m[1]), unit: m[2] }
}

/** "0 6px 18px rgba(123, 140, 255, 0.20)" → composite shadow do DTCG. */
function shadowLayer(raw) {
  const m = raw
    .trim()
    .match(/^(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s+(rgba?\([^)]*\))$/)
  if (!m) return null
  const [, x, y, blur, colorRaw] = m
  const nums = colorRaw.match(/[\d.]+/g).map(Number)
  const [r, g, b] = nums
  const alpha = nums.length > 3 ? nums[3] : 1
  const px = (v) => dimension(/^-?[\d.]+$/.test(v) ? `${v}px` : v)
  return {
    color: {
      colorSpace: "srgb",
      components: [r, g, b].map((v) => Number((v / 255).toFixed(4))),
      alpha,
    },
    offsetX: px(x),
    offsetY: px(y),
    blur: px(blur),
    spread: { value: 0, unit: "px" },
  }
}

function shadowToken(raw, description) {
  if (raw.trim() === "none") {
    return {
      $type: "shadow",
      $value: [],
      $description: description
        ? `${description} Valor "none": sem sombra neste tema.`
        : 'Valor "none": sem sombra neste tema.',
    }
  }
  // Divide em camadas respeitando os parênteses de rgba().
  const layers = []
  let depth = 0
  let buf = ""
  for (const ch of raw) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      layers.push(buf)
      buf = ""
    } else buf += ch
  }
  layers.push(buf)
  const parsed = layers.map(shadowLayer)
  if (parsed.some((p) => !p)) return null
  const token = { $type: "shadow", $value: parsed }
  if (description) token.$description = description
  return token
}

/* ───────────────────────── descrições curadas ─────────────────────────
   Ficam aqui, não no CSS, porque o CSS agrupa comentários por bloco e o DTCG
   pede descrição por token. Token sem descrição sai sem $description — e é
   sinal de que falta documentar. */

const DESCRICOES = {
  "--background": "Fundo da página. Elevação nível 0, sem borda.",
  "--card": "Superfície nível 1. Card, painel, linha de lista. Sempre com 1px --border.",
  "--card-foreground": "Texto sobre --card.",
  "--popover": "Superfície nível 2. Popover, sheet, dropdown, dialog. Leva --hairline-strong e sombra real nos dois temas.",
  "--popover-foreground": "Texto sobre --popover.",
  "--muted": "Preenchimento sutil. Hover de item, superfície secundária dentro de card.",
  "--muted-foreground": "Texto secundário. Meta, helper, label desativado.",
  "--accent": "Preenchimento de acento esmaecido (fundo de estado ativo).",
  "--accent-foreground": "Texto sobre --accent.",
  "--foreground": "Tinta principal. Corpo e títulos.",
  "--primary": "Acento índigo — PREENCHIMENTO de ação primária. Nunca use como cor de texto: para isso existe --accent-ink.",
  "--primary-hover": "Hover do preenchimento primário.",
  "--primary-foreground": "Glifo/texto sobre --primary.",
  "--accent-ink": "Acento em versão TEXTO — o par legível de --primary (>=4.5:1 sobre card e background nos dois temas). Links, destaques textuais.",
  "--brand": "Alias de marca de --primary. Mantido para superfícies de marca (login, hero).",
  "--brand-foreground": "Texto sobre --brand.",
  "--brand-muted": "Índigo esmaecido. Fundo de item de navegação ativo.",
  "--brand-muted-foreground": "Texto sobre --brand-muted.",
  "--gauge-on": "Segmento/nó ACESO de medidor sem glifo por cima (TrilhaGauge, Trilha mini). Cada tema usa o azul afinado ao seu fundo; verificado a 3:1 contra card, sidebar E contra --border (o segmento apagado).",
  "--secondary": "Quase-preto/quase-branco. Ação de alto contraste.",
  "--secondary-hover": "Hover de --secondary.",
  "--secondary-foreground": "Texto sobre --secondary.",
  "--border": "Hairline decorativo: divisória, separador, borda de card. O mais leve dos três.",
  "--hairline-chip": "Contorno de chip NÃO interativo (badge outline, status neutro). Deliberadamente abaixo de 3:1 — o significado está no rótulo. Se o chip virar controle, migre para --hairline-strong.",
  "--hairline-strong": "Contorno de controle interativo (botão outline, filter pill). 2,4:1 por decisão registrada — o controle nunca depende só da borda (rótulo >=4,5:1 + anel de foco a 3:1).",
  "--input": "Borda de campo de formulário. Mantido em 3:1: é onde a borda de fato identifica o controle.",
  "--ring": "Anel de foco. Verificado a 3:1 contra --background.",
  "--success": "Verde. Preenchimento/ícone de estado concluído.",
  "--success-foreground": "Verde em versão texto (>=4,5:1 sobre card).",
  "--warning": "Laranja. Preenchimento/ícone de atenção. Laranja, não âmbar, para não colidir com o acento.",
  "--warning-foreground": "Laranja em versão texto.",
  "--destructive": "Vermelho. Ação destrutiva e erro.",
  "--destructive-foreground": "Texto sobre preenchimento --destructive.",
  "--danger-foreground": "Vermelho em versão texto.",
  "--info": "Azul-céu. Estado planejado/informativo.",
  "--info-foreground": "Azul-céu em versão texto.",
  "--impact": "Violeta. Escala de impacto dos registros.",
  "--impact-foreground": "Violeta em versão texto.",
  "--chart-1": "Série 1 de gráfico.",
  "--chart-2": "Série 2 de gráfico.",
  "--chart-3": "Série 3 de gráfico.",
  "--chart-4": "Série 4 de gráfico.",
  "--chart-5": "Série 5 de gráfico.",
  "--sidebar": "Superfície da navegação lateral.",
  "--sidebar-foreground": "Texto da sidebar.",
  "--sidebar-primary": "Acento da sidebar (item ativo).",
  "--sidebar-primary-foreground": "Texto sobre o item ativo.",
  "--sidebar-accent": "Fundo de hover/ativo da sidebar.",
  "--sidebar-accent-foreground": "Texto sobre --sidebar-accent.",
  "--sidebar-border": "Hairline da sidebar.",
  "--sidebar-ring": "Anel de foco dentro da sidebar.",
  "--timeline-thinking": "Estágio 'pensando' da timeline de agente. Escopo fechado: só dentro da visualização de timeline.",
  "--timeline-grep": "Estágio 'buscando' da timeline de agente.",
  "--timeline-read": "Estágio 'lendo' da timeline de agente.",
  "--timeline-edit": "Estágio 'editando' da timeline de agente.",
  "--timeline-done": "Estágio 'concluído' da timeline de agente.",
  "--shadow-card": "Sombra do card. No escuro é 'none' por decisão: elevação no escuro é superfície mais clara, não sombra.",
  "--shadow-card-hover": "Sombra do card em hover. 'none' no escuro, pela mesma razão.",
  "--shadow-brand": "Halo índigo de superfície de marca.",
  "--shadow-2xs": "Escala genérica de sombra — nível 2xs.",
  "--shadow-xs": "Escala genérica de sombra — nível xs.",
  "--shadow-sm": "Escala genérica de sombra — nível sm.",
  "--shadow": "Escala genérica de sombra — nível base.",
  "--shadow-md": "Escala genérica de sombra — nível md.",
  "--shadow-lg": "Escala genérica de sombra — nível lg.",
  "--shadow-xl": "Escala genérica de sombra — nível xl.",
  "--shadow-2xl": "Escala genérica de sombra — nível 2xl.",
}

/** Agrupamento semântico usado na saída — espelha os comentários do globals.css. */
const GRUPOS = [
  ["superficie", ["--background", "--card", "--card-foreground", "--popover", "--popover-foreground", "--muted", "--muted-foreground", "--accent", "--accent-foreground"]],
  ["tinta", ["--foreground"]],
  ["acento", ["--primary", "--primary-hover", "--primary-foreground", "--accent-ink", "--brand", "--brand-foreground", "--brand-muted", "--brand-muted-foreground", "--gauge-on", "--secondary", "--secondary-hover", "--secondary-foreground"]],
  ["linha", ["--border", "--hairline-chip", "--hairline-strong", "--input", "--ring"]],
  ["semantica", ["--success", "--success-foreground", "--warning", "--warning-foreground", "--destructive", "--destructive-foreground", "--danger-foreground", "--info", "--info-foreground", "--impact", "--impact-foreground"]],
  ["grafico", ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]],
  ["sidebar", ["--sidebar", "--sidebar-foreground", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border", "--sidebar-ring"]],
  ["timeline", ["--timeline-thinking", "--timeline-grep", "--timeline-read", "--timeline-edit", "--timeline-done"]],
]

const SOMBRAS = ["--shadow-card", "--shadow-card-hover", "--shadow-brand", "--shadow-2xs", "--shadow-xs", "--shadow-sm", "--shadow", "--shadow-md", "--shadow-lg", "--shadow-xl", "--shadow-2xl"]

const nome = (t) => t.replace(/^--/, "")

/* ───────────────────────── montagem ───────────────────────── */

const css = readFileSync(CSS_PATH, "utf8")
const escuro = parseTokens(extractBlock(css, ":root"))
const claro = parseTokens(extractBlock(css, ".light"))
const theme = parseTokens(extractBlock(css, "@theme inline"))

const avisos = []

function montarCores(tokens, temaLabel) {
  const out = { $type: "color" }
  for (const [grupo, lista] of GRUPOS) {
    const g = {}
    for (const t of lista) {
      const raw = tokens[t]
      if (!raw) {
        avisos.push(`token ${t} ausente no tema ${temaLabel}`)
        continue
      }
      const tok = colorToken(raw, DESCRICOES[t])
      if (!tok) {
        avisos.push(`token ${t} (${temaLabel}) não é hex: "${raw}"`)
        continue
      }
      if (!DESCRICOES[t]) avisos.push(`token ${t} sem descrição curada`)
      g[nome(t)] = tok
    }
    out[grupo] = g
  }
  return out
}

function montarSombras(tokens, temaLabel) {
  const out = { $type: "shadow" }
  for (const t of SOMBRAS) {
    const raw = tokens[t]
    if (!raw) {
      avisos.push(`sombra ${t} ausente no tema ${temaLabel}`)
      continue
    }
    const tok = shadowToken(raw, DESCRICOES[t])
    if (!tok) {
      avisos.push(`sombra ${t} (${temaLabel}) não foi parseada: "${raw}"`)
      continue
    }
    out[nome(t)] = tok
  }
  return out
}

/** Escala de raio derivada de --radius, como o @theme inline calcula. */
function montarRaio() {
  const base = dimension(escuro["--radius"])
  if (!base) throw new Error("--radius não parseado")
  const remPorPx = 1 / 16
  const passos = [
    ["sm", -4, "Raio compacto — chip inline, ícone pequeno."],
    ["md", -2, "Raio de controle — botão, input. Aplicado como min(--radius-md, 8px)."],
    ["lg", 0, "Raio base — card, painel, popover. É o valor de --radius."],
    ["xl", 2, "Raio ampliado."],
    ["2xl", 4, "Raio ampliado."],
    ["3xl", 8, "Raio ampliado."],
    ["4xl", 12, "Raio máximo — badge pill do Badge (rounded-4xl)."],
  ]
  const out = { $type: "dimension" }
  for (const [k, deltaPx, desc] of passos) {
    const formula =
      deltaPx === 0 ? "var(--radius)" : `calc(var(--radius) ${deltaPx > 0 ? "+" : "-"} ${Math.abs(deltaPx)}px)`
    out[k] = {
      $value: { value: Number((base.value + deltaPx * remPorPx).toFixed(4)), unit: "rem" },
      $description: `${desc} ${formula}`,
    }
  }
  return out
}

const tokens = {
  $description:
    "Design tokens do Atlas. GERADO por scripts/build-tokens.mjs a partir de src/app/globals.css — não edite à mão. Formato W3C DTCG. Escuro é o tema padrão (:root); claro é override (.light).",
  $extensions: {
    "com.atlas.fonte": "src/app/globals.css",
    "com.atlas.geradoPor": "scripts/build-tokens.mjs",
    // Data local (sv-SE dá YYYY-MM-DD) — o slice do toISOString cai em UTC e
    // troca de dia à noite, desalinhando do commit.
    "com.atlas.geradoEm": new Date().toLocaleDateString("sv-SE"),
    "com.atlas.temaPadrao": "escuro",
    "com.atlas.camada":
      "Layer 2 (semântico). O Atlas não tem Layer 1 (paleta global numerada) nem Layer 3 (component tokens) — ver docs/design-system/foundation-spec.md, seção Lacunas.",
  },
  cor: {
    $description:
      "Um mesmo nome de token existe nos dois temas com valores diferentes. Componentes referenciam o NOME; o tema resolve o valor. Nenhuma cor pode existir em um tema só.",
    escuro: montarCores(escuro, "escuro"),
    claro: montarCores(claro, "claro"),
  },
  sombra: {
    $description:
      "No escuro, elevação é superfície mais clara + hairline; só o nível 2 (popover/sheet/dropdown) projeta sombra. Por isso --shadow-card é 'none' no escuro.",
    escuro: montarSombras(escuro, "escuro"),
    claro: montarSombras(claro, "claro"),
  },
  metrica: {
    $description: "Tokens sem variação por tema — valem igual no claro e no escuro.",
    raio: montarRaio(),
    espacamento: {
      $type: "dimension",
      base: {
        $value: dimension(escuro["--spacing"]),
        $description:
          "Unidade base da escala de espaçamento do Tailwind v4 (--spacing). Todo spacing do app é múltiplo dela: p-4 = 4 x base.",
      },
    },
    tracking: {
      $type: "dimension",
      normal: {
        $value: dimension(escuro["--tracking-normal"]) ?? { value: 0, unit: "em" },
        $description: "Tracking base do corpo. As variantes tight/wide do @theme derivam deste valor.",
      },
    },
  },
  tipografia: {
    $description:
      "Duas famílias, papéis separados: Archivo para interface, JetBrains Mono para DADO (todo número, timestamp e micro-label caixa alta).",
    familia: {
      $type: "fontFamily",
      sans: {
        $value: ["Archivo", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        $description: "Interface. Carregada via next/font/google em src/app/layout.tsx nos pesos 400/500/600/700.",
      },
      mono: {
        $value: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
        $description: "Dado. Obrigatória em número, medida e micro-label, sempre com font-variant-numeric: tabular-nums.",
      },
    },
    estilo: {
      $type: "typography",
      $description:
        "Os três estilos que existem como utility nomeada em globals.css (@layer utilities). O resto da escala é aplicado com classes Tailwind soltas — ver Lacunas no foundation-spec.",
      figure: {
        $value: {
          fontFamily: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
          fontSize: { value: 40, unit: "px" },
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: { value: -0.03, unit: "em" },
        },
        $description: "Classe .figure — número de destaque do produto. tabular-nums.",
      },
      "figure-lg": {
        $value: {
          fontFamily: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
          fontSize: { value: 56, unit: "px" },
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: { value: -0.035, unit: "em" },
        },
        $description: "Classe .figure-lg — número herói (Trilha, prontidão). tabular-nums.",
      },
      "label-mono": {
        $value: {
          fontFamily: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
          fontSize: { value: 10, unit: "px" },
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: { value: 0.14, unit: "em" },
        },
        $description: "Classe .label-mono — rótulo de instrumento, caixa alta.",
      },
    },
    tamanho: {
      $type: "dimension",
      xs: {
        $value: dimension(theme["--text-xs"]),
        $description:
          "Único degrau da escala tipográfica do Tailwind sobrescrito pelo Atlas (0.8125rem = 13px, contra 0.75rem do padrão).",
      },
    },
  },
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_PATH, JSON.stringify(tokens, null, 2) + "\n")

const nCores = GRUPOS.reduce((n, [, l]) => n + l.length, 0)
console.log(`tokens.json escrito: ${nCores} cores x 2 temas, ${SOMBRAS.length} sombras x 2 temas.`)
if (avisos.length) {
  console.log(`\n${avisos.length} aviso(s):`)
  for (const a of avisos) console.log(`  - ${a}`)
  process.exit(1)
}
console.log("Sem avisos: todo token esperado existe nos dois temas e está documentado.")
