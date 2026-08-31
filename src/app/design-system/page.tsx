"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  FolderOpen,
  Info,
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
  Zap,
} from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRow,
  CardListRowMeta,
  CardListRowTitle,
  CardListRows,
} from "@/components/ui/card-list"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { Field } from "@/components/ui/field"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
import { ImpactDots } from "@/components/ui/impact-dots"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { ListRowButton } from "@/components/ui/list-row-button"
import { MetricCard } from "@/components/ui/metric-card"
import { OptionCard } from "@/components/ui/option-card"
import { Overline } from "@/components/ui/overline"
import { PageBanner } from "@/components/ui/page-banner"
import { PageHeader } from "@/components/ui/page-header"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import { SegmentedProgress, StepConnector } from "@/components/ui/segmented-progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { StatusBadge } from "@/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/* ─────────────────────────── estrutura da doc ─────────────────────────── */

function Section({
  id,
  title,
  file,
  usage,
  description,
  api,
  status,
  children,
}: {
  id: string
  title: string
  file: string
  usage: number
  description: string
  api?: string[]
  status?: "unused" | "needs-provider" | "heavy"
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex flex-col gap-4 rounded-[12px] border border-border bg-card p-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <Badge variant="outline" className="font-mono text-[11px] font-normal">
              {file}
            </Badge>
            {usage === 0 ? (
              <Badge variant="destructive">Nunca usado</Badge>
            ) : (
              <Badge variant="primary-soft">{usage} usos</Badge>
            )}
            {status === "needs-provider" ? <Badge variant="secondary-soft">Precisa de Provider</Badge> : null}
            {status === "heavy" ? <Badge variant="secondary-soft">Dependência pesada</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {api?.length ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {api.map((item) => (
                <code
                  key={item}
                  className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {item}
                </code>
              ))}
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="flex flex-wrap items-start gap-3 rounded-[10px] bg-muted/25 p-4">{children}</div>
      </div>
    </section>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

/* ─────────────────────────── demos que precisam de estado ─────────────────────────── */

function ToastDemo() {
  const { toast } = useToast()
  return (
    <Group label="variant">
      <Button size="sm" variant="outline" onClick={() => toast("Registro salvo")}>
        default
      </Button>
      <Button size="sm" variant="outline" onClick={() => toast("Entrega documentada", { variant: "success" })}>
        success
      </Button>
    </Group>
  )
}

function FilterPillDemo() {
  const [value, setValue] = useState("all")
  const options = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Ativo" },
    { value: "paused", label: "Pausado" },
    { value: "done", label: "Concluído" },
  ]
  return (
    <FilterPillGroup aria-label="Filtrar por status (demo)">
      {options.map((option) => (
        <FilterPill key={option.value} active={value === option.value} onClick={() => setValue(option.value)}>
          {option.label}
        </FilterPill>
      ))}
    </FilterPillGroup>
  )
}

function SegmentedControlDemo() {
  const [view, setView] = useState("grid")
  return (
    <SegmentedControl aria-label="Modo de visualização (demo)">
      <SegmentedControlItem active={view === "grid"} onClick={() => setView("grid")}>
        <LayoutGrid className="size-3.5" />
        Grade
      </SegmentedControlItem>
      <SegmentedControlItem active={view === "list"} onClick={() => setView("list")}>
        <List className="size-3.5" />
        Lista
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(true)
  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value)} />
        Notificar liderados
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox disabled />
        disabled
      </label>
    </>
  )
}

function SliderDemo() {
  const [value, setValue] = useState(6)
  return (
    <div className="flex w-64 flex-col gap-2">
      <Slider
        value={value}
        onValueChange={(v) => setValue(Array.isArray(v) ? (v[0] ?? 0) : v)}
        min={0}
        max={10}
        step={1}
      />
      <span className="text-xs text-muted-foreground">valor: {value}</span>
    </div>
  )
}

function OptionCardDemo() {
  const [selected, setSelected] = useState("clt")
  const options = [
    { value: "clt", title: "CLT", description: "Colaborador contratado em regime CLT." },
    { value: "pj", title: "PJ", description: "Prestador de serviço com contrato PJ." },
    { value: "estagio", title: "Estágio", description: "Contrato de estágio supervisionado." },
  ]
  return (
    <div className="grid w-full gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <OptionCard
          key={option.value}
          active={selected === option.value}
          onClick={() => setSelected(option.value)}
        >
          <span className="block text-sm font-medium text-foreground">{option.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
        </OptionCard>
      ))}
    </div>
  )
}

const SELECT_DEMO_LABEL: Record<string, string> = { active: "Ativo", paused: "Pausado", closed: "Concluído" }

