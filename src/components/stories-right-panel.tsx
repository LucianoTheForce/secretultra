"use client"

import { useMemo, useState, type ReactNode } from "react"
import Image from "next/image"
import { ChevronDown, Loader2, RefreshCw, Sparkles, Wand2, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { CharacterId } from "@/types"

interface StoriesRightPanelProps {
  className?: string
  basePrompt?: string | null
  tone: string
  onToneChange: (value: string) => void
  sceneCount: number
  onSceneCountChange: (value: number) => void
  onEnhance: () => void
  onGenerate: () => void
  onQuickGenerate?: () => void
  onReset?: () => void
  isLoading?: boolean
  isQuickGenerating?: boolean
  hasEnhancedStory?: boolean
  enhancerModel?: string
  characters?: { id: CharacterId; name: string; preview: string }[]
  selectedCharacter?: CharacterId
  onCharacterSelect?: (id: CharacterId) => void
}

type SectionKey = "scenes" | "tone"

interface PanelDropdownProps {
  title: string
  description?: string
  value?: string | null
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

function PanelDropdown({ title, description, value, isOpen, onToggle, children }: PanelDropdownProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">{title}</span>
          {description && (
            <span className="text-[11px] uppercase tracking-[0.24em] text-white/40">{description}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {value && (
            <span className="max-w-[140px] truncate text-xs text-white/50">{value}</span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-white/50 transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </button>
      {isOpen && <div className="border-t border-white/10 p-4 space-y-3">{children}</div>}
    </div>
  )
}

export function StoriesRightPanel({
  className,
  basePrompt,
  tone,
  onToneChange,
  sceneCount,
  onSceneCountChange,
  onEnhance,
  onGenerate,
  onQuickGenerate,
  onReset,
  isLoading = false,
  isQuickGenerating = false,
  hasEnhancedStory = false,
  enhancerModel,
  characters = [],
  selectedCharacter,
  onCharacterSelect,
}: StoriesRightPanelProps) {
  const hasBasePrompt = Boolean(basePrompt && basePrompt.trim().length > 0)
  const canEnhance = !isLoading && hasBasePrompt
  const canQuickGenerate = Boolean(onQuickGenerate) && hasBasePrompt && !isLoading
  const canGenerate = hasEnhancedStory && !isLoading
  const isNarrativeLoading = isLoading && !hasEnhancedStory && !isQuickGenerating
  const isSceneGenerationLoading = isLoading && hasEnhancedStory && !isQuickGenerating

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    scenes: true,
    tone: false,
  })

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const scenePreview = useMemo(() => `${sceneCount} cenas`, [sceneCount])

  const tonePreview = useMemo(() => {
    const value = tone.trim()
    return value.length > 0 ? value : "Definir tom"
  }, [tone])

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#07070d]",
        className,
      )}
    >
      <div className="flex flex-col gap-6 overflow-y-auto p-6">
        <header className="space-y-2">
          <Badge
            variant="secondary"
            className="w-max bg-white/5 text-[10px] uppercase tracking-[0.32em] text-white/60"
          >
            Story controls
          </Badge>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">
              Configuracoes da historia
            </h2>
            <p className="text-sm text-white/50">
              Ajuste detalhes rapidos ou reutilize narrativas existentes.
            </p>
          </div>
          {enhancerModel && (
            <p className="text-xs text-white/40">
              Narrativa aprimorada com {enhancerModel}
            </p>
          )}
        </header>

        {characters.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Personagem
                </h3>
                <p className="text-xs text-white/50">
                  Alinhe as cenas com o protagonista da campanha.
                </p>
              </div>
              {selectedCharacter && (
                <Badge className="bg-neutral-800/60 text-[11px] text-white/70">
                  {characters.find((item) => item.id === selectedCharacter)?.name ?? ""}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {characters.map((character) => {
                const isActive = character.id === selectedCharacter
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => onCharacterSelect?.(character.id)}
                    className={cn(
                      "relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-[#5b3ef8]/60",
                      isActive && "border-[#5b3ef8] ring-1 ring-[#5b3ef8]/40",
                    )}
                  >
                    <div className="relative h-24 w-full">
                      <Image
                        src={character.preview}
                        alt={character.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-[#5b3ef8]/20" />
                      )}
                    </div>
                    <span className="px-3 py-2 text-start text-xs font-medium text-white">
                      {character.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <div className="space-y-4">
          <PanelDropdown
            title="Numero de cenas"
            description="Fluxo da historia"
            value={scenePreview}
            isOpen={openSections.scenes}
            onToggle={() => toggleSection("scenes")}
          >
            <Slider
              min={2}
              max={10}
              step={1}
              value={[sceneCount]}
              onValueChange={(value) => {
                const next = value[0]
                if (typeof next === "number") {
                  onSceneCountChange(Math.max(2, Math.min(10, Math.trunc(next))))
                }
              }}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span>2 cenas</span>
              <span className="font-semibold text-white/70">{sceneCount}</span>
              <span>10 cenas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[2, 4, 6, 8, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSceneCountChange(value)}
                  disabled={isLoading}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    sceneCount === value
                      ? "border-[#5b3ef8] bg-[#5b3ef8]/20 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </PanelDropdown>

          <PanelDropdown
            title="Tom da narrativa"
            description="Clima"
            value={tonePreview}
            isOpen={openSections.tone}
            onToggle={() => toggleSection("tone")}
          >
            <Input
              value={tone}
              onChange={(event) => onToneChange(event.target.value)}
              placeholder="Inspirador, educativo, descontraido..."
              className="border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"
              disabled={isLoading}
            />
            <p className="text-xs text-white/50">Defina como as copys e descricoes devem soar ao longo da historia.</p>
          </PanelDropdown>
        </div>

        <section className="space-y-3">
          <div className="flex flex-col gap-2">
          {onQuickGenerate ? (
            <Button
              onClick={onQuickGenerate}
              disabled={!canQuickGenerate}
              className="h-11 w-full rounded-xl border border-white/20 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {isQuickGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando rascunho rpido
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Gerar rascunho rpido
                </>
              )}
            </Button>
          ) : null}
            <Button
              onClick={onEnhance}
              disabled={!canEnhance}
              className="h-11 w-full rounded-xl bg-neutral-800 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              {isNarrativeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando narrativa
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar narrativa
                </>
              )}
            </Button>
            <Button
              onClick={onGenerate}
              disabled={!canGenerate}
              className="h-11 w-full rounded-xl bg-[#5b3ef8] text-sm font-semibold text-white transition hover:bg-[#6b4ef8]"
            >
              {isSceneGenerationLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando cenas
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar imagens
                </>
              )}
            </Button>
          </div>
          {onReset && (
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              disabled={isLoading}
              className="h-10 justify-start text-sm text-white/70 hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resetar narrativa
            </Button>
          )}
        </section>
      </div>
    </aside>
  )
}