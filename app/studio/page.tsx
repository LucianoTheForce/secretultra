
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  Loader2, Plus, Sparkles, ChevronUp, ChevronDown,
  ZoomIn, ZoomOut, Download, Share2, Maximize2, Eraser
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  CHARACTER_CONFIG,
  type CharacterPresetCategory,
  type CharacterPresetItem,
} from "@/lib/character-presets"
import { StudioSidebar } from "@/components/studio-sidebar"
import { RightPanel, type FormatOption } from "@/components/right-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useCredits } from "@/hooks/use-credits"
import type { CharacterId, GeneratedImage, Prompt } from "@/types"

const PERSON_GENERATION = "allow_all" as const

const CHARACTER_LIST = (Object.keys(CHARACTER_CONFIG) as CharacterId[])
  .filter((id) => id !== "CUSTOM")
  .map((id) => ({
    id,
    name: CHARACTER_CONFIG[id].name,
    preview: CHARACTER_CONFIG[id].references[0] ?? "/ultragaz-character-in-living-room.jpg",
  }))

const PRESET_SECTIONS: { key: CharacterPresetCategory; title: string }[] = [
  { key: "poses", title: "Poses" },
  { key: "expressions", title: "Expressions" },
  { key: "lighting", title: "Lighting" },
  { key: "scenarios", title: "Scenes" },
]

type SelectedPresetState = Partial<Record<CharacterPresetCategory, CharacterPresetItem | undefined>>

function formatSeconds(value: number) {
  return value >= 10 ? `${Math.round(value)}s` : `${value.toFixed(1)}s`
}

function formatDateLabel(value?: string) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return "Today"
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
}

