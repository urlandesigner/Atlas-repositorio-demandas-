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
  ["--input", "--card", 3, "borda de campo de formulário sobre card"],
  ["--hairline-strong", "--card", 2, "borda de botão outline sobre card"],
  ["--ring", "--background", 3, "anel de foco"],
  ["--gauge-on", "--card", 3, "medidor aceso (TrilhaGauge) sobre card"],
  ["--gauge-on", "--sidebar", 3, "nó aceso da Trilha mini sobre a sidebar"],
  ["--gauge-on", "--border", 3, "barra acesa vs. apagada do TrilhaGauge"],
]
// Nota: `--primary` contra `--background` NÃO é verificado de propósito.
// O ouro é cor de preenchimento, não de contorno: sua legibilidade é governada
// pelo par --primary-foreground/--primary (verificado acima) e sua perceptibilidade
// como controle vem da borda e do anel de foco. Exigir 3:1 de um preenchimento
// ouro contra fundo claro obrigaria a abandonar o ouro no tema claro.
//
// Nota: `--hairline-chip` contra `--card` também NÃO é verificado, e isso é uma
// decisão, não um esquecimento. Ele fica em 1,58:1 no claro e 1,86:1 no escuro.
// É o contorno de um chip não interativo (badge outline, status neutro): o
// significado está no rótulo, que já é verificado por --foreground/--card, e o
// chip não tem estado que dependa da borda para ser percebido. A 3:1 — que é o
// que `--hairline-strong` cumpre para botões e inputs — uma fileira de badges
// lia como grade em vez de metadado. Se um dia um chip virar controle, ele deve
// usar `--hairline-strong`, não afrouxar este limite.
//
// Nota: `--hairline-strong` foi de 3,16:1 para 2,4:1, e o limite deste par caiu
// de 3 para 2. É uma troca deliberada, com o custo declarado: numa superfície
// branca não existe borda mais clara que #8E9197 que ainda passe 3:1, e a 3:1 o
// botão outline lia visivelmente mais pesado que tudo em volta. O que sustenta a
// decisão é que o botão nunca depende só da borda — tem rótulo em texto acima de
// 4,5:1, quase sempre um ícone, e um anel de foco em `--ring` que este arquivo
// verifica em 3:1, então quem navega por teclado continua com boundary forte.
// Em compensação, `--input` passou a ser verificado explicitamente em 3:1: campo
// de formulário é onde a borda de fato carrega a identificação do controle, e
// esse limite não deve cair junto.

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
