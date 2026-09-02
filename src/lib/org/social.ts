"use client"

// Camada social do diretório interno: perfil público editável (headline, bio,
// skills) + reconhecimentos (kudos) trocados entre colaboradores. Tudo aqui é
// informação que a pessoa aceita tornar pública na rede interna.

export type KudoType = "impacto" | "colaboracao" | "inovacao" | "mentoria" | "cultura"

export interface SocialProfile {
  userId: string
  headline: string
  bio: string
  skills: string[]
  updatedAt: string
}

export interface Kudo {
  id: string
  fromUserId: string
  toUserId: string
  type: KudoType
  message: string
  createdAt: string
}

export interface OrgSocialData {
  profiles: SocialProfile[]
  kudos: Kudo[]
}

export const ORG_SOCIAL_STORAGE_KEY = "atlas_org_social"
export const ORG_SOCIAL_STORAGE_EVENT = "atlas-org-social-change"

export const KUDO_TYPE_META: Record<
  KudoType,
  { emoji: string; label: string; helper: string }
> = {
  impacto: { emoji: "🚀", label: "Impacto", helper: "Entrega que moveu o ponteiro" },
  colaboracao: { emoji: "🤝", label: "Colaboração", helper: "Destravou o time" },
  inovacao: { emoji: "💡", label: "Inovação", helper: "Trouxe uma ideia nova" },
  mentoria: { emoji: "🌱", label: "Mentoria", helper: "Ajudou alguém a crescer" },
  cultura: { emoji: "💙", label: "Cultura", helper: "Fez o ambiente melhor" },
}

export const KUDO_TYPES = Object.keys(KUDO_TYPE_META) as KudoType[]

const seedDate = (day: string) => `2026-06-${day}T12:00:00.000Z`

const SOCIAL_SEED: OrgSocialData = {
  profiles: [
    {
      userId: "user-admin",
      headline: "Cuidando para que a área de Tecnologia cresça com contexto",
      bio: "Responsável pela estrutura da área: gestores, ciclos de PDI e aprovações. Acredita que carreira boa é carreira com evidência.",
      skills: ["Gestão de área", "Carreira", "Processos"],
      updatedAt: seedDate("01"),
    },
    {
      userId: "user-gestor",
      headline: "Coordenador · construindo times que aprendem juntos",
      bio: "Lidera o time de produto digital. Gosta de 1:1 sem pauta engessada e de PDI que sai do papel.",
      skills: ["Liderança", "1:1", "PDI", "Front-end"],
      updatedAt: seedDate("01"),
    },
    {
      userId: "user-colab",
      headline: "Full-stack apaixonado por DX e por entregar sem drama",
      bio: "Trabalha no squad de plataformas internas. Fora do código, é quem organiza o café da retro.",
      skills: ["React", "Next.js", "TypeScript", "UX"],
      updatedAt: seedDate("01"),
    },
    {
      userId: "user-colab-2",
      headline: "Product designer — do discovery ao handoff",
      bio: "Cuida da experiência dos produtos internos. Defensora de pesquisa contínua e de design system vivo.",
      skills: ["Product Design", "Design System", "Pesquisa"],
      updatedAt: seedDate("01"),
    },
  ],
  kudos: [
    {
      id: "kudo-seed-1",
      fromUserId: "user-gestor",
      toUserId: "user-colab",
      type: "impacto",
      message:
        "Migrou o painel inteiro para a nova stack sem nenhuma regressão. Entrega difícil, feita com calma e qualidade.",
      createdAt: seedDate("28"),
    },
    {
      id: "kudo-seed-2",
      fromUserId: "user-colab-2",
      toUserId: "user-colab",
      type: "colaboracao",
      message: "Sempre disponível pra destravar o time — mesmo quando o problema não é dele.",
      createdAt: seedDate("25"),
    },
    {
      id: "kudo-seed-3",
      fromUserId: "user-colab",
      toUserId: "user-colab-2",
      type: "inovacao",
      message:
        "O novo fluxo de onboarding que a Maria desenhou reduziu pela metade as dúvidas de quem chega.",
      createdAt: seedDate("22"),
    },
    {
      id: "kudo-seed-4",
      fromUserId: "user-admin",
      toUserId: "user-gestor",
      type: "mentoria",
      message: "Os 1:1 do time viraram referência na área. Liderança que forma gente.",
      createdAt: seedDate("18"),
    },
    {
      id: "kudo-seed-5",
      fromUserId: "user-gestor",
      toUserId: "user-colab-2",
      type: "cultura",
      message: "Puxou a retro mais honesta do trimestre. O time saiu mais leve e com plano.",
      createdAt: seedDate("15"),
    },
  ],
}

let cached: OrgSocialData | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalize(raw: unknown): OrgSocialData {
  if (!raw || typeof raw !== "object") return SOCIAL_SEED
  const data = raw as Partial<OrgSocialData>
  return {
    profiles: Array.isArray(data.profiles) ? data.profiles : SOCIAL_SEED.profiles,
    kudos: Array.isArray(data.kudos) ? data.kudos : SOCIAL_SEED.kudos,
  }
}