function formatTimeLabel(value?: string) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return "just now"
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
export default function StudioPage() {
  const router = useRouter()
  const { data: creditData, refetch: refetchCredits } = useCredits()

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("ULLY")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined)
  const [lastDescription, setLastDescription] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null)
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const currentImage = useMemo(
    () => history.find((item) => item.imagePath === generatedImage) ?? history[0],
    [history, generatedImage],
  )

  const [credits, setCredits] = useState<number | null>(null)
  const [totalGenerated, setTotalGenerated] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [selectedPresets, setSelectedPresets] = useState<SelectedPresetState>({})
  const characterConfig = CHARACTER_CONFIG[selectedCharacter]

  const generationStartRef = useRef<number | null>(null)
  const generationTimerRef = useRef<NodeJS.Timeout | number | null>(null)
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState<number | null>(null)
  const [lastGenerationDurationSeconds, setLastGenerationDurationSeconds] = useState<number | null>(null)

  const [prompt, setPrompt] = useState<Prompt>({
    text: "",
    creativity: 0.7,
    seed: "random",
  })
  const [imageCount, setImageCount] = useState<1 | 2 | 3 | 4>(1)
  const [zoomLevel, setZoomLevel] = useState(1)

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
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          setHistory(sorted)
          setGeneratedImage((prev) => prev ?? sorted[0]?.imagePath)
          setLastDescription((prev) => prev ?? sorted[0]?.description ?? null)
          setSelectedImageIndex(0)
        }
      } catch (error) {
        console.error("[studio] Failed to load history", error)
      }
    }

    void loadHistory()
  }, [])

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (history.length === 0) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const newIndex = Math.max(0, selectedImageIndex - 1)
        setSelectedImageIndex(newIndex)
        setGeneratedImage(history[newIndex]?.imagePath)
        setLastDescription(history[newIndex]?.description ?? null)
        setGenerationError(null)
        
        // Scroll the thumbnail into view
        const element = document.querySelector(`[data-image-index="${newIndex}"]`)
        element?.scrollIntoView({ behavior: 'smooth', inline: 'center' })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const newIndex = Math.min(history.length - 1, selectedImageIndex + 1)
        setSelectedImageIndex(newIndex)
        setGeneratedImage(history[newIndex]?.imagePath)
        setLastDescription(history[newIndex]?.description ?? null)
        setGenerationError(null)
        
        // Scroll the thumbnail into view
        const element = document.querySelector(`[data-image-index="${newIndex}"]`)
        element?.scrollIntoView({ behavior: 'smooth', inline: 'center' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history, selectedImageIndex])

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
          aspectRatio: selectedFormat || "16:9",
          personGeneration: PERSON_GENERATION,
          count: imageCount,
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

        const data: {
          images?: GeneratedImage[]
          description?: string
          error?: string
          credits?: number
          totalGenerated?: number
        } = await res.json()

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
          setSelectedImageIndex(0)
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
    const target = currentImage
    if (!target) {
      console.info("[studio] No image selected to export")
      return
    }

    const downloadUrl = target.backgroundRemovedUrl ?? target.shareUrl ?? target.imagePath
    window.open(downloadUrl, "_blank", "noopener,noreferrer")
  }

  const handleShare = async () => {
    const target = currentImage
    if (!target) {
      console.info("[studio] No image selected to share")
      return
    }

    const link = target.shareUrl ?? target.imagePath
    try {
      await navigator.clipboard.writeText(link)
      console.info("[studio] Share link copied to clipboard")
    } catch (error) {
      console.error("[studio] Failed to copy share link", error)
      window.open(link, "_blank", "noopener,noreferrer")
    }
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

  const handlePromptChange = (update: Partial<Prompt>) => {
    setPrompt((prev) => ({ ...prev, ...update }))
  }

  const handleHelperReset = () => {
    setPrompt((prev) => ({ ...prev, seed: "random", creativity: 0.7 }))
    setSelectedFormat(null)
  }

  const handleApplyHelper = (helper: string) => {
    setPrompt((prev) => {
      const trimmed = prev.text.trim()
      const nextText = trimmed.length === 0 ? helper : `${trimmed}\n${helper}`
      return { ...prev, text: nextText }
    })
  }

  const handleVariation = (image: GeneratedImage) => {
    setPrompt((prev) => ({ ...prev, text: image.prompt }))
  }

  const handleUpscale = (image: GeneratedImage) => {
    const target = image.backgroundRemovedUrl ?? image.shareUrl ?? image.imagePath
    window.open(target, "_blank", "noopener,noreferrer")
  }

  const selectedPresetList = Object.values(selectedPresets).filter(
    (preset): preset is CharacterPresetItem => Boolean(preset),
  )

  const heroDateLabel = formatDateLabel(currentImage?.createdAt)
  const promptPreview =
    prompt.text.trim().length > 0
      ? prompt.text
      : currentImage?.prompt ?? ""

  const otherResults = useMemo(
    () => history.filter((item) => item.imagePath !== currentImage?.imagePath),
    [history, currentImage],
  )

  const heroTiles = useMemo(() => {
    const unique = new Map<string, GeneratedImage>()
    if (currentImage) {
      unique.set(currentImage.id, currentImage)
    }
    for (const item of otherResults) {
      if (!unique.has(item.id)) {
        unique.set(item.id, item)
      }
      if (unique.size === 4) {
        break
      }
    }
    if (unique.size === 0 && history.length > 0) {
      unique.set(history[0].id, history[0])
    }
    return Array.from(unique.values()).slice(0, 4)
  }, [currentImage, otherResults, history])

  const remainingResults = useMemo(
    () => otherResults.filter((item) => heroTiles.every((tile) => tile.id !== item.id)),
    [otherResults, heroTiles],
  )

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-slate-100">
      <StudioSidebar
        credits={credits}
        totalGenerated={totalGenerated}
        isGenerating={isGenerating}
        onNewChat={() => console.info("[studio] New chat requested")}
        onManageCredits={() => router.push("/admin/credits")}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-auto px-6 py-8 lg:px-12">
          <div className="flex h-full w-full min-w-0 gap-6">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-lg">
              <header className="flex items-center justify-center relative border-b border-white/10 bg-neutral-900/60 px-8 py-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    className="p-2 rounded-lg hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-neutral-400 min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    className="p-2 rounded-lg hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute right-8 flex items-center gap-3">
                  {isGenerating ? (
                    <Badge className="flex items-center gap-2 border border-violet-400/40 bg-violet-500/10 text-[11px] text-violet-100">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {`Generating ${formatSeconds(generationElapsedSeconds ?? 0)}`}
                    </Badge>
                  ) : lastGenerationDurationSeconds !== null ? (
                    <Badge variant="outline" className="border-white/15 bg-white/10 text-[11px] text-slate-300">
                      {`Last ${formatSeconds(lastGenerationDurationSeconds)}`}
                    </Badge>
                  ) : null}
                </div>
              </header>

              {generationProgress > 0 && (
                <div className="px-8">
                  <Progress value={Math.min(generationProgress, 100)} className="h-1 rounded-none bg-white/5" />
                </div>
              )}

              <main className="flex-1 overflow-hidden">
                <div className="flex h-full flex-col">
                  <div className="flex-1 overflow-y-auto p-6">
                    <HeroShowcase
                      currentImage={currentImage}
                      zoomLevel={zoomLevel}
                      generationError={generationError}
                      onVariation={handleVariation}
                      onUpscale={handleUpscale}
                      onZoomChange={setZoomLevel}
                    />

                  </div>

                  <footer className="border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-md">
                    <div className="px-6 py-4">
                      <div className="flex items-center rounded-2xl bg-neutral-800/60 backdrop-blur-sm px-3 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-neutral-700/60 text-neutral-400 hover:text-white flex-shrink-0"
                        title="Upload reference"
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                      
                      <div className="flex-1 flex items-center px-3">
                        <span className="text-xs text-gray-500 mr-2">/imagine</span>
                        <input
                          type="text"
                          value={prompt.text}
                          onChange={(event) => setPrompt((prev) => ({ ...prev, text: event.target.value }))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault()
                              if (!isGenerating && prompt.text.trim()) {
                                handleGenerate()
                              }
                            }
                          }}
                          placeholder="a portrait of a robot, digital art"
                          className="flex-1 bg-transparent text-base text-white placeholder:text-gray-500 focus:outline-none"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1 mr-3">
                        <div className="flex items-center bg-neutral-700/40 rounded-lg px-3 py-1">
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={imageCount}
                            onChange={(e) => {
                              const value = parseInt(e.target.value)
                              if (value >= 1 && value <= 4) {
                                setImageCount(value as 1 | 2 | 3 | 4)
                              }
                            }}
                            className="w-8 bg-transparent text-white text-center focus:outline-none"
                          />
                          <div className="flex flex-col ml-1">
                            <button
                              onClick={() => setImageCount(Math.min(4, imageCount + 1) as 1 | 2 | 3 | 4)}
                              className="text-neutral-400 hover:text-white transition-colors h-3"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setImageCount(Math.max(1, imageCount - 1) as 1 | 2 | 3 | 4)}
                              className="text-neutral-400 hover:text-white transition-colors h-3"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || (credits !== null && credits <= 0)}
                        className="h-10 px-6 rounded-2xl bg-[#5b3ef8] text-white hover:bg-[#6b4ef8] text-sm font-medium flex-shrink-0"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                      </div>
                    </div>
                    
                    {history.length > 0 && (
                      <div className="border-t border-neutral-700/50 px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-white/70">Latest Generations</p>
                          <Badge variant="secondary" className="bg-neutral-800/60 text-[10px] text-white/60">
                            {history.length} total
                          </Badge>
                        </div>
                        <div 
                          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
                          onWheel={(e) => {
                            // Scroll horizontally with any wheel movement (including middle button)
                            if (e.deltaY !== 0) {
                              e.preventDefault()
                              e.currentTarget.scrollLeft += e.deltaY
                            } else if (e.deltaX !== 0) {
                              e.preventDefault()
                              e.currentTarget.scrollLeft += e.deltaX
                            }
                          }}
                          ref={(el) => {
                            if (el) {
                              // Add passive:false to prevent default behavior
                              el.addEventListener('wheel', (e) => {
                                e.preventDefault()
                              }, { passive: false })
                            }
                          }}
                        >
                          {history.map((image, index) => (
                            <button
                              key={image.id}
                              data-image-index={index}
                              onClick={() => {
                                setSelectedImageIndex(index)
                                setGeneratedImage(image.imagePath)
                                setLastDescription(image.description ?? null)
                                setGenerationError(null)
                              }}
                              className={cn(
                                "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                selectedImageIndex === index
                                  ? "border-[#5b3ef8] shadow-lg shadow-[#5b3ef8]/30"
                                  : "border-transparent hover:border-neutral-600"
                              )}
                            >
                              <Image
                                src={image.imagePath}
                                alt={image.prompt}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                              {selectedImageIndex === index && (
                                <div className="absolute inset-0 bg-[#5b3ef8]/10 pointer-events-none" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </footer>
                </div>
              </main>
            </div>

            <div className="hidden xl:flex w-[360px] flex-shrink-0">
              <RightPanel
                className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#07070d]"
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
                prompt={prompt}
                onPromptChange={handlePromptChange}
                onReset={handleHelperReset}
                onApplyHelper={handleApplyHelper}
                characters={CHARACTER_LIST}
                selectedCharacter={selectedCharacter}
                onCharacterSelect={(id) => {
                  setSelectedCharacter(id)
                  setSelectedPresets({})
                  setLastDescription(null)
                  setGenerationError(null)
                }}
                presetSections={PRESET_SECTIONS}
                categoryItems={characterConfig.categories}
                selectedPresets={selectedPresets}
                onPresetSelect={handlePresetSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroShowcase({
  currentImage,
  zoomLevel,
  generationError,
  onVariation,
  onUpscale,
  onZoomChange,
}: {
  currentImage?: GeneratedImage
  zoomLevel: number
  generationError: string | null
  onVariation: (image: GeneratedImage) => void
  onUpscale: (image: GeneratedImage) => void
  onZoomChange?: (level: number) => void
}) {
  const [showControls, setShowControls] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMiddleMouseDragging = false
    let startY = 0
    let startZoom = zoomLevel

    const handleWheel = (e: WheelEvent) => {
      // Zoom with Ctrl/Cmd + scroll OR with middle mouse button held
      if (e.ctrlKey || e.metaKey || e.buttons === 4) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta))
        onZoomChange?.(newZoom)
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button = 1)
      if (e.button === 1) {
        e.preventDefault()
        isMiddleMouseDragging = true
        startY = e.clientY
        startZoom = zoomLevel
        document.body.style.cursor = 'ns-resize'
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isMiddleMouseDragging) {
        e.preventDefault()
        const deltaY = (startY - e.clientY) / 100
        const newZoom = Math.max(0.5, Math.min(3, startZoom + deltaY))
        onZoomChange?.(newZoom)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || isMiddleMouseDragging) {
        isMiddleMouseDragging = false
        document.body.style.cursor = ''
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      container.addEventListener('mousedown', handleMouseDown)
      container.addEventListener('auxclick', (e) => e.preventDefault())
      
      // Add document-level listeners for mouse move and up
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
        container.removeEventListener('mousedown', handleMouseDown)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }
  }, [zoomLevel, onZoomChange])

  const handleDownload = () => {
    if (!currentImage) return
    const link = document.createElement('a')
    link.href = currentImage.imagePath
    link.download = `generated-${currentImage.id}.png`
    link.click()
  }

  const handleShare = async () => {
    if (!currentImage) return
    try {
      await navigator.clipboard.writeText(currentImage.imagePath)
      console.info("Image link copied to clipboard")
    } catch (error) {
      console.error("Failed to copy link", error)
    }
  }

  const handleRemoveBackground = () => {
    if (!currentImage) return
    // TODO: Implement background removal
    console.info("Remove background requested for", currentImage.id)
  }

  return (
    <div className="h-full flex flex-col">
      {generationError && (
        <div className="mx-auto mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-3">
          <p className="text-sm text-red-200">{generationError}</p>
        </div>
      )}
      
      {currentImage ? (
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div 
            className="relative"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease',
              transformOrigin: 'center'
            }}
          >
            <Image
              src={currentImage.imagePath}
              alt={currentImage.prompt}
              width={800}
              height={800}
              className="rounded-xl shadow-2xl"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {showControls && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-3 rounded-xl bg-black/80 backdrop-blur-md">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition"
                  title="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => currentImage && onUpscale(currentImage)}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition"
                  title="Upscale"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRemoveBackground}
                  className="p-2 rounded-lg hover:bg-white/20 text-white transition"
                  title="Remove Background"
                >
                  <Eraser className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-lg text-neutral-400 mb-2">No images generated yet</p>
            <p className="text-sm text-neutral-500">Start by typing a prompt below and clicking Generate</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Removido HeroTile - não mais necessário no modo de imagem única
/*
function HeroTile({
  image,
  isActive,
  selectedFormat,
  onSelect,
  onVariation,
  onUpscale,
}: {
  image?: GeneratedImage
  isActive: boolean
  selectedFormat: FormatOption | null
  onSelect: () => void
  onVariation: () => void
  onUpscale: () => void
}) {
  const src = image?.imagePath ?? "/ultragaz-character-in-living-room.jpg"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 transition duration-300 aspect-square",
        isActive ? "border-[#5b3ef8]" : "border-transparent hover:border-neutral-700"
      )}
    >
      <button
        type="button"
        className="relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        onClick={onSelect}
        disabled={!image}
      >
        <Image 
          src={src} 
          alt={image?.prompt ?? "Generated result"} 
          fill 
          sizes="(min-width: 1024px) 50vw, 100vw" 
          className="object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition" />
      </button>
      
      {image && (
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-9 rounded-lg bg-white/90 text-black hover:bg-white text-xs font-medium"
              onClick={onVariation}
            >
              Variation
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-9 rounded-lg bg-white/90 text-black hover:bg-white text-xs font-medium"
              onClick={onUpscale}
            >
              Upscale
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
*/

function CharacterQuickSelect({
  characters,
  selectedCharacter,
  onSelect,
}: {
  characters: { id: CharacterId; name: string; preview: string }[]
  selectedCharacter: CharacterId
  onSelect: (id: CharacterId) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Character</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelect(character.id)}
            className={cn(
              "group relative h-28 w-40 overflow-hidden rounded-2xl border text-left transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              selectedCharacter === character.id
                ? "border-[#5b3ef8]"
                : "border-white/10",
            )}
          >
            <Image
              src={character.preview}
              alt={character.name}
              fill
              sizes="160px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-sm font-semibold text-white">{character.name}</p>
              {selectedCharacter === character.id && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200">Active</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
function PresetQuickPick({
  category,
  title,
  items,
  selected,
  onSelect,
}: {
  category: CharacterPresetCategory
  title: string
  items: CharacterPresetItem[]
  selected?: CharacterPresetItem
  onSelect: (category: CharacterPresetCategory, preset: CharacterPresetItem) => void
}) {
  const visible = items.slice(0, 4)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
        <span>{title}</span>
        <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px]">
          {items.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(category, item)}
            className={cn(
              "group relative h-24 overflow-hidden rounded-2xl border text-left transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              selected?.id === item.id ? "border-violet-400/60" : "border-white/10",
            )}
          >
            <Image
              src={item.image}
              alt={item.label}
              fill
              sizes="200px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <p className="text-[11px] font-semibold text-white line-clamp-2">{item.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}


function parseSeed(value: Prompt["seed"]): number | undefined {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim().length > 0 && value !== "random") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}
