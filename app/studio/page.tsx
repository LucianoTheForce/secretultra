"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { CHARACTER_CONFIG, type CharacterPresetCategory, type CharacterPresetItem } from "@/lib/character-presets"
import { CanvasPro } from "@/components/canvas-pro"
import { LeftPanel } from "@/components/left-panel"
import { RightPanel, type FormatOption } from "@/components/right-panel"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCredits } from "@/hooks/use-credits"
import type { CharacterId, GeneratedImage, Prompt } from "@/types"

const PERSON_GENERATION = "allow_all" as const

function parseSeed(value: Prompt["seed"]): number | undefined {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim().length > 0 && value !== "random") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export default function StudioPage() {
  const router = useRouter()
  const { data: creditData, refetch: refetchCredits } = useCredits()

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("ULLY")
  const [zoom, setZoom] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined)
  const [lastDescription, setLastDescription] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>("16:9")
  const [history, setHistory] = useState<GeneratedImage[]>([])

  const [credits, setCredits] = useState<number | null>(null)
  const [totalGenerated, setTotalGenerated] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [selectedPresets, setSelectedPresets] = useState<Partial<Record<CharacterPresetCategory, CharacterPresetItem | undefined>>>({})
  const characterConfig = CHARACTER_CONFIG[selectedCharacter]
  const generationStartRef = useRef<number | null>(null)
  const generationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState<number | null>(null)
  const [lastGenerationDurationSeconds, setLastGenerationDurationSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (isGenerating) {
      if (generationTimerRef.current !== null) {
        clearInterval(generationTimerRef.current)
      }

      generationStartRef.current = performance.now()
      setGenerationElapsedSeconds(0)
      setLastGenerationDurationSeconds(null)

      generationTimerRef.current = window.setInterval(() => {
        if (generationStartRef.current === null) return
        const elapsed = (performance.now() - generationStartRef.current) / 1000
        setGenerationElapsedSeconds(elapsed)
      }, 100)

      return () => {
        if (generationTimerRef.current !== null) {
          clearInterval(generationTimerRef.current)
          generationTimerRef.current = null
        }
      }
    }

    if (generationTimerRef.current !== null) {
      clearInterval(generationTimerRef.current)
      generationTimerRef.current = null
    }

    if (generationStartRef.current !== null) {
      const duration = (performance.now() - generationStartRef.current) / 1000
      setLastGenerationDurationSeconds(duration)
      generationStartRef.current = null
    }

    setGenerationElapsedSeconds(null)
  }, [isGenerating])

  useEffect(() => {
    if (!creditData) return
    setCredits(creditData.credits)
    setTotalGenerated(creditData.totalGenerated)
    setIsAdmin(creditData.isAdmin)
  }, [creditData])


  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/images/history", { cache: "no-store" })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = (await res.json()) as { images?: GeneratedImage[] }
        if (Array.isArray(json.images) && json.images.length > 0) {
          const sorted = [...json.images].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setHistory(sorted)
          setGeneratedImage((prev) => prev ?? sorted[0]?.imagePath)
          setLastDescription((prev) => prev ?? sorted[0]?.description ?? null)
        }
      } catch (error) {
        console.error("[studio] Failed to load history", error)
      }
    }

    void loadHistory()
  }, [])

  const formatSeconds = (value: number) => (value >= 10 ? `${Math.round(value)}s` : `${value.toFixed(1)}s`)

  const [prompt, setPrompt] = useState<Prompt>({
    text: "",
    creativity: 0.7,
    seed: "random",
  })

  const handleGenerate = () => {
    ;(async () => {
      try {
        setLastDescription(null)
        setGenerationError(null)

        if (credits !== null && credits <= 0) {
          setGenerationError("Voce nao tem creditos suficientes. Peca ao administrador para liberar mais creditos.")
          return
        }

        setIsGenerating(true)
        setGenerationProgress(10)

        const presetPrompts = Object.values(selectedPresets)
          .map((preset) => preset?.prompt ?? "")
          .filter((value) => value.trim().length > 0)
        const finalPrompt =
          presetPrompts.length > 0 ? `${prompt.text.trim()}\n${presetPrompts.join("\n")}` : prompt.text
        const seed = parseSeed(prompt.seed)

        const payload = {
          prompt: finalPrompt,
          temperature: prompt.creativity,
          seed,
          aspectRatio: selectedFormat,
          personGeneration: PERSON_GENERATION,
        }

        console.info("[studio] Sending generation request", {
          ...payload,
          referenceImageStrategy: "server-managed-character-sheet",
        })

        const res = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data: { images?: GeneratedImage[]; description?: string; error?: string; credits?: number; totalGenerated?: number } = await res.json()

        if (!res.ok || data.error) {
          throw new Error(data.error || "Image generation failed")
        }

        setGenerationProgress(85)

        if (Array.isArray(data.images) && data.images.length > 0) {
          const images = data.images
          setHistory((prev) => {
            const existingIds = new Set(prev.map((item) => item.id))
            const nextItems = [
              ...images.filter((item) => !existingIds.has(item.id)),
              ...prev,
            ]
            return nextItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          })
          setGeneratedImage(images[0].imagePath)
          setLastDescription(images[0].description ?? data.description ?? null)
        } else {
          setLastDescription(data.description ?? null)
        }

        if (typeof data.credits === "number") {
          setCredits(data.credits)
        } else {
          void refetchCredits()
        }

        if (typeof data.totalGenerated === "number") {
          setTotalGenerated(data.totalGenerated)
        }
      } catch (error) {
        void refetchCredits()
        const message = error instanceof Error ? error.message : "Unexpected error"
        console.error(error)
        setGenerationError(message)
      } finally {
        setIsGenerating(false)
        setGenerationProgress(100)
        setTimeout(() => setGenerationProgress(0), 500)
      }
    })()
  }

  const handlePresetSelect = (category: CharacterPresetCategory, preset: CharacterPresetItem) => {
    setSelectedPresets((prev) => {
      const alreadySelected = prev[category]?.id === preset.id
      return {
        ...prev,
        [category]: alreadySelected ? undefined : preset,
      }
    })
  }

  const handleExport = () => {
    console.log("Exporting...")
  }

  const handleShare = () => {
    console.log("Sharing...")
  }

  useEffect(() => {
    const handleHistoryNavigation = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return
      }

      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)
      ) {
        return
      }

      if (history.length === 0) {
        return
      }

      const currentIndex = history.findIndex((image) => image.imagePath === generatedImage)
      let nextIndex = currentIndex

      if (event.key === "ArrowLeft") {
        nextIndex = currentIndex === -1 ? 0 : Math.min(history.length - 1, currentIndex + 1)
      } else {
        nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1
      }

      if (nextIndex === currentIndex && currentIndex !== -1) {
        return
      }

      const nextImage = history[nextIndex]
      if (!nextImage) {
        return
      }

      event.preventDefault()
      setGeneratedImage(nextImage.imagePath)
      setLastDescription(nextImage.description ?? null)
      setGenerationError(null)
    }

    window.addEventListener("keydown", handleHistoryNavigation)
    return () => {
      window.removeEventListener("keydown", handleHistoryNavigation)
    }
  }, [history, generatedImage])

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        isGenerating={isGenerating}
        generationProgress={generationProgress}
        generationElapsedSeconds={generationElapsedSeconds}
        lastGenerationDurationSeconds={lastGenerationDurationSeconds}
        zoom={zoom}
        onZoomChange={setZoom}
        onGenerate={handleGenerate}
        onExport={handleExport}
        onShare={handleShare}
        credits={credits}
        totalGenerated={totalGenerated}
        isAdmin={isAdmin}
        onManageCredits={() => router.push("/admin/credits")}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          selectedCharacter={selectedCharacter}
          onCharacterChange={(id) => {
            setSelectedCharacter(id)
            setSelectedPresets({})
            setLastDescription(null)
            setGenerationError(null)
          }}
          characterConfig={characterConfig}
          selectedPresets={selectedPresets}
          onPresetSelect={handlePresetSelect}
        />

        <div className="flex-1 flex flex-col">
          <CanvasPro zoom={zoom} onZoomChange={setZoom} className="flex-1" imageUrl={generatedImage} />

          {(lastDescription || generationError) && (
            <div className="border-t border-border/70 bg-background/80 px-4 py-3 text-sm h-44 overflow-y-auto space-y-2">
              {lastDescription && (
                <div className="text-muted-foreground whitespace-pre-line">
                  <p className="font-medium text-foreground">Model notes</p>
                  <p>{lastDescription}</p>
                </div>
              )}
              {generationError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                  {generationError}
                </div>
              )}
            </div>
          )}

          <div className={"border-t p-3 flex items-center gap-2 bg-background/95"}>
            <div className="flex-1">
              <Input
                placeholder="What will you imagine?"
                value={prompt.text}
                onChange={(event) => setPrompt((prev) => ({ ...prev, text: event.target.value }))}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.altKey &&
                    !event.ctrlKey &&
                    !event.metaKey
                  ) {
                    event.preventDefault()
                    if (!isGenerating) {
                      handleGenerate()
                    }
                  }
                }}
              />
            </div>
            <Button onClick={handleGenerate} className="gap-2" disabled={isGenerating || (credits !== null && credits <= 0)}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {`Generating ${formatSeconds(generationElapsedSeconds ?? 0)}`}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <RightPanel
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
        />
      </div>

      <div className="border-t px-3 py-2 overflow-x-auto">
        <div className="flex items-center gap-3 min-h-[70px]">
          {history.length === 0 ? (
            <span className="text-xs text-muted-foreground">No generations yet</span>
          ) : (
            history.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => {
                  setGeneratedImage(image.imagePath)
                  setLastDescription(image.description ?? null)
                  setGenerationError(null)
                }}
                className={cn(
                  "relative rounded-md border transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  generatedImage === image.imagePath ? "border-primary" : "border-border"
                )}
              >
                <Image
                  src={image.imagePath}
                  alt={image.prompt}
                  width={72}
                  height={72}
                  className="h-16 w-16 rounded-md object-cover"
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