function SelectDemo() {
  const [value, setValue] = useState("active")
  return (
    <>
      <Group label="size=default">
        <Select value={value} onValueChange={(v) => setValue(v as string)}>
          <SelectTrigger className="w-48">
            <SelectValue>{(v: string) => SELECT_DEMO_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="closed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </Group>
      <Group label="size=sm">
        <Select value={value} onValueChange={(v) => setValue(v as string)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue>{(v: string) => SELECT_DEMO_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
          </SelectContent>
        </Select>
      </Group>
      <Group label="side=top, alignItemWithTrigger=false">
        <Select value={value} onValueChange={(v) => setValue(v as string)}>
          <SelectTrigger className="w-48">
            <SelectValue>{(v: string) => SELECT_DEMO_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent side="top" alignItemWithTrigger={false}>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="closed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </Group>
    </>
  )
}

function DropdownMenuDemo() {
  const [showArchived, setShowArchived] = useState(true)
  const [sort, setSort] = useState("recent")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline">Filtros<ChevronDown data-icon="inline-end" /></Button>} />
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
          Mostrar arquivados
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as string)}>
          <DropdownMenuRadioItem value="recent">Mais recente</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name">Nome</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CommandDialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Abrir com ⌘K
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} showCloseButton>
        <CommandInput placeholder="Buscar..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => setOpen(false)}><FolderOpen className="size-4" />Projetos</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}><Target className="size-4" />Objetivos</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}><Bell className="size-4" />Avisos</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

/* ─────────────────────────── página ─────────────────────────── */

// SVG inline (sem dependência de rede) só pra provar que AvatarImage/imageUrl renderizam uma imagem de verdade.
const DEMO_AVATAR_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%233a4adf'/%3E%3Ccircle cx='32' cy='24' r='12' fill='%23ffffff' fill-opacity='0.85'/%3E%3Ccircle cx='32' cy='60' r='22' fill='%23ffffff' fill-opacity='0.85'/%3E%3C/svg%3E"

const NAV = [
  {
    group: "Fundamentos",
    items: [
      ["tokens", "Design tokens"],
      ["overline", "Overline"],
    ],
  },
  {
    group: "Ação e status",
    items: [
      ["button", "Button"],
      ["badge", "Badge"],
      ["status-badge", "StatusBadge"],
      ["filter-pill", "FilterPill"],
      ["segmented-control", "SegmentedControl"],
      ["alert", "Alert"],
      ["page-banner", "PageBanner"],
      ["toast", "Toast"],
      ["skeleton", "Skeleton"],
      ["impact-dots", "ImpactDots"],
    ],
  },
  {
    group: "Contêineres",
    items: [
      ["card", "Card"],
      ["card-list", "CardList"],
      ["empty-state-card", "EmptyStateCard"],
      ["separator", "Separator"],
      ["scroll-area", "ScrollArea"],
      ["tabs", "Tabs"],
      ["metric-card", "MetricCard"],
      ["progress", "Progress"],
      ["segmented-progress", "SegmentedProgress"],
      ["list-row-button", "ListRowButton"],
      ["page-header", "PageHeader"],
    ],
  },
  {
    group: "Formulário",
    items: [
      ["input", "Input"],
      ["input-group", "InputGroup"],
      ["textarea", "Textarea"],
      ["select", "Select"],
      ["checkbox", "Checkbox"],
      ["slider", "Slider"],
      ["field", "Field"],
      ["option-card", "OptionCard"],
    ],
  },
  {
    group: "Sobreposição",
    items: [
      ["dialog", "Dialog"],
      ["sheet", "Sheet"],
      ["popover", "Popover"],
      ["dropdown-menu", "DropdownMenu"],
      ["tooltip", "Tooltip"],
      ["command", "Command"],
    ],
  },
  {
    group: "Identidade",
    items: [
      ["avatar", "Avatar"],
      ["person-avatar", "PersonAvatar"],
    ],
  },
  {
    group: "Shell",
    items: [
      ["sidebar", "Sidebar"],
      ["notifications-popover", "NotificationsPopover"],
      ["hero-geometric", "HeroGeometric"],
    ],
  },
  { group: "Lacunas", items: [["gaps", "O que falta padronizar"]] },
] as const

const TOKENS = [
  ["--primary", "bg-primary", "Azul de marca. Ações primárias, links, destaques."],
  ["--primary-hover", "bg-primary-hover", "Hover do botão primário."],
  ["--brand-muted", "bg-brand-muted", "Azul claro. Estado ativo de navegação."],
  ["--secondary", "bg-secondary", "Quase preto. Ações de alto contraste."],
  ["--secondary-hover", "bg-secondary-hover", "Hover do botão secondary."],
  ["--destructive", "bg-destructive", "Vermelho. Ações destrutivas e erros."],
  ["--success", "bg-success", "Verde. Estados concluídos/positivos."],
  ["--warning", "bg-warning", "Âmbar. Estados de atenção/pausa."],
  ["--info", "bg-info", "Azul-céu. Estados planejados/informativos."],
  ["--impact", "bg-impact", "Violeta. Escala de impacto dos registros."],
  ["--muted", "bg-muted", "Cinza de fundo. Superfícies secundárias."],
  ["--background", "bg-background", "Fundo da página."],
  ["--card", "bg-card", "Fundo de card (branco no tema claro)."],
  ["--border", "bg-border", "Bordas e divisores."],
  ["--hairline-strong", "bg-hairline-strong", "Borda de botão outline — mais forte que --border."],
  ["--shadow-brand", "bg-brand shadow-brand", "Sombra azulada do logo da marca. Aplicada pela classe shadow-brand."],
] as const

const GAPS = [
  {
    title: "Tabs, Command e Skeleton continuam sem consumidor",
    detail:
      "3 primitivos implementados e documentados que nenhuma tela usa: Command seria a busca ⌘K natural, Skeleton cobriria os loadings hoje inexistentes e Tabs substituiria algum SegmentedControl.",
    fix: "Decidir por adotar ou remover do DS — decisão pendente de produto.",
  },
  {
    title: "setState síncrono em effects (dívida pré-existente)",
    detail:
      "A regra react-hooks/set-state-in-effect falha em use-mobile, auth-provider, ai-insights-panel, quick-capture, recognition-form-sheet e page-banner. É padrão anterior à padronização, não introduzido por ela.",
    fix: "Refatorar em lote para derivar estado na render ou usar subscribe/useSyncExternalStore.",
  },
  {
    title: "4 micro-labels inline fora do Overline (decisão consciente)",
    detail:
      "Em quick-capture.tsx os labels \"Projeto\"/\"Objetivo\" e os badges \"Fixo\" são <span> dentro de <span> — um <p> ali seria HTML inválido, e o badge usa text-[9px], fora da escala do componente.",
    fix: "Nenhuma — documentado como exceção legítima; se virarem bloco no futuro, migrar para o Overline.",
  },
  {
    title: "Cabeçalho da tabela de projetos fora do Overline",
    detail:
      "Em projects/page.tsx as classes uppercase vivem na <tr> do <thead> e são herdadas pelos <th>; o Overline é um <p> e destruiria a tabela.",
    fix: "Se quiser padronizar, aplicar as classes do Overline em cada <th> — hoje é a única ocorrência de micro-label em tabela.",
  },
] as const

export default function DesignSystemPage() {
  return (
    <ToastProvider>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 lg:flex-row lg:gap-8">
        {/* índice */}
        <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:w-56 lg:shrink-0 lg:overflow-y-auto">
          <p className="text-sm font-semibold tracking-tight">Design System</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Atlas · 41 primitivos</p>
          <nav className="mt-4 flex flex-col gap-4">
            {NAV.map((section) => (
              <div key={section.group} className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                  {section.group}
                </span>
                {section.items.map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* conteúdo */}
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Design System do Atlas</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Inventário dos 41 primitivos em <code className="font-mono text-xs">src/components/ui/</code>, com as
              variantes reais de cada um, quantas telas o usam e o que ainda falta padronizar. Base:{" "}
              <strong className="font-medium text-foreground">@base-ui/react</strong> (não Radix) — o polimorfismo usa a
              prop <code className="font-mono text-xs">render</code>, não <code className="font-mono text-xs">asChild</code>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary-soft">41 primitivos</Badge>
              <Badge variant="secondary-soft">~77 componentes de domínio</Badge>
              <Badge variant="destructive">3 sem adoção nas telas</Badge>
              <Badge variant="outline">4 lacunas mapeadas</Badge>
            </div>
          </header>

          {/* ─── tokens ─── */}
          <section id="tokens" className="scroll-mt-6">
            <div className="flex flex-col gap-4 rounded-[12px] border border-border bg-card p-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Design tokens</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Definidos em <code className="font-mono text-xs">globals.css</code> em OKLCH, com variantes para tema
                  claro e escuro. Prefira sempre o token à classe Tailwind crua.
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TOKENS.map(([token, bg, desc]) => (
                  <div key={token} className="flex items-start gap-3">
                    <div className={cn("mt-0.5 size-9 shrink-0 rounded-lg border border-border", bg)} />
                    <div className="min-w-0">
                      <code className="font-mono text-xs font-medium">{token}</code>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-[10px] border border-primary/20 bg-primary/10 px-4 py-3">
                <p className="text-sm font-medium text-accent-ink">Radius e densidade</p>
                <p className="mt-0.5 text-sm text-accent-ink/80">
                  <code className="font-mono text-xs">--radius: 0.75rem</code> · cards usam 12px fixo · a escala de
                  espaçamento parte de <code className="font-mono text-xs">--spacing: 0.25rem</code>.
                </p>
              </div>
            </div>
          </section>

          {/* ─── overline ─── */}
          <Section
            id="overline"
            title="Overline"
            file="overline.tsx"
            usage={16}
            description="Micro-label uppercase de seção. Substituiu 6 combinações diferentes de tamanho/tracking espalhadas em 16 arquivos — é o único padrão para rótulo de seção. Use render={<h2 />} quando o label também é o heading real da seção."
            api={["size: sm|default", "render"]}
          >
            <Group label="size">
              <div className="flex flex-col gap-2">
                <Overline>default — 11px, tracking 0.12em</Overline>
                <Overline size="sm">sm — 10px, tracking 0.14em (cards densos)</Overline>
              </div>
            </Group>
            <Group label="render (heading semântico)">
              <Overline render={<h2 />}>Sou um &lt;h2&gt;, não um &lt;p&gt;</Overline>
            </Group>
          </Section>

          {/* ─── ação e status ─── */}
          <Section
            id="button"
            title="Button"
            file="button.tsx"
            usage={55}
            description="Primitivo mais usado do app. 6 variantes e 8 tamanhos, incluindo icon-only. Ícones filhos aceitam data-icon para ajuste de padding."
            api={["variant: default|outline|secondary|ghost|destructive|link", "size: default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg", "render"]}
          >
            <Group label="variant">
              <Button size="sm">default</Button>
              <Button size="sm" variant="outline">outline</Button>
              <Button size="sm" variant="secondary">secondary</Button>
              <Button size="sm" variant="ghost">ghost</Button>
              <Button size="sm" variant="destructive">destructive</Button>
              <Button size="sm" variant="link">link</Button>
            </Group>
            <Group label="size">
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button size="default">default</Button>
              <Button size="lg">lg</Button>
            </Group>
            <Group label="icon">
              <Button size="icon-xs" variant="outline"><Plus /></Button>
              <Button size="icon-sm" variant="outline"><Plus /></Button>
              <Button size="icon" variant="outline"><Plus /></Button>
              <Button size="icon-lg" variant="outline"><Plus /></Button>
            </Group>
            <Group label="com ícone + estado">
              <Button size="sm"><Zap data-icon="inline-start" />Registrar</Button>
              <Button size="sm" variant="outline">Abrir<ArrowUpRight data-icon="inline-end" /></Button>
              <Button size="sm" disabled>disabled</Button>
            </Group>
            <Group label="render (polimorfismo, não é asChild)">
              <Button size="sm" variant="outline" nativeButton={false} render={<a href="#button">Sou um &lt;a&gt;, não um &lt;button&gt;</a>} />
            </Group>
          </Section>

          <Section
            id="badge"
            title="Badge"
            file="badge.tsx"
            usage={37}
            description="Pill compacta de altura fixa (h-5). As variantes primary-soft e secondary-soft existem para status que ficam ao lado de CTAs — as sólidas competem visualmente com botões primários."
            api={["variant: default|secondary|primary-soft|secondary-soft|destructive|outline|ghost|link", "render"]}
          >
            <Group label="sólidas (evitar perto de CTA)">
              <Badge>default</Badge>
              <Badge variant="secondary">secondary</Badge>
            </Group>
            <Group label="suaves (preferir para status)">
              <Badge variant="primary-soft">primary-soft</Badge>
              <Badge variant="secondary-soft">secondary-soft</Badge>
              <Badge variant="destructive">destructive</Badge>
            </Group>
            <Group label="neutras">
              <Badge variant="outline">outline</Badge>
              <Badge variant="ghost">ghost</Badge>
              <Badge variant="link">link</Badge>
            </Group>
            <Group label="render (badge clicável)">
              <Badge variant="outline" render={<a href="#badge">Sou um &lt;a&gt;</a>} />
            </Group>
          </Section>

          <Section
            id="status-badge"
            title="StatusBadge"
            file="status-badge.tsx"
            usage={10}
            description="Badge semântico de status sobre o Badge outline. É o ÚNICO lugar do app que mapeia significado → cor — nunca use classes de paleta crua (emerald, amber, sky...) para status em páginas. A tradução de cada domínio para tom (projeto, objetivo, apresentação) vive nos mapas de @/lib/status-tone."
            api={["tone: success|warning|info|neutral|danger|impact (default neutral)", "demais props do Badge, exceto variant"]}
          >
            <Group label="tone">
              <StatusBadge tone="success">Ativo</StatusBadge>
              <StatusBadge tone="warning">Pausado</StatusBadge>
              <StatusBadge tone="info">Planejado</StatusBadge>
              <StatusBadge tone="neutral">Não iniciado</StatusBadge>
              <StatusBadge tone="danger">Inativo</StatusBadge>
              <StatusBadge tone="impact">Alto impacto</StatusBadge>
            </Group>
          </Section>

          <Section
            id="filter-pill"
            title="FilterPill"
            file="filter-pill.tsx"
            usage={10}
            description="Chip de seleção única em formato pill (rounded-full), pra grupos de filtro tipo 'Todos / Ativo / Pausado'. Substituiu duas implementações hardcoded diferentes (Projetos usava Button, Registros tinha um <button> próprio) que pareciam a mesma coisa mas divergiam em forma e cor."
            api={["FilterPillGroup: role=group + aria-label obrigatório", "FilterPill: active?: boolean", "size: sm|default"]}
          >
            <Group label="grupo de seleção única (estado real)">
              <FilterPillDemo />
            </Group>
            <Group label='size="sm"'>
              <FilterPillGroup aria-label="Filtro compacto (demo)">
                <FilterPill size="sm" active>Todos</FilterPill>
                <FilterPill size="sm">Ativo</FilterPill>
                <FilterPill size="sm">Pausado</FilterPill>
              </FilterPillGroup>
            </Group>
          </Section>

          <Section
            id="segmented-control"
            title="SegmentedControl"
            file="segmented-control.tsx"
            usage={2}
            description="Alternador de visualização/modo (2–4 opções, sempre uma ativa), em caixa com fundo de card. Para filtros de lista use FilterPill; para trocar conteúdo em painéis use Tabs."
            api={["SegmentedControl: role=group + aria-label obrigatório", "SegmentedControlItem: active?: boolean"]}
          >
            <Group label="alternador de modo (estado real)">
              <SegmentedControlDemo />
            </Group>
          </Section>

          <Section
            id="alert"
            title="Alert"
            file="alert.tsx"
            usage={2}
            description="Bloco de aviso inline em grid, com título, descrição e ação opcional. Em uso no card de backup e no painel de 1:1 do liderado. Os variants success e warning usam os tokens --success e --warning."
            api={["variant: default|destructive|success|warning", "AlertTitle", "AlertDescription", "AlertAction"]}
          >
            <div className="flex w-full flex-col gap-3">
              <Alert>
                <Info />
                <AlertTitle>Ciclo de feedback aberto</AlertTitle>
                <AlertDescription>Registre seus avanços até o dia 19.</AlertDescription>
                <AlertAction>
                  <Button size="xs" variant="outline">Abrir</Button>
                </AlertAction>
              </Alert>
              <Alert variant="destructive">
                <Info />
                <AlertTitle>Não foi possível salvar</AlertTitle>
                <AlertDescription>Verifique os campos obrigatórios.</AlertDescription>
              </Alert>
              <Alert variant="success">
                <Check />
                <AlertTitle>Backup concluído</AlertTitle>
                <AlertDescription>Todos os registros foram exportados.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <Info />
                <AlertTitle>1:1 sem registro há 30 dias</AlertTitle>
                <AlertDescription>Agende uma conversa com o liderado.</AlertDescription>
              </Alert>
            </div>
          </Section>

          <Section
            id="page-banner"
            title="PageBanner"
            file="page-banner.tsx"
            usage={1}
            description="Banner informativo de topo de página, dispensável. Empurra o conteúdo para baixo em vez de flutuar. Hoje em uso na página de Projetos (variant padrão: info)."
            api={["title: string", "description: string", "variant: info|warning|destructive|success", "storageKey (persiste fechamento)", "...props de div"]}
          >
            <div className="flex w-full flex-col gap-3">
              <PageBanner
                variant="info"
                title="Para que serve esta página"
                description="variant=info (padrão) — mesma cor usada na página de Projetos."
              />
              <PageBanner
                variant="warning"
                title="Atenção"
                description="variant=warning — usa amber cru (sem token dedicado, mesma ressalva dos status hardcoded)."
              />
              <PageBanner
                variant="destructive"
                title="Algo deu errado"
                description="variant=destructive — usa o token --destructive."
              />
              <PageBanner
                variant="success"
                title="Tudo certo"
                description="variant=success — usa emerald cru (mesma ressalva do warning)."
              />
            </div>
          </Section>

          <Section
            id="toast"
            title="Toast"
            file="toast.tsx"
            usage={2}
            description="Implementação própria (não sonner, não base-ui): Context + hook imperativo. Pílula escura no rodapé, 2800ms de duração. Sem o ToastProvider o hook falha em silêncio, sem erro."
            api={["useToast() → toast(message, { variant, duration })", "variant: default|success", "ToastProvider"]}
            status="needs-provider"
          >
            <ToastDemo />
          </Section>

          <Section
            id="skeleton"
            title="Skeleton"
            file="skeleton.tsx"
            usage={1}
            description="Placeholder pulsante de carregamento. Sem variantes — as dimensões vêm por className."
            api={["className"]}
          >
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-28" />
            </div>
          </Section>

          <Section
            id="impact-dots"
            title="ImpactDots"
            file="impact-dots.tsx"
            usage={4}
            description="Escala visual de impacto 1–5 dos registros, pintada com o token --impact. Renderiza role=img com aria-label 'Impacto N de M' — acessível sem texto extra ao lado."
            api={["level: number", "max: number (default 5)", "...props de div"]}
          >
            <Group label="level={2}">
              <ImpactDots level={2} />
            </Group>
            <Group label="level={4}">
              <ImpactDots level={4} />
            </Group>
          </Section>

          {/* ─── contêineres ─── */}
          <Section
            id="card"
            title="Card"
            file="card.tsx"
            usage={36}
            description="Contêiner base. O Card já aplica o padding vertical (py-4) — não some outro py no CardContent, senão o padding duplica (bug recorrente já corrigido em 5 telas)."
            api={["size: default|sm", "CardHeader", "CardTitle", "CardDescription", "CardAction", "CardContent", "CardFooter"]}
          >
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Título do card</CardTitle>
                  <CardDescription>Descrição de apoio.</CardDescription>
                  <CardAction>
                    <Button size="xs" variant="ghost"><Star /></Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Conteúdo do card.</p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs text-muted-foreground">Rodapé</span>
                </CardFooter>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>size=sm</CardTitle>
                  <CardDescription>Densidade reduzida.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gap e padding menores.</p>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section
            id="card-list"
            title="CardList"
            file="card-list.tsx"
            usage={9}
            description="Composição sobre Card para listas com linhas divididas. O header é por props (title/description/action), não por children — diferente do Card."
            api={["CardListHeader: title, description, action", "CardListBody", "CardListRows", "CardListRow", "CardListRowTitle", "CardListRowMeta"]}
          >
            <div className="w-full">
              <CardList>
                <CardListHeader
                  title="Avisos"
                  description="Header recebe title/description/action por prop."
                  action={<Badge variant="outline">2</Badge>}
                />
                <CardListBody>
                  <CardListRows>
                    <CardListRow>
                      <div>
                        <CardListRowTitle>Primeira linha</CardListRowTitle>
                        <CardListRowMeta>Meta da linha</CardListRowMeta>
                      </div>
                      <Button size="xs" variant="outline">Ação</Button>
                    </CardListRow>
                    <CardListRow>
                      <div>
                        <CardListRowTitle>Segunda linha</CardListRowTitle>
                        <CardListRowMeta>Meta da linha</CardListRowMeta>
                      </div>
                      <Button size="xs" variant="outline">Ação</Button>
                    </CardListRow>
                  </CardListRows>
                </CardListBody>
              </CardList>
            </div>
          </Section>

          <Section
            id="empty-state-card"
            title="EmptyStateCard"
            file="empty-state-card.tsx"
            usage={13}
            description="Estado vazio com borda tracejada e ação opcional. size=compact para painéis/cards, size=page para o corpo inteiro de uma página (mais respiro + ícone em destaque). title e description são obrigatórios e tipados como string (não ReactNode)."
            api={["title: string", "description: string", "action?: ReactNode", "icon?: LucideIcon", "size: compact|page (default compact)", "...props de div"]}
          >
            <div className="flex w-full flex-col gap-3">
              <EmptyStateCard
                title="Nenhum projeto cadastrado"
                description="size=compact (default) — para painéis e cards."
                action={<Button size="sm"><Plus data-icon="inline-start" />Novo projeto</Button>}
              />
              <EmptyStateCard
                size="page"
                icon={FolderOpen}
                title="Nenhum projeto cadastrado"
                description="size=page com icon — para o corpo inteiro de uma página vazia."
                action={<Button size="sm"><Plus data-icon="inline-start" />Novo projeto</Button>}
              />
            </div>
          </Section>

          <Section
            id="separator"
            title="Separator"
            file="separator.tsx"
            usage={4}
            description="Divisor horizontal ou vertical."
            api={["orientation: horizontal|vertical"]}
          >
            <div className="flex w-full flex-col gap-3">
              <Separator />
              <div className="flex h-10 items-center gap-3">
                <span className="text-xs text-muted-foreground">esquerda</span>
                <Separator orientation="vertical" />
                <span className="text-xs text-muted-foreground">direita</span>
              </div>
            </div>
          </Section>

          <Section
            id="scroll-area"
            title="ScrollArea"
            file="scroll-area.tsx"
            usage={4}
            description="Contêiner com scrollbar customizada. Ganhou a prop orientation nesta auditoria — antes só existia a vertical embutida, sem forma de expor a horizontal."
            api={["orientation: vertical|horizontal|both (default vertical)"]}
          >
            <Group label="orientation=vertical (default)">
              <ScrollArea className="h-32 w-full rounded-[10px] border border-border bg-card">
                <div className="flex flex-col gap-2 p-3">
                  {Array.from({ length: 12 }, (_, i) => (
                    <p key={i} className="text-sm text-muted-foreground">Linha {i + 1} de conteúdo rolável</p>
                  ))}
                </div>
              </ScrollArea>
            </Group>
            <Group label="orientation=horizontal">
              <ScrollArea orientation="horizontal" className="w-full rounded-[10px] border border-border bg-card">
                <div className="flex w-max gap-2 p-3">
                  {Array.from({ length: 12 }, (_, i) => (
                    <span key={i} className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-border text-xs text-muted-foreground">
                      Item {i + 1}
                    </span>
                  ))}
                </div>
              </ScrollArea>
            </Group>
          </Section>

          <Section
            id="tabs"
            title="Tabs"
            file="tabs.tsx"
            usage={0}
            description="Existe com duas variantes de lista e nunca foi importado. Cinco telas implementaram abas/filtros à mão com botões e aria-pressed. Atenção: keepMounted é fixo — todos os painéis ficam montados."
            api={["TabsList variant: default|line", "Tabs orientation", "TabsTrigger value", "TabsContent"]}
          >
            <div className="flex w-full flex-col gap-5">
              <Tabs defaultValue="a">
                <TabsList>
                  <TabsTrigger value="a">variant default</TabsTrigger>
                  <TabsTrigger value="b">Segunda</TabsTrigger>
                </TabsList>
                <TabsContent value="a">
                  <p className="pt-2 text-sm text-muted-foreground">Painel da primeira aba.</p>
                </TabsContent>
                <TabsContent value="b">
                  <p className="pt-2 text-sm text-muted-foreground">Painel da segunda aba.</p>
                </TabsContent>
              </Tabs>
              <Tabs defaultValue="a">
                <TabsList variant="line">
                  <TabsTrigger value="a">variant line</TabsTrigger>
                  <TabsTrigger value="b">Segunda</TabsTrigger>
                </TabsList>
                <TabsContent value="a">
                  <p className="pt-2 text-sm text-muted-foreground">Underline animado.</p>
                </TabsContent>
                <TabsContent value="b">
                  <p className="pt-2 text-sm text-muted-foreground">Painel da segunda aba.</p>
                </TabsContent>
              </Tabs>
              <Tabs defaultValue="a" orientation="vertical" className="flex-row">
                <TabsList>
                  <TabsTrigger value="a">orientation vertical</TabsTrigger>
                  <TabsTrigger value="b">Segunda</TabsTrigger>
                </TabsList>
                <TabsContent value="a">
                  <p className="pt-2 text-sm text-muted-foreground">Painel da primeira aba.</p>
                </TabsContent>
                <TabsContent value="b">
                  <p className="pt-2 text-sm text-muted-foreground">Painel da segunda aba.</p>
                </TabsContent>
              </Tabs>
            </div>
          </Section>

          <Section
            id="metric-card"
            title="MetricCard"
            file="metric-card.tsx"
            usage={14}
            description="Card de métrica: micro-label uppercase + número grande + texto de apoio. Substituiu 11 componentes locais (MetricCard do dashboard, AdminMetric, Stat...) e 8 implementações inline do mesmo padrão. Com href o card inteiro vira link."
            api={["label: string", "value: ReactNode", "helper?: ReactNode", "suffix?: string", "icon?: LucideIcon", "href?: string", "variant: tile|card (default tile)"]}
          >
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <MetricCard label="Registros" value={128} helper="variant=tile (padrão dos hubs)" />
              <MetricCard variant="card" label="Projetos ativos" value={6} icon={Target} helper="variant=card com icon" />
              <MetricCard label="Prontidão" value={72} suffix="%" helper="value com suffix" />
            </div>
          </Section>

          <Section
            id="progress"
            title="Progress"
            file="progress.tsx"
            usage={4}
            description="Barra de progresso 0–100 do base-ui. tone reaproveita os tons semânticos do StatusBadge (mais primary, brand e foreground) — a cor do preenchimento vem sempre de token."
            api={["value, max (default 100)", "size: xs|sm|md (default sm)", "tone: primary|brand|foreground|success|warning|info|danger|neutral|impact (default primary)", "indicatorClassName"]}
          >
            <Group label="size (value 65)">
              <div className="flex w-64 flex-col gap-2">
                <Progress value={65} size="xs" />
                <Progress value={65} size="sm" />
                <Progress value={65} size="md" />
              </div>
            </Group>
            <Group label="tone">
              <div className="flex w-64 flex-col gap-2">
                <Progress value={65} tone="success" />
                <Progress value={65} tone="warning" />
                <Progress value={65} tone="impact" />
              </div>
            </Group>
          </Section>

          <Section
            id="segmented-progress"
            title="SegmentedProgress"
            file="segmented-progress.tsx"
            usage={3}
            description="Progresso em etapas discretas: um segmento por item, preenchido conforme o estado daquele item (não precisa ser sequencial). Para progresso contínuo use Progress. O StepConnector do mesmo arquivo é o traço entre passos de um stepper."
            api={["SegmentedProgress: segments: boolean[]", "StepConnector: filled?: boolean"]}
          >
            <Group label="SegmentedProgress">
              <div className="flex w-48">
                <SegmentedProgress segments={[true, true, false, false]} />
              </div>
            </Group>
            <Group label="StepConnector (stepper)">
              <div className="flex w-48 items-center gap-1">
                <span className="size-2.5 shrink-0 rounded-full bg-brand" />
                <StepConnector filled />
                <span className="size-2.5 shrink-0 rounded-full bg-brand" />
                <StepConnector />
                <span className="size-2.5 shrink-0 rounded-full bg-muted" />
              </div>
            </Group>
          </Section>

          <Section
            id="list-row-button"
            title="ListRowButton"
            file="list-row-button.tsx"
            usage={4}
            description="Linha de lista clicável — o padrão de abrir um registro ou detalhe em drawer/sheet. É um <button> de largura total; o conteúdo interno (título, meta, badges) fica por conta de quem usa."
            api={["React.ComponentProps<'button'>"]}
          >
            <div className="flex w-full flex-col gap-2">
              <ListRowButton>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Apresentação do roadmap Q3</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Registro · 12 ago 2026</p>
                </div>
                <StatusBadge tone="success">Concluído</StatusBadge>
              </ListRowButton>
              <ListRowButton>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">1:1 com liderado</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Registro · 8 ago 2026</p>
                </div>
                <ImpactDots level={3} className="mt-1.5" />
              </ListRowButton>
            </div>
          </Section>

          <Section
            id="page-header"
            title="PageHeader"
            file="page-header.tsx"
            usage={22}
            description="Cabeçalho padrão de página: título (h1) + descrição, com as ações à direita. As ações entram como children — normalmente um PageHeaderActions — e empilham abaixo do título no mobile. descriptionClassName existe para as páginas que precisam limitar a largura da descrição."
            api={["title: ReactNode", "description?: ReactNode", "descriptionClassName?: string", "children = ações", "className", "...props de div"]}
          >
            <div className="flex w-full flex-col gap-5">
              <PageHeader title="Projetos" description="Só título e descrição — o caso mais comum." />
              <PageHeader
                title="Projetos"
                description="Com ação como child: empilhada no mobile, à direita a partir do sm."
              >
                <Button size="sm"><Plus data-icon="inline-start" />Novo projeto</Button>
              </PageHeader>
            </div>
          </Section>

          {/* ─── formulário ─── */}
          <Section
            id="input"
            title="Input"
            file="input.tsx"
            usage={20}
            description="Input de texto (h-11, fundo de card). Repassa todas as props nativas."
            api={["React.ComponentProps<'input'>"]}
          >
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Input placeholder="Nome do projeto" />
              <Input type="date" />
              <Input placeholder="disabled" disabled />
              <Input placeholder="inválido" aria-invalid />
            </div>
          </Section>

          <Section
            id="input-group"
            title="InputGroup"
            file="input-group.tsx"
            usage={1}
            description="Agrupa input com addons, ícones e botões — inline (start/end) ou em bloco (acima/abaixo). Clicar no addon foca o input."
            api={["InputGroupAddon align: inline-start|inline-end|block-start|block-end", "InputGroupButton size: xs|sm|icon-xs|icon-sm"]}
          >
            <div className="flex w-full flex-col gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <Search className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput placeholder="Buscar projeto..." />
              </InputGroup>
              <InputGroup>
                <InputGroupInput placeholder="Com botão ao final" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm">Aplicar</InputGroupButton>
                  <InputGroupButton size="icon-sm" variant="ghost"><Search /></InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <InputGroup>
                <InputGroupAddon align="block-start">
                  <span className="text-xs text-muted-foreground">Nome do projeto</span>
                </InputGroupAddon>
                <InputGroupInput placeholder="align=block-start" />
              </InputGroup>
            </div>
          </Section>

          <Section
            id="textarea"
            title="Textarea"
            file="textarea.tsx"
            usage={16}
            description="Textarea com field-sizing-content (cresce com o conteúdo) e min-h-24."
            api={["React.ComponentProps<'textarea'>"]}
          >
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Textarea placeholder="Sobre o projeto..." rows={3} />
              <Textarea placeholder="disabled" disabled rows={3} />
            </div>
          </Section>

          <Section
            id="select"
            title="Select"
            file="select.tsx"
            usage={8}
            description="Select do base-ui com popup posicionado e check no item ativo. O SelectContent já inclui Portal, Positioner e botões de scroll. ARMADILHA: <SelectValue /> sem children não lê o texto do SelectItem selecionado — ele serializa o value cru. Sempre passe uma função: <SelectValue>{(v) => LABEL[v]}</SelectValue>."
            api={["SelectTrigger size: sm|default", "SelectContent side, align, alignItemWithTrigger", "SelectValue: children (v) => label — obrigatório para ids/enums"]}
          >
            <SelectDemo />
          </Section>

          <Section
            id="checkbox"
            title="Checkbox"
            file="checkbox.tsx"
            usage={4}
            description="Checkbox do base-ui (16px), com estados checked e indeterminate. Não embute label — envolva com <label> ou use o Field para o clique no rótulo funcionar."
            api={["checked, onCheckedChange", "indeterminate", "disabled", "CheckboxPrimitive.Root.Props"]}
          >
            <Group label="checked (estado real) + disabled">
              <CheckboxDemo />
            </Group>
          </Section>

          <Section
            id="slider"
            title="Slider"
            file="slider.tsx"
            usage={1}
            description="Slider do base-ui com trilho fino (h-1.5) e preenchimento na cor de marca. Em uso no formulário de registro, para o nível de impacto."
            api={["value, onValueChange", "min, max, step", "SliderPrimitive.Root.Props"]}
          >
            <Group label="min=0 max=10 step=1 (estado real)">
              <SliderDemo />
            </Group>
          </Section>

          <Section
            id="field"
            title="Field"
            file="field.tsx"
            usage={12}
            description="Rótulo + controle de formulário — o padrão repetido em ~40 formulários do app, agora num componente só. Renderiza um <label>, então clicar no rótulo foca o controle filho."
            api={["label: ReactNode", "children = controle", "...props de label"]}
          >
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <Input placeholder="Nome do projeto" />
              </Field>
              <Field label="Data de início">
                <Input type="date" />
              </Field>
            </div>
          </Section>

          <Section
            id="option-card"
            title="OptionCard"
            file="option-card.tsx"
            usage={5}
            description="Card de opção selecionável para formulários — nível de rubrica, tipo de colaborador, perfil DISC. É um <button> com aria-pressed; serve para single ou multi-select, o estado fica com quem usa."
            api={["active?: boolean", "React.ComponentProps<'button'>"]}
          >
            <div className="w-full">
              <Group label="single-select (estado real)">
                <OptionCardDemo />
              </Group>
            </div>
          </Section>

          {/* ─── sobreposição ─── */}
          <Section
            id="dialog"
            title="Dialog"
            file="dialog.tsx"
            usage={9}
            description="Modal centralizado (max-w-sm). O DialogContent já embute Portal e Overlay, e mostra o X por padrão."
            api={["DialogContent showCloseButton (default true)", "DialogFooter showCloseButton (default false)"]}
          >
            <Group label="showCloseButton=true (default)">
              <Dialog>
                <DialogTrigger render={<Button size="sm" variant="outline">Abrir dialog</Button>} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir projeto</DialogTitle>
                    <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button size="sm" variant="ghost">Cancelar</Button>} />
                    <Button size="sm" variant="destructive"><Trash2 data-icon="inline-start" />Excluir</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Group>
            <Group label="DialogContent showCloseButton=false + DialogFooter showCloseButton=true">
              <Dialog>
                <DialogTrigger render={<Button size="sm" variant="outline">Sem X no canto</Button>} />
                <DialogContent showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>Sem X no canto</DialogTitle>
                    <DialogDescription>
                      O footer é quem fecha agora — DialogFooter showCloseButton renderiza um botão &quot;Close&quot; próprio.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>
            </Group>
          </Section>

          <Section
            id="sheet"
            title="Sheet"
            file="sheet.tsx"
            usage={15}
            description="Drawer lateral ou vertical. Padrão do app para formulários (Novo projeto, Novo colaborador). SheetOverlay e SheetPortal existem no arquivo mas não são exportados."
            api={["side: top|right|bottom|left (default right)", "showCloseButton (default true)"]}
          >
            <Group label="side">
              {(["right", "left", "top", "bottom"] as const).map((side) => (
                <Sheet key={side}>
                  <SheetTrigger render={<Button size="sm" variant="outline">{side}</Button>} />
                  <SheetContent side={side}>
                    <SheetHeader>
                      <SheetTitle>side={side}</SheetTitle>
                      <SheetDescription>Drawer aberto pelo lado {side}.</SheetDescription>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
              ))}
            </Group>
            <Group label="showCloseButton=false">
              <Sheet>
                <SheetTrigger render={<Button size="sm" variant="outline">sem X</Button>} />
                <SheetContent showCloseButton={false}>
                  <SheetHeader>
                    <SheetTitle>showCloseButton=false</SheetTitle>
                    <SheetDescription>Sem o X no canto — precisa de um fechamento próprio no footer.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            </Group>
          </Section>

          <Section
            id="popover"
            title="Popover"
            file="popover.tsx"
            usage={1}
            description="Popover flutuante com p-4 e seta opcional (desligada por padrão)."
            api={["side, align, sideOffset, alignOffset", "showArrow (default false)"]}
          >
            <Group label="side=bottom (default), showArrow=true">
              <Popover>
                <PopoverTrigger render={<Button size="sm" variant="outline">Abrir popover</Button>} />
                <PopoverContent showArrow>
                  <PopoverHeader>
                    <PopoverTitle>Prontidão no PDI</PopoverTitle>
                    <PopoverDescription>Calculada a partir das evidências registradas.</PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            </Group>
            <Group label="side=right, align=start, showArrow=false (default)">
              <Popover>
                <PopoverTrigger render={<Button size="sm" variant="outline">Abrir à direita</Button>} />
                <PopoverContent side="right" align="start">
                  <PopoverHeader>
                    <PopoverTitle>Sem seta</PopoverTitle>
                    <PopoverDescription>showArrow=false é o padrão do componente.</PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            </Group>
          </Section>

          <Section
            id="dropdown-menu"
            title="DropdownMenu"
            file="dropdown-menu.tsx"
            usage={1}
            description="Menu completo: itens, checkbox, radio, submenus e atalhos. Item tem variante destructive."
            api={["DropdownMenuItem variant: default|destructive, inset", "DropdownMenuCheckboxItem", "DropdownMenuRadioGroup", "DropdownMenuSub"]}
          >
            <Group label="itens, inset, atalho, destructive">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button size="sm" variant="outline">Abrir menu<ChevronDown data-icon="inline-end" /></Button>} />
                <DropdownMenuContent>
                  <DropdownMenuLabel>Projeto</DropdownMenuLabel>
                  <DropdownMenuItem>Abrir<DropdownMenuShortcut>⌘O</DropdownMenuShortcut></DropdownMenuItem>
                  <DropdownMenuItem inset>Editar (inset)</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Mover para...</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Profissional</DropdownMenuItem>
                      <DropdownMenuItem>Pessoal</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Group>
            <Group label="checkbox + radio">
              <DropdownMenuDemo />
            </Group>
          </Section>

          <Section
            id="tooltip"
            title="Tooltip"
            file="tooltip.tsx"
            usage={3}
            description="Tooltip escuro com seta e posicionamento embutidos. O TooltipProvider já está montado no layout raiz — delay padrão 0."
            api={["side (top), sideOffset (4), align (center)", "TooltipProvider delay (0)"]}
          >
            <Group label="side">
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <Tooltip key={side}>
                  <TooltipTrigger render={<Button size="sm" variant="outline">{side}</Button>} />
                  <TooltipContent side={side}>Tooltip em {side}</TooltipContent>
                </Tooltip>
              ))}
            </Group>
          </Section>

          <Section
            id="command"
            title="Command"
            file="command.tsx"
            usage={0}
            description="Command palette filtrável via cmdk, com CommandDialog pronto para Cmd+K. Nunca usado no app — candidato natural a busca global."
            api={["Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem", "CommandDialog"]}
          >
            <Group label="Command (inline)">
              <div className="w-full overflow-hidden rounded-[10px] border border-border bg-card">
                <Command>
                  <CommandInput placeholder="Buscar..." />
                  <CommandList>
                    <CommandEmpty>Nenhum resultado.</CommandEmpty>
                    <CommandGroup heading="Navegação">
                      <CommandItem><FolderOpen className="size-4" />Projetos</CommandItem>
                      <CommandItem><Target className="size-4" />Objetivos</CommandItem>
                      <CommandItem><Bell className="size-4" />Avisos</CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </Group>
            <Group label="CommandDialog (padrão Cmd+K)">
              <CommandDialogDemo />
            </Group>
          </Section>

          {/* ─── identidade ─── */}
          <Section
            id="avatar"
            title="Avatar"
            file="avatar.tsx"
            usage={1}
            description="Avatar do base-ui com imagem, fallback, badge de status e agrupamento sobreposto. Na prática o app usa quase sempre o PersonAvatar."
            api={["size: sm|default|lg", "AvatarImage", "AvatarFallback", "AvatarBadge", "AvatarGroup", "AvatarGroupCount"]}
          >
            <Group label="size">
              <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>MD</AvatarFallback></Avatar>
              <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
            </Group>
            <Group label="badge + group">
              <Avatar>
                <AvatarFallback>UD</AvatarFallback>
                <AvatarBadge className="bg-success" />
              </Avatar>
              <AvatarGroup>
                <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
                <Avatar size="sm"><AvatarFallback>B</AvatarFallback></Avatar>
                <Avatar size="sm"><AvatarFallback>C</AvatarFallback></Avatar>
                <AvatarGroupCount>+3</AvatarGroupCount>
              </AvatarGroup>
            </Group>
            <Group label="AvatarImage (com fallback por trás)">
              <Avatar>
                <AvatarImage src={DEMO_AVATAR_SRC} alt="Exemplo com imagem" />
                <AvatarFallback>IMG</AvatarFallback>
              </Avatar>
            </Group>
          </Section>

          <Section
            id="person-avatar"
            title="PersonAvatar"
            file="person-avatar.tsx"
            usage={15}
            description="Wrapper do Avatar que resolve imagem-ou-iniciais a partir do nome e aplica as cores de marca. É o que se usa no app para representar pessoas."
            api={["name: string", "imageUrl?: string | null", "size: sm|default|lg"]}
          >
            <Group label="size">
              <PersonAvatar name="Urlan Dipré" size="sm" />
              <PersonAvatar name="Urlan Dipré" />
              <PersonAvatar name="Urlan Dipré" size="lg" />
            </Group>
            <Group label="outros nomes">
              <PersonAvatar name="Maria Silva" />
              <PersonAvatar name="Colaborador Demo" />
            </Group>
            <Group label="imageUrl (foto real em vez de iniciais)">
              <PersonAvatar name="Urlan Dipré" imageUrl={DEMO_AVATAR_SRC} />
            </Group>
          </Section>

          {/* ─── shell ─── */}
          <Section
            id="sidebar"
            title="Sidebar"
            file="sidebar.tsx"
            usage={7}
            description="O maior primitivo do app (720 linhas, 23 exports). Shell de navegação colapsável, persiste o estado em cookie por 7 dias e responde a Cmd/Ctrl+B. No mobile vira um Sheet. Não é demonstrável aqui: useSidebar lança erro fora do SidebarProvider, e ele já está montado nos layouts de (app), (gestao) e (admin)."
            api={["SidebarProvider defaultOpen, open, onOpenChange", "Sidebar side, variant: sidebar|floating|inset, collapsible: offcanvas|icon|none", "SidebarMenuButton isActive, tooltip, variant, size", "useSidebar()"]}
            status="needs-provider"
          >
            <p className="text-sm text-muted-foreground">
              Veja em uso na navegação à esquerda de qualquer tela autenticada. Largura expandida{" "}
              <code className="font-mono text-xs">17.5rem</code>, colapsada{" "}
              <code className="font-mono text-xs">4.75rem</code>.
            </p>
          </Section>

          <Section
            id="notifications-popover"
            title="NotificationsPopover"
            file="notifications-popover.tsx"
            usage={4}
            description="Campainha com contador de não-lidas que abre as 8 notificações mais recentes. Componente fechado, sem props. Retorna null quando não há sessão — por isso não renderiza nesta página."
            api={["sem props", "depende de useOptionalSession + notifications store"]}
            status="needs-provider"
          >
            <p className="text-sm text-muted-foreground">
              Veja no canto superior direito das telas autenticadas, ao lado do título da página.
            </p>
          </Section>

          <Section
            id="hero-geometric"
            title="HeroGeometric"
            file="hero-geometric.tsx"
            usage={1}
            description="Hero full-screen com fundo WebGL animado (shader de gradiente com noise e dithering). Export default, fora do padrão dos outros primitivos. Não usa tokens do design system e não tem fallback de SSR."
            api={["color1 (#3B82F6), color2 (#F0F9FF)", "speed (1)", "importar via next/dynamic ssr:false"]}
            status="heavy"
          >
            <p className="text-sm text-muted-foreground">
              Não renderizado aqui de propósito: carrega <code className="font-mono text-xs">three</code>,{" "}
              <code className="font-mono text-xs">@react-three/fiber</code> e{" "}
              <code className="font-mono text-xs">framer-motion</code>, e monta um Canvas WebGL em tela cheia.
            </p>
          </Section>

          {/* ─── lacunas ─── */}
          <section id="gaps" className="scroll-mt-6">
            <div className="flex flex-col gap-4 rounded-[12px] border border-border bg-card p-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight">O que falta padronizar</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lacunas encontradas varrendo o código — cada item tem o problema concreto e a correção sugerida.
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-3">
                {GAPS.map((gap, i) => (
                  <div key={gap.title} className="flex gap-3 rounded-[10px] border border-border bg-muted/20 p-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-accent-ink">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{gap.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{gap.detail}</p>
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-accent-ink">
                        <Check className="mt-0.5 size-3.5 shrink-0" />
                        <span>{gap.fix}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="pb-4 text-xs text-muted-foreground">
            Documentação viva: renderiza os componentes reais de{" "}
            <code className="font-mono">src/components/ui/</code>. Ao criar ou alterar um primitivo, atualize esta
            página em <code className="font-mono">src/app/design-system/page.tsx</code>.
          </footer>
        </main>
      </div>
    </ToastProvider>
  )
}
