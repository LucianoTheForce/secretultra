"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { motion } from "framer-motion"

import Image from "next/image"

import { useRouter } from "next/navigation"

import { useSession } from "@/lib/auth-client"

import { Button } from "@/components/ui/button"

import { LoginModal } from "@/components/auth/login-modal"

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GaugeCircle,
  Layers,
  Pause,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react"

import Link from "next/link"

// Header component - exactly like reference with interface blue

function Header({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <header className="fixed top-6 left-0 right-0 z-50">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex h-12 items-center justify-between rounded-full bg-neutral-800/95 backdrop-blur-sm px-6 shadow-lg">
            {/* Left: Logo */}

            <Link href="/" className="flex items-center">
              <Image
                src="/marca_completa_RGB_negativo.png"
                alt="Ultragaz"
                width={100}
                height={25}
                priority
                className="select-none"
              />
            </Link>

            {/* Right: Login button with blue background */}

            <button
              onClick={onLoginClick}
              className="px-5 py-1.5 text-sm font-medium text-white bg-[#5b3ef8] hover:bg-[#6b4ef8] rounded-full transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Rotating typed text component

function RotatingTypedText({
  items,

  activeIndex,

  typeSpeedMs = 28,

  backSpeedMs = 18,

  className = "",

  autoRotate = false,
}: {
  items: string[]

  activeIndex: number

  typeSpeedMs?: number

  backSpeedMs?: number

  className?: string

  autoRotate?: boolean
}) {
  const [display, setDisplay] = useState("")

  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
    "typing",
  )

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const prevIndex = useRef<number>(activeIndex)

  useEffect(() => {
    const current = items[activeIndex % items.length] ?? ""

    // Reset when index changes

    if (prevIndex.current !== activeIndex) {
      prevIndex.current = activeIndex

      setDisplay("")

      setPhase("typing")

      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (phase === "typing") {
      if (display.length < current.length) {
        timeoutRef.current = setTimeout(
          () => setDisplay(current.slice(0, display.length + 1)),

          typeSpeedMs,
        )
      } else if (!autoRotate) {
        // Stay on completed text when not auto-rotating

        return
      } else {
        timeoutRef.current = setTimeout(() => setPhase("holding"), 900)
      }
    } else if (phase === "holding") {
      if (!autoRotate) return

      timeoutRef.current = setTimeout(() => setPhase("deleting"), 900)
    } else {
      // deleting

      if (display.length > 0) {
        timeoutRef.current = setTimeout(
          () => setDisplay(current.slice(0, display.length - 1)),

          backSpeedMs,
        )
      } else {
        setPhase("typing")
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [
    display,
    phase,
    items,
    activeIndex,
    typeSpeedMs,
    backSpeedMs,
    autoRotate,
  ])

  return (
    <span className={className}>
      {display}

      <motion.span
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block ml-1 w-1 h-[1.2em] bg-current align-baseline"
      />
    </span>
  )
}

// Background cards carousel component

function CardsBackgroundCarousel({
  slides,

  currentIndex,

  onIndexChange,

  intervalMs = 5000,

  autoPlay = true,
}: {
  slides: { src: string; alt: string }[]

  currentIndex: number

  onIndexChange?: (i: number) => void

  intervalMs?: number

  autoPlay?: boolean
}) {
  const [internalIndex, setInternalIndex] = useState(0)

  // Auto-advance

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return

    const timer = setInterval(() => {
      if (onIndexChange) {
        onIndexChange((currentIndex + 1) % slides.length)
      } else {
        setInternalIndex((i) => (i + 1) % slides.length)
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [autoPlay, intervalMs, slides.length, currentIndex, onIndexChange])

  const getDelta = (i: number) => {
    const active = onIndexChange ? currentIndex : internalIndex

    const n = slides.length

    const raw = i - active

    const wrapped = ((raw % n) + n) % n

    const alt = wrapped - n

    return Math.abs(wrapped) <= Math.abs(alt) ? wrapped : alt
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-20 bg-transparent" />

      <div
        className="absolute inset-x-0 top-[18vh] flex justify-center"
        style={{ perspective: 1200 }}
      >
        <div className="relative h-[58vh] w-full max-w-[1600px]">
          {slides.map((s, i) => {
            const d = getDelta(i)

            const visible = Math.abs(d) <= 2

            const cardWidthVh = 40

            const gapVh = 6

            const translateX = d * (cardWidthVh + gapVh)

            const scale = i === currentIndex ? 1.12 : 0.94

            const rotateY = d * -8

            const z = 100 - Math.abs(d) * 10

            return (
              <motion.div
                key={`${s.src}-${i}`}
                initial={false}
                animate={{
                  x: `${translateX}vh`,

                  rotateY,

                  scale,

                  opacity: visible ? 1 : 0,

                  zIndex: z,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/10 bg-white"
              >
                <div className="h-[58vh] flex items-center justify-center">
                  <div
                    className="relative"
                    style={{ width: `${cardWidthVh}vh`, aspectRatio: "9 / 16" }}
                  >
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      priority
                      sizes="(max-width: 768px) 40vh, 40vh"
                      className="object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement

                        img.src = "/ultrinho.png"
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Sponsor button component

const FEATURE_HIGHLIGHTS: Array<{
  icon: LucideIcon

  title: string

  description: string

  bullets: string[]
}> = [
  {
    icon: Sparkles,

    title: "Geração guiada por IA",

    description:
      "Transforme ideias em peças finalizadas com prompts aprovados e ajustes contextuais para cada canal.",

    bullets: [
      "Sugestões de copy alinhadas à voz da Ultragaz",

      "Pré-visualização automática para cada formato",
    ],
  },

  {
    icon: Layers,

    title: "Componentes reutilizáveis",

    description:
      "Padronize banners, cards e fluxos com bibliotecas centralizadas e tokens de design.",

    bullets: [
      "Blocos arrasta-e-solta com versões aprovadas",

      "Atualizações propagadas para todas as campanhas",
    ],
  },

  {
    icon: Share2,

    title: "Publicação omnicanal",

    description:
      "Dispare campanhas, landing pages e materiais comerciais direto da plataforma.",

    bullets: [
      "Exportação otimizada para social, web e impresso",

      "Integrações com CRM e canais parceiros",
    ],
  },

  {
    icon: ShieldCheck,

    title: "Governança automatizada",

    description:
      "Proteja a marca com fluxos de aprovação, permissões e histórico completo de alterações.",

    bullets: [
      "Papéis por squad, região e parceiro",

      "Registros auditáveis em tempo real",
    ],
  },
]

const WORKFLOW_STEPS = [
  {
    label: "01",

    title: "Brief em minutos",

    description:
      "Escolha um template ou comece do zero. O GenID coleta objetivos, público e canais em um painel guiado.",
  },

  {
    label: "02",

    title: "Geração e ajustes",

    description:
      "Combine IA com a biblioteca oficial Ultragaz para gerar visuais, textos e variações responsivas.",
  },

  {
    label: "03",

    title: "Aprovação e entrega",

    description:
      "Envie para aprovação, acompanhe comentários em tempo real e publique nos canais certos em poucos cliques.",
  },
] as const

const TEAM_ENABLEMENT: Array<{
  icon: LucideIcon

  title: string

  description: string
}> = [
  {
    icon: Users,

    title: "Squads alinhados",

    description:
      "Convide equipes regionais, defina permissões e acompanhe status em um dashboard compartilhado.",
  },

  {
    icon: Workflow,

    title: "Fluxos inteligentes",

    description:
      "Automatize checklists, notificações e aprovações para cada fase do ciclo de criação.",
  },

  {
    icon: GaugeCircle,

    title: "Medição contínua",

    description:
      "Visualize desempenho de materiais, reuso de componentes e economia de tempo em tempo real.",
  },
]

const IMPACT_CARDS = [
  {
    value: "3x",

    description:
      "mais rápido para lançar campanhas regionais com modelos prontos",
  },

  {
    value: "60%",

    description: "menos retrabalho em ajustes de identidade visual",
  },

  {
    value: "24h",

    description: "do briefing à publicação com aprovações automatizadas",
  },
] as const

function FeatureHighlightsSection({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="bg-neutral-950 py-24 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-160px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
            Funcionalidades
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que sua squad precisa para criar com a Ultragaz
          </h2>

          <p className="mt-4 text-base text-white/70">
            Combine geração assistida, bibliotecas oficiais e colaboração em
            tempo real em um único espaço.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {FEATURE_HIGHLIGHTS.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(12,20,38,0.35)] backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-lg font-semibold">{feature.title}</h3>

                <p className="mt-3 text-sm text-white/70">
                  {feature.description}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-white/60">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />

                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            )
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="rounded-full bg-emerald-500 px-6 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
            onClick={onLogin}
          >
            Experimentar agora
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function WorkflowShowcaseSection() {
  return (
    <section className="bg-neutral-900 py-24 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-140px" }}
          className="text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
            Workflow
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Do briefing à entrega sem sair do GenID
          </h2>

          <p className="mt-4 text-base text-white/70">
            Cada etapa foi desenhada para squads multidisciplinares trabalharem
            com velocidade e controle.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {WORKFLOW_STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300/80">
                {step.label}
              </span>

              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>

              <p className="mt-3 text-sm text-white/70">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamEnablementSection({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="bg-white py-24 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-140px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-500">
            Colaboração
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            A plataforma que conecta marketing, comercial e operações
          </h2>

          <p className="mt-4 text-base text-neutral-600">
            Garanta que todas as áreas trabalhem com o mesmo conteúdo, processos
            e indicadores, independente da região.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TEAM_ENABLEMENT.map((card, index) => {
            const Icon = card.icon

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(12,20,38,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c2f5c]/10 text-[#1c2f5c]">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-lg font-semibold text-neutral-900">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm text-neutral-600">
                  {card.description}
                </p>
              </motion.article>
            )
          })}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {IMPACT_CARDS.map((impact) => (
            <div
              key={impact.value}
              className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center shadow-sm"
            >
              <p className="text-4xl font-bold text-[#1c2f5c]">
                {impact.value}
              </p>

              <p className="mt-3 text-sm text-neutral-600">
                {impact.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="rounded-full bg-[#1c2f5c] px-6 text-sm font-semibold text-white hover:bg-[#243974]"
            onClick={onLogin}
          >
            Abrir conta para minha equipe
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="bg-neutral-950 py-24 text-white">
      <div className="mx-auto max-w-4xl px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f1b38] to-[#0a192f] p-10 text-center shadow-[0_40px_120px_rgba(12,20,38,0.55)]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para criar com a Ultragaz?
          </h2>

          <p className="mt-4 text-base text-white/70">
            Acelere campanhas, conecte squads e mantenha a identidade da marca
            em qualquer canal.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="rounded-full bg-emerald-500 px-6 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
              onClick={onLogin}
            >
              Criar minha primeira campanha
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
              onClick={onLogin}
            >
              Falar com um especialista
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function SponsorButton() {
  return (
    <motion.a
      href="https://theforce.cc"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-200 group shadow-lg"
    >
      <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
        Powered by
      </span>

      <div className="flex items-center gap-1.5">
        <div className="text-zinc-100 group-hover:text-white transition-colors">
          <svg
            className="w-4 h-4"
            width="20"
            height="18"
            viewBox="0 0 76 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
          </svg>
        </div>

        <span className="text-xs font-medium text-zinc-100 group-hover:text-white transition-colors">
          theforce.cc
        </span>
      </div>
    </motion.a>
  )
}

export default function WelcomePage() {
  const { data: session, isPending } = useSession()

  const router = useRouter()

  const [showLoginModal, setShowLoginModal] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)

  const [autoPlay, setAutoPlay] = useState(true)

  // Redirect if already logged in

  useEffect(() => {
    if (!isPending && session?.session) {
      router.push("/studio")
    }
  }, [session, isPending, router])

  const slides = useMemo(
    () => [
      {
        text: "Ultrinho acenando na cozinha moderna", // 1.png
      },

      {
        text: "Ultrinho com polegar levantado e chamas", // 3.png
      },

      {
        text: "Ultrinho piscando close-up", // 4.png
      },

      {
        text: "Ultrinho acenando em fundo azul", // 5.png
      },

      {
        text: "Ultrinho com famílias em balões de pensamento", // 6.png
      },

      {
        text: "Ultrinho pensando em fogão e panela", // 7.png
      },

      {
        text: "Ultrinho sentado na sala com sofá bege", // 8.png
      },

      {
        text: "Ultrinho surfista com prancha e chapéu", // 005562b9
      },

      {
        text: "Ultrinho fazendo yoga no Rio", // 0528068e
      },

      {
        text: "Ultrinho em faixa de pedestres urbana", // 065c88b9
      },

      {
        text: "Ultrinho meditando com vista do Rio", // 1731bff7
      },

      {
        text: "Ultrinho jogando futebol no estádio", // 22f28cf0
      },

      {
        text: "Ultrinho na praia com óculos escuros", // 3ac94781
      },

      {
        text: "Ultrinho na discoteca com corrente dourada", // 49c0523f
      },

      {
        text: "Ultrinho professor com lápis e quadro", // 6bdecab1
      },

      {
        text: "Ultrinho em festa junina com chapéu", // 7c4ec3a4
      },

      {
        text: "Ultrinho acenando na cozinha branca", // 8678e62f
      },

      {
        text: "Ultrinho no campo com luzes e short", // 9060983f
      },

      {
        text: "Ultrinho na fazenda com celeiro vermelho", // 9937ade7
      },

      {
        text: "Ultrinho com mulher de vestido preto", // b1a11960
      },

      {
        text: "Ultrinho com pessoa de moletom verde", // ba004d8e
      },

      {
        text: "Ultrinho meditando ao pôr do sol", // c3d66f77
      },

      {
        text: "Ultrinho hip-hop com óculos no palco", // cb502368
      },

      {
        text: "Ultrinho sob luzes festivas dando joinha", // dcf38b7f
      },

      {
        text: "Ultrinho cowboy com chapéu e laço", // f837309b
      },

      {
        text: "Três Ultrinhos celebrando com luzes", // fd3e93cf
      },
    ],

    [],
  )

  const backgroundSlides = useMemo(
    () => [
      { src: "/generated/home/1.png", alt: "Ultrinho no posto" },

      { src: "/generated/home/3.png", alt: "Ultrinho e caminhão" },

      { src: "/generated/home/4.png", alt: "Ultrinho segurança" },

      { src: "/generated/home/5.png", alt: "Ultrinho celebrando" },

      { src: "/generated/home/6.png", alt: "Ultrinho apresentando" },

      { src: "/generated/home/7.png", alt: "Ultrinho entregador" },

      { src: "/generated/home/8.png", alt: "Ultrinho técnico" },

      {
        src: "/generated/home/005562b9-02d3-4f8c-8feb-a7978d98a9ed.png",
        alt: "Ultrinho atendente",
      },

      {
        src: "/generated/home/0528068e-aaf3-489c-898b-de9f949dd5df.png",
        alt: "Ultrinho piloto",
      },

      {
        src: "/generated/home/065c88b9-0bf8-4004-a450-71ad70190d71.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/1731bff7-cc06-47d9-a352-1480d7c02c05.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/22f28cf0-0df1-4d4e-b9f8-9a41a74a96ba.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/3ac94781-50aa-4660-a39d-a363ec7ae883.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/49c0523f-6c6d-4261-8958-4d9160ff64b5.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/6bdecab1-fdd9-410f-b50c-3fbb86ed906c.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/7c4ec3a4-bf31-40bd-892e-d47ff2ef4740.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/8678e62f-3ef2-4073-819f-056d9fe92568.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/9060983f-99bc-4222-92c6-fab2be365ede.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/9937ade7-3242-42d1-b65b-9e666c00793f.png",
        alt: "Ultrinho app",
      },

      {
        src: "/generated/home/b1a11960-3761-4d05-83a3-9d252aa23644.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/ba004d8e-0c4c-4a33-9533-cb52c2b8e978.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/c3d66f77-ee96-4ad2-8f32-a724b733bd4b.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/cb502368-c5be-4678-a873-ae1f93cb65d4.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/dcf38b7f-445f-4040-b9e6-9b2ecc844ec0.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/f837309b-884e-4e9d-a3a1-db8db87199ce.png",
        alt: "Ultrinho",
      },

      {
        src: "/generated/home/fd3e93cf-16a9-4314-b56d-24882be94bde.png",
        alt: "Ultrinho",
      },
    ],

    [],
  )

  const go = useCallback(
    (dir: -1 | 1) => {
      setCurrentIndex((i) => (i + dir + slides.length) % slides.length)
    },

    [slides.length],
  )

  const handleOpenLogin = useCallback(() => {
    setShowLoginModal(true)
  }, [])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="relative min-h-screen bg-black">
        {/* Header */}

        <Header onLoginClick={handleOpenLogin} />

        {/* Main content with padding for header */}

        <div className="relative min-h-screen pt-24 flex flex-col justify-between items-center text-center px-4">
          {/* Background cards carousel */}

          <CardsBackgroundCarousel
            slides={backgroundSlides}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
            intervalMs={5000}
            autoPlay={autoPlay}
          />

          {/* Main content */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center"
          >
            {/* Sponsor button */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-4 flex justify-center"
            >
              <SponsorButton />
            </motion.div>

            {/* Central white card */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mx-auto w-full max-w-4xl"
            >
              <div className="mx-auto rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-xl ring-1 ring-white/10 px-6 py-6 md:px-10 md:py-8">
                <div className="text-left md:text-center">
                  <h1 className="font-extrabold tracking-tight text-[2rem] md:text-[3.25rem] leading-[1.1]">
                    <RotatingTypedText
                      items={slides.map((s) => s.text)}
                      activeIndex={currentIndex}
                      autoRotate={false}
                      typeSpeedMs={28}
                      backSpeedMs={18}
                    />
                  </h1>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Button
                    type="button"
                    size="lg"
                    className="px-6 h-11 text-base bg-[#6E56CF] hover:bg-[#5d48ba]"
                    onClick={handleOpenLogin}
                  >
                    Comece agora
                    <ArrowRight className="relative z-10 ml-1 h-4 w-4 inline-block" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Description text */}

            <motion.p
              className="mt-8 text-sm sm:text-base text-white/90 font-normal tracking-wide max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Com o GenID, você pode transformar grandes ideias em produtos de
              verdade. Faça brainstorm, projete e publique com sua equipe.
            </motion.p>
          </motion.div>

          {/* Navigation controls */}

          <button
            type="button"
            aria-label="Anterior"
            className="absolute left-6 bottom-10 md:bottom-12 bg-white/20 hover:bg-white/30 rounded-full p-2 z-50 pointer-events-auto"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <button
            type="button"
            aria-label="Próximo"
            className="absolute right-6 bottom-10 md:bottom-12 bg-white/20 hover:bg-white/30 rounded-full p-2 z-50 pointer-events-auto"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>

          {/* Play/Pause and dots indicators */}

          <div className="absolute inset-x-0 bottom-10 md:bottom-12 flex items-center justify-center gap-3 z-20">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 w-2 rounded-full ${
                    i === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label={autoPlay ? "Pausar" : "Reproduzir"}
              onClick={() => setAutoPlay((v) => !v)}
              className="ml-3 bg-background/70 hover:bg-background/90 rounded-full p-2"
            >
              {autoPlay ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <FeatureHighlightsSection onLogin={handleOpenLogin} />

      <WorkflowShowcaseSection />

      <TeamEnablementSection onLogin={handleOpenLogin} />

      <FinalCtaSection onLogin={handleOpenLogin} />

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  )
}