export function getOrgSocialSnapshot(): OrgSocialData {
  if (!isClient()) return SOCIAL_SEED
  if (cached) return cached

  const raw = localStorage.getItem(ORG_SOCIAL_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(ORG_SOCIAL_STORAGE_KEY, JSON.stringify(SOCIAL_SEED))
    cached = SOCIAL_SEED
    return SOCIAL_SEED
  }

  try {
    cached = normalize(JSON.parse(raw))
    return cached
  } catch {
    cached = SOCIAL_SEED
    return SOCIAL_SEED
  }
}

export function getOrgSocialServerSnapshot(): OrgSocialData {
  return SOCIAL_SEED
}

function save(data: OrgSocialData) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(ORG_SOCIAL_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event(ORG_SOCIAL_STORAGE_EVENT))
}

export function subscribeOrgSocialStore(onChange: () => void): () => void {
  if (!isClient()) return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== ORG_SOCIAL_STORAGE_KEY) return
    cached = null
    onChange()
  }
  const onLocal = () => onChange()
  window.addEventListener("storage", onStorage)
  window.addEventListener(ORG_SOCIAL_STORAGE_EVENT, onLocal)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(ORG_SOCIAL_STORAGE_EVENT, onLocal)
  }
}

// ---------- Consultas ----------

export function getSocialProfile(data: OrgSocialData, userId: string): SocialProfile | null {
  return data.profiles.find((profile) => profile.userId === userId) ?? null
}

export function getKudosReceived(data: OrgSocialData, userId: string): Kudo[] {
  return data.kudos
    .filter((kudo) => kudo.toUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function countKudosReceived(data: OrgSocialData, userId: string): number {
  return data.kudos.reduce((total, kudo) => (kudo.toUserId === userId ? total + 1 : total), 0)
}

// ---------- Mutações ----------

export function upsertSocialProfile(
  userId: string,
  patch: { headline: string; bio: string; skills: string[] }
) {
  const data = getOrgSocialSnapshot()
  const now = new Date().toISOString()
  const next: SocialProfile = {
    userId,
    headline: patch.headline.trim(),
    bio: patch.bio.trim(),
    skills: patch.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 8),
    updatedAt: now,
  }
  const exists = data.profiles.some((profile) => profile.userId === userId)
  save({
    ...data,
    profiles: exists
      ? data.profiles.map((profile) => (profile.userId === userId ? next : profile))
      : [...data.profiles, next],
  })
}

export function addKudo(input: {
  fromUserId: string
  toUserId: string
  type: KudoType
  message: string
}): Kudo {
  const message = input.message.trim()
  if (!message) throw new Error("Escreva uma mensagem para o reconhecimento.")
  if (input.fromUserId === input.toUserId) {
    throw new Error("Não dá para reconhecer a si mesmo. 😉")
  }
  const data = getOrgSocialSnapshot()
  const kudo: Kudo = {
    id: `kudo-${Math.random().toString(36).slice(2, 10)}`,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    type: input.type,
    message,
    createdAt: new Date().toISOString(),
  }
  save({ ...data, kudos: [kudo, ...data.kudos] })
  return kudo
}

export function removeKudo(id: string) {
  const data = getOrgSocialSnapshot()
  save({ ...data, kudos: data.kudos.filter((kudo) => kudo.id !== id) })
}

// ---------- Identidade visual determinística ----------

// Capas em cor sólida pastel: sempre a mesma para a mesma pessoa, todas na
// mesma família para a rede parecer "uma coisa só".
//
// Antes era duotone com um brilho radial por cima. Virou cor sólida, e com isso
// deixou de ser `style` inline e passou a ser CLASSE: estilo inline não tem como
// responder a `dark:`, então a capa antiga usava os mesmos oklch nos dois temas
// e no escuro ficava saturada demais para o resto da tela. Como classe, cada
// pastel tem seu par escuro.
//
// Os quatro primeiros são os pastéis do experimento da Início, que já tinham
// par claro/escuro medido (8,9 a 10,2:1 no texto sobre eles). Os dois últimos
// completam a roda para seis pessoas seguidas não repetirem cor.
const PERSON_COVERS = [
  "bg-[#D9F2E3] dark:bg-[#132A20]", // menta
  "bg-[#D6EBFB] dark:bg-[#13232F]", // céu
  "bg-[#FBE3CB] dark:bg-[#2E2117]", // pêssego
  "bg-[#DFDCFA] dark:bg-[#1E1C31]", // lavanda
  "bg-[#FBDCE6] dark:bg-[#2C1922]", // rosa
  "bg-[#F4EFD4] dark:bg-[#282618]", // areia
] as const

/**
 * Classe de fundo da capa de uma pessoa — estável para o mesmo nome.
 * Devolve classe, não estilo, porque o par escuro depende de `dark:`.
 */
export function getPersonCoverClassName(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997
  }
  return PERSON_COVERS[hash % PERSON_COVERS.length]
}
