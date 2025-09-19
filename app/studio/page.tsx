"use client"

import { useState } from "react"
import Image from "next/image"
import { Sparkles } from "lucide-react"

import { CanvasPro } from "@/components/canvas-pro"
import { LeftPanel } from "@/components/left-panel"
import { RightPanel, type FormatOption } from "@/components/right-panel"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CharacterId, Prompt } from "@/types"

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
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("ULLY")
  const [zoom, setZoom] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined)
  const [lastDescription, setLastDescription] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>("16:9")

  const [prompt, setPrompt] = useState<Prompt>({
    text: "",
    creativity: 0.7,
    seed: "random",
  })

  const loadAsBase64 = async (path: string): Promise<string> => {
    try {
      const res = await fetch(path, { cache: "force-cache" })
      if (!res.ok) return ""
      const blob = await res.blob()
      const bitmap = await createImageBitmap(blob)
      const maxSide = 1024
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return ""
      ctx.drawImage(bitmap, 0, 0, width, height)
      const dataUrl = canvas.toDataURL("image/png")
      return dataUrl.split(",").pop() ?? ""
    } catch (error) {
      console.error("Failed to prepare reference image", error)
      return ""
    }
  }

  const findSheetUrl = async (): Promise<string | null> => {
    for (const candidate of ["/ultragaz-character-sheet.png", "/ultragaz-character-sheet.jpg"]) {
      try {
        const response = await fetch(candidate, { method: "HEAD", cache: "no-store" })
        if (response.ok) return candidate
      } catch {
        // ignore fetch errors for missing assets
      }
    }
    return null
  }

  const loadSheetBase64 = async (): Promise<string> => {
    const url = await findSheetUrl()
    return url ? await loadAsBase64(url) : ""
  }

  const handleGenerate = () => {
    ;(async () => {
      try {
        setLastDescription(null)
        setGenerationError(null)
        setIsGenerating(true)
        setGenerationProgress(10)

        const sheet = await loadSheetBase64()
        const seed = parseSeed(prompt.seed)

        const res = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.text,
            temperature: prompt.creativity,
            referenceImages: sheet ? [sheet] : [],
            seed,
            aspectRatio: selectedFormat,
            personGeneration: PERSON_GENERATION,
          }),
        })

        const data: {
          images?: string[]
          description?: string
          error?: string
        } = await res.json()

        if (!res.ok || data.error) {
          throw new Error(data.error || "Image generation failed")
        }

        setGenerationProgress(85)

        if (data.images && data.images.length > 0) {
          const firstImage = data.images[0]
          const isUrl = firstImage.startsWith("/") || firstImage.startsWith("http")
          const imageUrl = isUrl ? firstImage : `data:image/png;base64,${firstImage}`
          setGeneratedImage(imageUrl)
        }

        setLastDescription(data.description ?? null)
      } catch (error) {
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

  const handlePresetSelect = (category: "pose" | "expression" | "background" | "lighting", presetId: string) => {
    console.log(`Selected ${category}: ${presetId}`)
  }

  const handleExport = () => {
    console.log("Exporting...")
  }

  const handleShare = () => {
    console.log("Sharing...")
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        isGenerating={isGenerating}
        generationProgress={generationProgress}
        zoom={zoom}
        onZoomChange={setZoom}
        onGenerate={handleGenerate}
        onExport={handleExport}
        onShare={handleShare}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          selectedCharacter={selectedCharacter}
          onCharacterChange={async (id) => {
            setSelectedCharacter(id)
            setLastDescription(null)
            setGenerationError(null)
            if (id === "ULTRINHO") {
              const url = await findSheetUrl()
              setGeneratedImage(url ?? "/3d-boy-character-with-glasses.jpg")
            }
          }}
          onPresetSelect={handlePresetSelect}
        />

        <div className="flex-1 flex flex-col">
          <CanvasPro zoom={zoom} onZoomChange={setZoom} className="flex-1" imageUrl={generatedImage} />

          {(lastDescription || generationError) && (
            <div className="border-t border-border/70 bg-background/80 px-4 py-3 space-y-2 text-sm">
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
              />
            </div>
            <Button onClick={handleGenerate} className="gap-2" disabled={isGenerating}>
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate"}
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
          {generatedImage ? (
            <Image
              src={generatedImage}
              alt="generated"
              width={56}
              height={56}
              unoptimized={generatedImage.startsWith("data:")}
              className="h-14 w-14 rounded-md object-cover border"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}


